import { apiErrorSchema } from "@zomlab/contracts";

type JsonResponse<T> = {
  json(): Promise<T>;
  ok: boolean;
  status: number;
};

export class ApiResponseError extends Error {
  readonly code?: string;
  readonly detail?: unknown;
  readonly status: number;

  constructor(message: string, status: number, code?: string, detail?: unknown) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export async function readJsonResponse<T>(
  response: JsonResponse<T>,
  fallbackMessage: string,
): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApiResponseError(fallbackMessage, response.status);
  }

  const parsed = apiErrorSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiResponseError(fallbackMessage, response.status);
  }

  throw new ApiResponseError(
    parsed.data.error.message,
    response.status,
    parsed.data.error.code,
    parsed.data.error.detail,
  );
}
