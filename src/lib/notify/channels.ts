import nodemailer from "nodemailer";

export type ChannelResult = { status: "SENT" | "FAILED" | "SKIPPED"; error?: string };

// ---------------------------------------------------------------- Email (SMTP)

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<ChannelResult> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email:dev-preview] to=${to} subject="${subject}"\n${text}\n`);
    }
    return { status: "SKIPPED", error: "Email is not configured (SMTP_HOST / EMAIL_FROM)" };
  }
  try {
    await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
    return { status: "SENT" };
  } catch (err) {
    console.error("Email send failed:", err);
    return { status: "FAILED", error: (err as Error).message.slice(0, 300) };
  }
}

// ---------------------------------------------------------- WhatsApp (Twilio)

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

/** Normalise to E.164 (+countrycode...). Numbers without "+" get DEFAULT_COUNTRY_CODE. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (trimmed.startsWith("00")) return `+${digits.slice(2)}`;
  const cc = (process.env.DEFAULT_COUNTRY_CODE || "").replace(/[^\d]/g, "");
  if (cc && digits.length <= 10) return `+${cc}${digits.replace(/^0+/, "")}`;
  return `+${digits}`;
}

/** Click-to-chat link: opens WhatsApp with the message pre-filled (no provider needed). */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const e164 = normalizePhone(phone);
  if (!e164) return null;
  return `https://wa.me/${e164.slice(1)}?text=${encodeURIComponent(text)}`;
}

export async function sendWhatsApp(to: string, body: string): Promise<ChannelResult> {
  const e164 = normalizePhone(to);
  if (!e164) return { status: "FAILED", error: "Invalid phone number" };
  if (!isWhatsAppConfigured()) {
    return { status: "SKIPPED", error: "WhatsApp is not configured (TWILIO_* env vars)" };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const from = process.env.TWILIO_WHATSAPP_FROM!.replace(/^whatsapp:/, "");
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${e164}`, Body: body.slice(0, 1500) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { status: "FAILED", error: `Twilio ${res.status}: ${data.message || "request failed"}`.slice(0, 300) };
    }
    return { status: "SENT" };
  } catch (err) {
    return { status: "FAILED", error: (err as Error).message.slice(0, 300) };
  }
}
