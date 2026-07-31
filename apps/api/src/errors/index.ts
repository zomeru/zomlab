/**
 * Base class for all domain errors thrown by the API.
 *
 * `status` is read by the global error plugin to set the HTTP status code.
 * `code` is a stable machine-readable identifier surfaced in the response.
 */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(404, code, message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests") {
    super(429, "RATE_LIMITED", message);
  }
}
