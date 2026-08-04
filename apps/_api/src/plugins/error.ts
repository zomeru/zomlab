import { Elysia, ValidationError } from "elysia";
import { ApiError } from "../errors";

/**
 * Global error handling plugin.
 *
 * Registers all domain errors with Elysia so they are narrowed by `code`
 * in `onError`, then maps every failure to a structured response:
 * `{ error: { code, message } }`.
 *
 * Must be scoped globally so it catches errors thrown by any module.
 */
export const errorPlugin = new Elysia({ name: "error" })
  .error({
    ApiError,
    UnauthorizedError: ApiError,
  })
  .onError({ as: "global" }, ({ code, error, set, path }) => {
    if (code === "VALIDATION" && error instanceof ValidationError) {
      set.status = 422;
      return {
        error: {
          code: "VALIDATION",
          message: "Invalid request",
          detail: error.all.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
      };
    }

    if (error instanceof ApiError) {
      set.status = error.status;
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: {
          code: "NOT_FOUND",
          message: `Route ${path} does not exist`,
        },
      };
    }

    console.error(`[api] unhandled error on ${path}:`, error);
    set.status = 500;
    return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
  });
