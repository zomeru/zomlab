"use client";

import {
  PAYMENT_DEFAULT_AMOUNT,
  PAYMENT_MAX_AMOUNT,
  PAYMENT_MIN_AMOUNT,
  type PaymentProvider,
} from "@zomlab/contracts";
import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  useCapturePaypal,
  useCreateCheckout,
  usePaymentConfiguration,
  usePaymentStatus,
  usePaymentTransactionStatus,
  usePaymentTransactions,
} from "~/labs/payments/hooks/use-payments";
import {
  formatMinorAmount,
  PaymentLifecycle,
  PaymentPageShell,
  ProviderConfigurationNotice,
  providerLabels,
  TransactionDetails,
  TransactionHistory,
} from "./payment-shared";
import { ProviderSetupGuide } from "./provider-setup-guide";

function defaultAmount(): string {
  const whole = Math.trunc(PAYMENT_DEFAULT_AMOUNT / 100);
  const fraction = (PAYMENT_DEFAULT_AMOUNT % 100).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function parseMajorAmount(value: string): number | undefined {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) &&
    amount >= PAYMENT_MIN_AMOUNT &&
    amount <= PAYMENT_MAX_AMOUNT
    ? amount
    : undefined;
}

export interface ProviderPaymentDemoProps {
  provider: PaymentProvider;
  returnReference?: string;
  returnState?: "canceled" | "returned";
  returnTransactionId?: string;
}

export function ProviderPaymentDemo({
  provider,
  returnReference,
  returnState,
  returnTransactionId,
}: ProviderPaymentDemoProps) {
  const providerLabel = providerLabels[provider];
  const amountRef = useRef<HTMLInputElement>(null);
  const captureStartedFor = useRef<string | undefined>(undefined);
  const [amount, setAmount] = useState(defaultAmount);
  const [amountError, setAmountError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());
  const configuration = usePaymentConfiguration();
  const history = usePaymentTransactions(provider);
  const checkout = useCreateCheckout(provider);
  const providerStatus = usePaymentStatus(
    provider,
    provider !== "paymongo" && provider !== "paypal" ? returnReference : undefined,
  );
  const paymongoStatus = usePaymentTransactionStatus(
    provider === "paymongo" ? returnTransactionId : undefined,
  );
  const paypalCapture = useCapturePaypal();

  useEffect(() => {
    if (
      provider === "paypal" &&
      returnState === "returned" &&
      returnReference &&
      captureStartedFor.current !== returnReference
    ) {
      captureStartedFor.current = returnReference;
      paypalCapture.mutate(returnReference);
    }
  }, [paypalCapture.mutate, provider, returnReference, returnState]);

  const verified =
    paypalCapture.data?.transaction ??
    paymongoStatus.data?.transaction ??
    providerStatus.data?.transaction;
  const statusError = paypalCapture.error ?? paymongoStatus.error ?? providerStatus.error;
  const checkingStatus =
    paypalCapture.isPending || paymongoStatus.isLoading || providerStatus.isLoading;
  const configured = configuration.data?.providers[provider];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAmountError("");
    checkout.reset();
    const minorAmount = parseMajorAmount(amount);
    if (minorAmount === undefined) {
      setAmountError("Enter a PHP amount from ₱1.00 to ₱1,000,000.00 with at most two decimals.");
      amountRef.current?.focus();
      return;
    }

    try {
      const result = await checkout.mutateAsync({
        amount: minorAmount,
        currency: "PHP",
        description: `ZomLab ${providerLabel} sandbox payment`,
        idempotencyKey,
      });
      window.location.assign(result.checkoutUrl);
    } catch {
      // The mutation error remains next to the form with a retry path.
    }
  }

  return (
    <PaymentPageShell
      title={providerLabel}
      description={`This experiment demonstrates the complete ${providerLabel} sandbox lifecycle: server-side creation, hosted approval, verified status, webhook processing, and transaction persistence.`}
    >
      <ProviderConfigurationNotice configured={configured} provider={providerLabel} />

      {returnState === "canceled" ? (
        <Alert variant="warning" role="status">
          <AlertTitle>Checkout canceled</AlertTitle>
          <AlertDescription>
            No success is inferred from this return URL. Provider APIs and verified webhooks remain
            the source of truth.
          </AlertDescription>
        </Alert>
      ) : null}

      {returnState === "returned" ? (
        <Alert variant={verified?.status === "succeeded" ? "success" : "info"} role="status">
          <AlertTitle>
            {checkingStatus
              ? "Verifying payment status…"
              : verified?.status === "succeeded"
                ? "Payment verified"
                : "Payment returned"}
          </AlertTitle>
          <AlertDescription>
            {checkingStatus
              ? `ZomLab is checking ${providerLabel} before showing a final result.`
              : verified
                ? `Provider status: ${verified.metadata.providerStatus ?? verified.status}.`
                : "The return URL is not accepted as proof of payment."}
          </AlertDescription>
        </Alert>
      ) : null}

      {statusError ? (
        <Alert variant="destructive" role="alert">
          Unable to verify this return. {statusError.message}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Create a sandbox payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <Field>
                <FieldLabel htmlFor={`${provider}-amount`}>Amount in PHP</FieldLabel>
                <Input
                  ref={amountRef}
                  id={`${provider}-amount`}
                  name="amount"
                  inputMode="decimal"
                  value={amount}
                  aria-describedby={`${provider}-amount-help ${provider}-amount-error`}
                  aria-invalid={amountError ? true : undefined}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <p className="text-sm text-muted-foreground" id={`${provider}-amount-help`}>
                  The server converts this to integer minor units. No floating-point amount is sent.
                </p>
                <div id={`${provider}-amount-error`}>
                  {amountError ? <FieldError>{amountError}</FieldError> : null}
                </div>
              </Field>
              <Field>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FieldLabel htmlFor={`${provider}-idempotency-key`}>Idempotency key</FieldLabel>
                  <Button
                    onClick={() => setIdempotencyKey(crypto.randomUUID())}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <RefreshCw aria-hidden="true" />
                    Generate new key
                  </Button>
                </div>
                <Input
                  id={`${provider}-idempotency-key`}
                  name="idempotencyKey"
                  value={idempotencyKey}
                  onChange={(event) => setIdempotencyKey(event.target.value)}
                  spellCheck={false}
                />
              </Field>

              {checkout.error ? (
                <Alert variant="destructive" role="alert">
                  {checkout.error.message}
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Test mode only · {formatMinorAmount(parseMajorAmount(amount) ?? 0, "PHP")}
                </p>
                <Button disabled={checkout.isPending || configured === false} type="submit">
                  <ArrowUpRight aria-hidden="true" />
                  {checkout.isPending ? "Creating checkout…" : `Pay with ${providerLabel}`}
                </Button>
              </div>
              <p className="sr-only" role="status">
                {checkout.isPending ? `Creating the ${providerLabel} sandbox checkout.` : ""}
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PaymentLifecycle status={verified?.status} />
            {verified ? (
              <TransactionDetails transaction={verified} />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Complete a checkout to see provider IDs, webhook reconciliation, and verified state.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionHistory
        error={history.error}
        isLoading={history.isLoading}
        items={history.data?.items}
      />
      <ProviderSetupGuide provider={provider} />
    </PaymentPageShell>
  );
}
