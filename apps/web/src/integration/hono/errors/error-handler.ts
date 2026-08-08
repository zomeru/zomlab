import { apiErrorSchema } from "@zomlab/contracts";
import type { Context, ErrorHandler } from "hono";
import { ZodError } from "zod";
import { ApiError, InternalError, NotFoundError, ValidationError } from "./api-error";

function normalizeDetail(error: unknown): unknown {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
  if (error instanceof ValidationError) {
    return error.detail;
  }
  return undefined;
}

function createErrorEnvelope(error: ApiError) {
  const envelope = {
    error: {
      code: error.code,
      message: error.status >= 500 ? "Internal server error" : error.message,
      ...(error.detail !== undefined ? { detail: normalizeDetail(error) } : {}),
    },
  };

  // Validate the envelope itself before returning
  const parsed = apiErrorSchema.safeParse(envelope);
  return parsed.success
    ? parsed.data
    : { error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } };
}

export const apiErrorHandler: ErrorHandler = (error, c: Context) => {
  if (error instanceof ApiError) {
    console.error(`[${error.code}] ${error.message}`, {
      status: error.status,
      ...(error.status >= 500 ? { error: error.message } : {}),
    });

    const envelope = createErrorEnvelope(error);
    return c.json(envelope, error.status as 400);
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError("Validation failed", error);
    return c.json(createErrorEnvelope(validationError), 422);
  }

  // Unknown error - log server-side, mask from response
  console.error("[INTERNAL_SERVER_ERROR]", error);
  const internalError = new InternalError();
  return c.json(createErrorEnvelope(internalError), 500);
};

export const notFoundHandler = (c: Context) => {
  const envelope = createErrorEnvelope(new NotFoundError());
  return c.json(envelope, 404);
};
