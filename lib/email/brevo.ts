const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

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
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set — skipping email");
    return;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "LookKool", email: "no-reply@lookkool.in" },
        to: options.to,
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Brevo email error:", res.status, body);
    }
  } catch (err) {
    console.error("Failed to send email via Brevo:", err);
  }
}

// ─── Email Templates ───────────────────────────────────────────

function emailLayout(body: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #470B49; padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 2px; }
    .content { padding: 32px; }
    .footer { padding: 20px 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .btn { display: inline-block; background: #470B49; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .item-row { border-bottom: 1px solid #f0f0f0; padding: 12px 0; }
    .total-row { border-top: 2px solid #470B49; padding-top: 12px; margin-top: 8px; font-weight: 700; }
    h2 { color: #470B49; margin-top: 0; }
    .text-muted { color: #666; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>LOOKKOOL</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LookKool. All rights reserved.</p>
      <p>Women&apos;s Boutique — Curated fashion &amp; accessories</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Order Confirmation ────────────────────────────────────────

interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) => `
    <div class="item-row" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${item.productName}</strong><br/>
        <span style="color: #666; font-size: 13px;">${item.color} / ${item.size} × ${item.quantity}</span>
      </div>
      <div style="font-weight: 600;">₹${(item.price * item.quantity).toFixed(2)}</div>
    </div>`
    )
    .join("");

  const addressHtml = `
    ${data.shippingAddress.name}<br/>
    ${data.shippingAddress.line1}<br/>
    ${data.shippingAddress.line2 ? data.shippingAddress.line2 + "<br/>" : ""}
    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}
  `;

  const body = `
    <h2>Order Confirmed! 🎉</h2>
    <p class="text-muted">
      Hi ${data.customerName},<br/>
      Thank you for shopping with LookKool! Your order <strong>#${data.orderId}</strong> has been placed successfully.
    </p>

    <h3 style="margin-top: 24px; color: #333;">Order Summary</h3>
    ${itemsHtml}

    <div style="margin-top: 16px; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>Subtotal</span><span>₹${data.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>Delivery</span><span>${data.deliveryCharge > 0 ? "₹" + data.deliveryCharge.toFixed(2) : "FREE"}</span>
      </div>
      ${
        data.discountAmount > 0
          ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; color: green;">
              <span>Discount</span><span>-₹${data.discountAmount.toFixed(2)}</span>
            </div>`
          : ""
      }
      <div class="total-row" style="display: flex; justify-content: space-between; font-size: 16px;">
        <span>Total</span><span>₹${data.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div style="margin-top: 24px;">
      <strong>Payment:</strong> ${data.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
    </div>

    <div style="margin-top: 16px;">
      <strong>Shipping to:</strong><br/>
      <span class="text-muted">${addressHtml}</span>
    </div>

    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lookkool.in"}/account" class="btn">View My Orders</a>
    </p>

    <p class="text-muted" style="margin-top: 24px;">
      We&apos;ll send you another email when your order ships. If you have any questions, reply to this email.
    </p>
  `;

  await sendEmail({
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `LookKool — Order #${data.orderId} Confirmed!`,
    htmlContent: emailLayout(body),
  });
}

// ─── Shipping Update ───────────────────────────────────────────

export async function sendShippingUpdate(data: {
  customerName: string;
  customerEmail: string;
  orderId: number;
  status: string;
  trackingNumber?: string | null;
}) {
  const statusMessages: Record<string, string> = {
    Shipped: "Your order has been shipped and is on its way!",
    "Out for Delivery": "Great news — your order is out for delivery today!",
    Delivered: "Your order has been delivered. We hope you love it!",
    Cancelled:
      "Your order has been cancelled. If you didn't request this, please contact us.",
  };

  const message =
    statusMessages[data.status] ||
    `Your order status has been updated to: ${data.status}`;

  const trackingHtml = data.trackingNumber
    ? `<p style="margin-top: 16px;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>`
    : "";

  const body = `
    <h2>Order Update</h2>
    <p class="text-muted">
      Hi ${data.customerName},<br/>
      ${message}
    </p>
    <p><strong>Order #${data.orderId}</strong></p>
    ${trackingHtml}
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lookkool.in"}/account" class="btn">Track Order</a>
    </p>
  `;

  await sendEmail({
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `LookKool — Order #${data.orderId} ${data.status}`,
    htmlContent: emailLayout(body),
  });
}

// ─── Return status ─────────────────────────────────────────────

export async function sendReturnStatusEmail(data: {
  customerName: string;
  customerEmail: string;
  orderId: number;
  returnStatus: string;
  adminNotes?: string;
}) {
  const statusMessages: Record<string, string> = {
    Approved:
      "Your return request has been approved. Please ship the item(s) back to us.",
    Rejected:
      "Unfortunately, your return request has been declined. See notes below for details.",
    Completed:
      "Your return has been processed and the refund will reflect in your account shortly.",
  };

  const message =
    statusMessages[data.returnStatus] ||
    `Your return request status: ${data.returnStatus}`;

  const notesHtml = data.adminNotes
    ? `<div style="margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 6px;">
        <strong>Admin Notes:</strong><br/>
        <span class="text-muted">${data.adminNotes}</span>
      </div>`
    : "";

  const body = `
    <h2>Return Update</h2>
    <p class="text-muted">
      Hi ${data.customerName},<br/>
      ${message}
    </p>
    <p><strong>Order #${data.orderId}</strong></p>
    ${notesHtml}
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lookkool.in"}/account" class="btn">View Details</a>
    </p>
  `;

  await sendEmail({
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `LookKool — Return Request ${data.returnStatus}`,
    htmlContent: emailLayout(body),
  });
}

// ─── Welcome email ─────────────────────────────────────────────

export async function sendWelcomeEmail(data: {
  name: string;
  email: string;
}) {
  const body = `
    <h2>Welcome to LookKool! 💜</h2>
    <p class="text-muted">
      Hi ${data.name},<br/>
      Welcome to the LookKool family! We&apos;re thrilled to have you join our women&apos;s boutique community.
    </p>
    <p class="text-muted">
      Explore our curated collection of fashion, accessories, and more — handpicked just for you.
    </p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lookkool.in"}" class="btn">Start Shopping</a>
    </p>
    <p class="text-muted" style="font-size: 13px; margin-top: 24px;">
      As a new member, keep an eye on your inbox for exclusive offers and early access to new arrivals!
    </p>
  `;

  await sendEmail({
    to: [{ email: data.email, name: data.name }],
    subject: "Welcome to LookKool! 💜",
    htmlContent: emailLayout(body),
  });
}
