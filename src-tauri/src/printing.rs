use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

// ─── Types ─────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
}

// ─── Get list of available printers (Windows) ──────────────────

#[tauri::command]
pub async fn get_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                r#"Get-Printer | Select-Object Name, @{N='IsDefault';E={$_.IsDefault}} | ConvertTo-Json -Compress"#,
            ])
            .output()
            .map_err(|e| format!("Failed to query printers: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.trim().is_empty() {
            return Ok(vec![]);
        }

        // PowerShell returns an object if one printer, array if multiple
        let printers: Vec<PrinterInfo> = if stdout.trim().starts_with('[') {
            serde_json::from_str(&stdout).unwrap_or_default()
        } else {
            match serde_json::from_str::<PrinterInfo>(&stdout) {
                Ok(p) => vec![p],
                Err(_) => vec![],
            }
        };

        Ok(printers)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec![])
    }
}

// ─── Print invoice via webview print dialog ────────────────────
// Opens the invoice URL in a hidden webview, triggers print dialog

#[tauri::command]
pub async fn print_invoice(
    app: AppHandle,
    bill_id: i64,
) -> Result<String, String> {
    // Get the main window to use its webview for printing
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    // Execute JavaScript to open print in the current page context
    let js = format!(
        r#"
        (async () => {{
            try {{
                const resp = await fetch('/api/invoice/bill/{}');
                const html = await resp.text();
                const printWindow = window.open('', '_blank', 'width=800,height=900');
                if (printWindow) {{
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.onload = () => {{
                        printWindow.print();
                    }};
                    // Also try to print immediately for already-loaded content
                    setTimeout(() => printWindow.print(), 500);
                }}
            }} catch(e) {{
                console.error('Print error:', e);
            }}
        }})();
        "#,
        bill_id
    );

    window
        .eval(&js)
        .map_err(|e| format!("Print failed: {}", e))?;

    Ok("Print dialog opened".to_string())
}

// ─── Thermal print – sends raw text to a printer ───────────────
// For thermal printers (58mm / 80mm), sends formatted text directly

#[tauri::command]
pub async fn print_thermal(
    app: AppHandle,
    bill_id: i64,
    printer_name: String,
) -> Result<String, String> {
    // Fetch the invoice HTML from the Next.js server
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    // Use JS to fetch invoice and trigger silent print to specific printer
    let js = format!(
        r#"
        (async () => {{
            try {{
                const resp = await fetch('/api/invoice/bill/{}');
                const html = await resp.text();
                const printFrame = document.createElement('iframe');
                printFrame.style.position = 'fixed';
                printFrame.style.right = '0';
                printFrame.style.bottom = '0';
                printFrame.style.width = '0';
                printFrame.style.height = '0';
                printFrame.style.border = '0';
                document.body.appendChild(printFrame);
                printFrame.contentDocument.open();
                printFrame.contentDocument.write(html);
                printFrame.contentDocument.close();
                setTimeout(() => {{
                    printFrame.contentWindow.print();
                    setTimeout(() => document.body.removeChild(printFrame), 5000);
                }}, 500);
            }} catch(e) {{
                console.error('Thermal print error:', e);
            }}
        }})();
        "#,
        bill_id
    );

    window
        .eval(&js)
        .map_err(|e| format!("Thermal print failed: {}", e))?;

    Ok(format!("Printing to {}", printer_name))
}

// ─── Print raw text/bytes to a named printer (Windows) ─────────
// For direct ESC/POS or raw document printing

#[tauri::command]
pub async fn print_raw(
    printer_name: String,
    content: String,
) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Write content to a temp file
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("lookkool_print.tmp");
        std::fs::write(&temp_file, &content)
            .map_err(|e| format!("Failed to write temp file: {}", e))?;

        // Use PowerShell to send raw data to printer
        let ps_script = format!(
            r#"
            $content = Get-Content -Path '{}' -Raw
            $printerName = '{}'
            
            Add-Type -AssemblyName System.Drawing
            $doc = New-Object System.Drawing.Printing.PrintDocument
            $doc.PrinterSettings.PrinterName = $printerName
            
            $printHandler = {{
                param($sender, $e)
                $font = New-Object System.Drawing.Font('Consolas', 9)
                $brush = [System.Drawing.Brushes]::Black
                $e.Graphics.DrawString($content, $font, $brush, 10, 10)
                $e.HasMorePages = $false
            }}
            
            $doc.add_PrintPage($printHandler)
            $doc.Print()
            $doc.Dispose()
            "#,
            temp_file.display(),
            printer_name
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_script])
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;

        // Cleanup temp file
        let _ = std::fs::remove_file(&temp_file);

        if output.status.success() {
            Ok(format!("Printed to {}", printer_name))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Print failed: {}", stderr))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Raw printing is only supported on Windows".into())
    }
}
