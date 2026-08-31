import { ApiError, ValidationError } from "~/integration/hono/errors/api-error";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1_024;

export async function readLimitedRequestText(
  request: Request,
  maxBytes = MAX_WEBHOOK_BODY_BYTES,
): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError("PAYLOAD_TOO_LARGE", "Webhook payload is too large", 413);
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("Webhook payload exceeded the size limit");
        throw new ApiError("PAYLOAD_TOO_LARGE", "Webhook payload is too large", 413);
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new ValidationError("Webhook payload must be valid UTF-8");
  }
}
