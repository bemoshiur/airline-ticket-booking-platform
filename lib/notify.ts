/**
 * Outbound email.
 *
 * When SendGrid is not configured, `sendEmail` logs and reports
 * `delivered: false` rather than throwing or pretending to have sent. Callers
 * must not record a notification as delivered on that basis — a price alert
 * that believes it emailed someone will go quiet for its whole cooldown.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface DeliveryResult {
  delivered: boolean;
  reason?: "not_configured" | "rejected" | "error";
}

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";
const TIMEOUT_MS = 10_000;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL
  );
}

export async function sendEmail(
  message: EmailMessage
): Promise<DeliveryResult> {
  if (!isEmailConfigured()) {
    console.warn(
      `Email not configured; would have sent "${message.subject}" to ${message.to}`
    );
    return { delivered: false, reason: "not_configured" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SENDGRID_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL },
        subject: message.subject,
        content: [
          { type: "text/plain", value: message.text },
          ...(message.html
            ? [{ type: "text/html", value: message.html }]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      // Body may echo the recipient address; log the status only.
      console.error(`SendGrid rejected a message with ${response.status}`);
      return { delivered: false, reason: "rejected" };
    }

    return { delivered: true };
  } catch (error) {
    console.error("Email delivery failed:", error);
    return { delivered: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}
