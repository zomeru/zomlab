import type { SanitizedJsonValue, SanitizedWebhookPayload } from "@zomlab/database";

const REDACTED = "[redacted]";
const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2_000;

const SENSITIVE_KEY_FRAGMENTS = [
  "access_token",
  "address",
  "authorization",
  "billing",
  "card",
  "client_secret",
  "cvc",
  "cvv",
  "email",
  "id_token",
  "password",
  "payer",
  "phone",
  "refresh_token",
  "secret",
  "shipping",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function sanitizeValue(value: unknown, depth: number): SanitizedJsonValue {
  if (depth > MAX_DEPTH) return "[maximum depth reached]";
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value !== "object") return String(value).slice(0, MAX_STRING_LENGTH);

  const sanitized: SanitizedWebhookPayload = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = isSensitiveKey(key) ? REDACTED : sanitizeValue(item, depth + 1);
  }
  return sanitized;
}

export function sanitizeWebhookPayload(payload: unknown): SanitizedWebhookPayload {
  const sanitized = sanitizeValue(payload, 0);
  return Array.isArray(sanitized) || sanitized === null || typeof sanitized !== "object"
    ? { value: sanitized }
    : sanitized;
}
