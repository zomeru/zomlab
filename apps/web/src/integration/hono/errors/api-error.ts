export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly detail?: unknown;

  constructor(code: string, message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, detail?: unknown) {
    super("VALIDATION", message, 422, detail);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class NoteNotFoundError extends ApiError {
  constructor() {
    super("NOTE_NOT_FOUND", "Note not found", 404);
    this.name = "NoteNotFoundError";
  }
}

export class FileNotFoundError extends ApiError {
  constructor() {
    super("FILE_NOT_FOUND", "File not found", 404);
    this.name = "FileNotFoundError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class InternalError extends ApiError {
  constructor(message = "Internal server error") {
    super("INTERNAL_SERVER_ERROR", message, 500);
    this.name = "InternalError";
  }
}
