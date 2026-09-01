import { createHmac, timingSafeEqual } from "node:crypto";
import type { SignatureDemoProvider } from "@zomlab/contracts";

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const DEMO_WEBHOOK_SECRET = "zomlab-local-signature-demo-secret";

function parseHeaderParts(header: string): Map<string, string[]> {
  const parts = new Map<string, string[]>();
  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    const values = parts.get(key) ?? [];
    values.push(value);
    parts.set(key, values);
  }
  return parts;
}

export function hmacSha256Hex(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function constantTimeEqualHex(actual: string, expected: string): boolean {
  if (!/^[a-f\d]+$/i.test(actual) || !/^[a-f\d]+$/i.test(expected)) return false;
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createProviderIdempotencyKey(
  userId: string,
  operation: string,
  key: string,
): Promise<string> {
  return (await sha256Hex(`${userId}:${operation}:${key}`)).slice(0, 48);
}

export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  now = new Date(),
  toleranceSeconds = WEBHOOK_TOLERANCE_SECONDS,
): boolean {
  const parts = parseHeaderParts(signatureHeader);
  const timestamp = parts.get("t")?.[0];
  const signatures = parts.get("te") ?? [];
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;

  const age = Math.abs(Math.floor(now.getTime() / 1_000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const expected = hmacSha256Hex(`${timestamp}.${rawBody}`, secret);
  return signatures.some((signature) => constantTimeEqualHex(signature, expected));
}

export function createDemoSignature(
  provider: SignatureDemoProvider,
  payload: string,
  now = new Date(),
): string {
  const timestamp = Math.floor(now.getTime() / 1_000).toString();
  const digest = hmacSha256Hex(`${timestamp}.${payload}`, DEMO_WEBHOOK_SECRET);
  return provider === "stripe" ? `t=${timestamp},v1=${digest}` : `t=${timestamp},te=${digest},li=`;
}

export function validateDemoSignature(
  provider: SignatureDemoProvider,
  payload: string,
  signature: string,
): { valid: boolean; expectedSignature: string } {
  const parts = parseHeaderParts(signature);
  const timestamp = parts.get("t")?.[0];
  const signatureKey = provider === "stripe" ? "v1" : "te";
  const provided = parts.get(signatureKey) ?? [];
  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return { valid: false, expectedSignature: "Malformed signature header" };
  }

  const expectedDigest = hmacSha256Hex(`${timestamp}.${payload}`, DEMO_WEBHOOK_SECRET);
  const valid = provided.some((candidate) => constantTimeEqualHex(candidate, expectedDigest));
  const expectedSignature =
    provider === "stripe"
      ? `t=${timestamp},v1=${expectedDigest}`
      : `t=${timestamp},te=${expectedDigest},li=`;
  return { valid, expectedSignature };
}
