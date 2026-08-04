interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * Extracts a human-readable message from an Eden treaty error.
 *
 * The API returns `{ error: { code, message } }` for every failure;
 * falls back to a caller-provided message when the body is unexpected.
 */
export function getApiErrorMessage(error: { value: unknown }, fallback: string): string {
  const body = error.value as ApiErrorBody | string | undefined;

  if (typeof body === "string") {
    return body.length > 0 ? body : fallback;
  }

  if (typeof body?.error?.message === "string" && body.error.message.length > 0) {
    return body.error.message;
  }

  return fallback;
}
