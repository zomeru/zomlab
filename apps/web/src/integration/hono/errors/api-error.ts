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

export class PaymentNotFoundError extends ApiError {
  constructor() {
    super("PAYMENT_NOT_FOUND", "Payment transaction not found", 404);
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentConfigurationError extends ApiError {
  constructor(provider: string) {
    super(
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      `${provider} sandbox credentials are not configured`,
      503,
    );
    this.name = "PaymentConfigurationError";
  }
}

export class PaymentProviderError extends ApiError {
  constructor(message = "The payment provider could not complete the request") {
    super("PAYMENT_PROVIDER_ERROR", message, 502);
    this.name = "PaymentProviderError";
  }
}

export class PaymentStateError extends ApiError {
  constructor(message: string) {
    super("PAYMENT_STATE_CONFLICT", message, 409);
    this.name = "PaymentStateError";
  }
}

export class IdempotencyConflictError extends ApiError {
  constructor(message: string) {
    super("IDEMPOTENCY_CONFLICT", message, 409);
    this.name = "IdempotencyConflictError";
  }
}

export class InvalidWebhookSignatureError extends ApiError {
  constructor() {
    super("INVALID_WEBHOOK_SIGNATURE", "Webhook signature verification failed", 400);
    this.name = "InvalidWebhookSignatureError";
  }
}

export class RealtimeNotificationNotFoundError extends ApiError {
  constructor() {
    super("REALTIME_NOTIFICATION_NOT_FOUND", "Notification not found", 404);
    this.name = "RealtimeNotificationNotFoundError";
  }
}
