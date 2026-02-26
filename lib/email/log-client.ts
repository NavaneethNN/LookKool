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

export async function sendEmailViaLog(options: SendEmailOptions) {
  const recipients = options.to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", ");
  const preview = stripHtml(options.htmlContent).slice(0, 200);

  console.log(
    "\n" +
    "╔══════════════════════════════════════════════════════════╗\n" +
    "║  📧 DEV EMAIL (not sent)                                ║\n" +
    "╠══════════════════════════════════════════════════════════╣\n" +
    `║  To:      ${recipients}\n` +
    `║  Subject: ${options.subject}\n` +
    "╠══════════════════════════════════════════════════════════╣\n" +
    `║  ${preview}${preview.length >= 200 ? "…" : ""}\n` +
    "╚══════════════════════════════════════════════════════════╝\n"
  );

  return { success: true as const, messageId: `dev-${Date.now()}` };
}
