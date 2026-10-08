import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Encrypts user-supplied LLM API keys at rest (AES-256-GCM). Keyed off
 * AI_CREDENTIAL_SECRET, falling back to NEXTAUTH_SECRET so this works out of
 * the box in dev without a second secret to configure.
 */
const SECRET = process.env.AI_CREDENTIAL_SECRET || process.env.NEXTAUTH_SECRET || "ai-bootcamp-fallback-secret-2026";

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) cachedKey = scryptSync(SECRET, "ai-bootcamp-credential-salt", 32);
  return cachedKey;
}

/** Returns `iv.tag.ciphertext`, each base64url. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ciphertextB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ciphertextB64) throw new Error("Malformed encrypted credential");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64url")), decipher.final()]);
  return plaintext.toString("utf8");
}

/** Last 4 characters only — enough for a user to recognise which key is saved. */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}
