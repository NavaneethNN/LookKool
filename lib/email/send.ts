// Environment-aware email dispatcher

import { sendEmailViaBravo } from "./brevo";
import { sendEmailViaLog } from "./log-client";

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

export async function sendEmail(options: SendEmailOptions) {
  if (process.env.NODE_ENV === "production") {
    return sendEmailViaBravo(options);
  }
  return sendEmailViaLog(options);
}
