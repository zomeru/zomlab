import { PaymentProviderError } from "~/integration/hono/errors/api-error";
import { asObject, asString } from "./provider-json";

export function handleProviderError(provider: string, action: string, error: unknown): never {
  const details = asObject(error);
  console.error("[PAYMENT_PROVIDER_ERROR]", {
    provider,
    action,
    errorType: error instanceof Error ? error.name : "UnknownError",
    providerCode: asString(details?.code),
    statusCode: typeof details?.statusCode === "number" ? details.statusCode : undefined,
  });
  throw new PaymentProviderError(`${provider} could not ${action}. Try again.`);
}
