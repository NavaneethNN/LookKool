// Dev email client — logs emails to console instead of sending them

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /href="(https?:\/\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export async function sendEmailViaLog(options: SendEmailOptions) {
  const recipients = options.to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", ");
  const preview = stripHtml(options.htmlContent).slice(0, 200);
  const urls = extractUrls(options.htmlContent);

  let output =
    "\n" +
    "╔══════════════════════════════════════════════════════════╗\n" +
    "║  📧 DEV EMAIL (not sent)                                ║\n" +
    "╠══════════════════════════════════════════════════════════╣\n" +
    `║  To:      ${recipients}\n` +
    `║  Subject: ${options.subject}\n` +
    "╠══════════════════════════════════════════════════════════╣\n" +
    `║  ${preview}${preview.length >= 200 ? "…" : ""}\n`;

  if (urls.length > 0) {
    output += "╠══════════════════════════════════════════════════════════╣\n";
    for (const url of urls) {
      output += `║  🔗 ${url}\n`;
    }
  }

  output += "╚══════════════════════════════════════════════════════════╝\n";

  console.log(output);

  return { success: true as const, messageId: `dev-${Date.now()}` };
}
