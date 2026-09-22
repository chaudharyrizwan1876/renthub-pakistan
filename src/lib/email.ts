import "server-only";
import { SITE } from "./site";

/**
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Without RESEND_API_KEY: development prints the message; production logs only a warning (no links/tokens).
 */
export async function sendEmail(to: string, subject: string, html: string, devPreview?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") console.info(`[email:dev] to=${to} subject="${subject}"\n${devPreview ?? ""}`);
    else console.warn("[email] RESEND_API_KEY not set, email not sent");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = `<p>Assalam o Alaikum,</p><p>We received a request to reset your ${SITE.name} password. This link is valid for 1 hour:</p><p><a href="${link}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>`;
  return sendEmail(to, `Reset your ${SITE.name} password`, html, link);
}
