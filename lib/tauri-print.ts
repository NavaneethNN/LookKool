/**
 * lib/tauri-print.ts
 * ─────────────────────────────────────────────────────────────
 * Desktop printing utilities for Tauri.
 * Falls back to browser window.open() when not running in Tauri.
 */

type PrinterInfo = {
  name: string;
  is_default: boolean;
};

/** Check if running inside Tauri desktop app */
export function isTauriApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Get all available printers (desktop only) */
export async function getPrinters(): Promise<PrinterInfo[]> {
  if (!isTauriApp()) return [];
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<PrinterInfo[]>("get_printers");
  } catch (e) {
    console.error("Failed to get printers:", e);
    return [];
  }
}

/**
 * Print an invoice/bill.
 * - In Tauri: uses native print dialog via webview
 * - In browser: opens in new window
 */
export async function printBill(
  billId: number,
  options?: { printerName?: string; thermal?: boolean }
): Promise<void> {
  if (!isTauriApp()) {
    // Browser fallback – open invoice in new tab
    window.open(`/api/invoice/bill/${billId}`, "_blank");
    return;
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");

    if (options?.thermal && options?.printerName) {
      // Direct thermal print
      await invoke("print_thermal", {
        billId,
        printerName: options.printerName,
      });
    } else {
      // Standard print dialog
      await invoke("print_invoice", { billId });
    }
  } catch (e) {
    console.error("Print failed, falling back to browser:", e);
    window.open(`/api/invoice/bill/${billId}`, "_blank");
  }
}

/**
 * Print raw text content to a specific printer.
 * (For ESC/POS thermal receipt printers)
 */
export async function printRaw(
  printerName: string,
  content: string
): Promise<boolean> {
  if (!isTauriApp()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("print_raw", { printerName, content });
    return true;
  } catch (e) {
    console.error("Raw print failed:", e);
    return false;
  }
}
