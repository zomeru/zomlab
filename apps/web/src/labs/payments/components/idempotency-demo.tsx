"use client";

import { PAYMENT_MAX_AMOUNT, PAYMENT_MIN_AMOUNT } from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { RefreshCw, Send } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { formatDate } from "~/labs/core/shared/formatters";
import { useIdempotencyRecords, useRunIdempotencyDemo } from "~/labs/payments/hooks/use-payments";
import { formatMinorAmount, PaymentPageShell } from "./payment-shared";

function parseAmount(value: string): number | undefined {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) &&
    amount >= PAYMENT_MIN_AMOUNT &&
    amount <= PAYMENT_MAX_AMOUNT
    ? amount
    : undefined;
}

export function IdempotencyDemo() {
  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("1000.00");
  const [amountError, setAmountError] = useState("");
  const [key, setKey] = useState<string>(() => crypto.randomUUID());
  const operation = useRunIdempotencyDemo();
  const records = useIdempotencyRecords();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAmountError("");
    operation.reset();
    const minorAmount = parseAmount(amount);
    if (minorAmount === undefined) {
      setAmountError("Enter a PHP amount from ₱1.00 to ₱1,000,000.00 with at most two decimals.");
      amountRef.current?.focus();
      return;
    }
    try {
      await operation.mutateAsync({ amount: minorAmount, currency: "PHP", idempotencyKey: key });
    } catch {
      // The server response remains rendered below the form.
    }
  }

  return (
    <PaymentPageShell
      title="Idempotency"
      description="Send the same logical payment request repeatedly and inspect the PostgreSQL-backed response replay that prevents duplicate work across app instances."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a logical payment operation</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <Field>
                <FieldLabel htmlFor="idempotency-amount">Amount in PHP</FieldLabel>
                <Input
                  ref={amountRef}
                  id="idempotency-amount"
                  inputMode="decimal"
                  value={amount}
                  aria-describedby="idempotency-amount-error"
                  aria-invalid={amountError ? true : undefined}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <div id="idempotency-amount-error">
                  {amountError ? <FieldError>{amountError}</FieldError> : null}
                </div>
              </Field>
              <Field>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FieldLabel htmlFor="idempotency-key">Idempotency key</FieldLabel>
                  <Button
                    onClick={() => {
                      setKey(crypto.randomUUID());
                      operation.reset();
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <RefreshCw aria-hidden="true" />
                    Generate new key
                  </Button>
                </div>
                <Input
                  id="idempotency-key"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  spellCheck={false}
                />
              </Field>
              {operation.error ? (
                <Alert variant="destructive" role="alert">
                  {operation.error.message}
                </Alert>
              ) : null}
              <Button disabled={operation.isPending} type="submit">
                <Send aria-hidden="true" />
                {operation.isPending ? "Sending request…" : "Send request"}
              </Button>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Send the request several times without changing the key. Then change the amount to
                see the server reject a mismatched replay.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest result</CardTitle>
          </CardHeader>
          <CardContent>
            {operation.data ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Logical operation ID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm">{operation.data.operationId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Response
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={operation.data.replayed ? "accent" : "success"}>
                      {operation.data.replayed ? "original response replayed" : "operation created"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Amount
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatMinorAmount(operation.data.amount, operation.data.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Request hash
                  </dt>
                  <dd
                    className="mt-1 truncate font-mono text-sm"
                    title={operation.data.record.requestHash}
                  >
                    {operation.data.record.requestHash}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Send a request to create the first server-side idempotency record.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="idempotency-records-heading">
        <h2 className="mb-4 text-xl font-semibold tracking-tight" id="idempotency-records-heading">
          Persisted records
        </h2>
        {records.error ? (
          <Alert variant="destructive" role="alert">
            {records.error.message}
          </Alert>
        ) : null}
        {records.data?.items.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {records.data.items.map((record) => (
              <li key={record.id}>
                <Card className="h-full">
                  <CardContent className="grid gap-3 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-sm">{record.operation}</span>
                      <Badge variant={record.state === "completed" ? "success" : "accent"}>
                        {record.state}
                      </Badge>
                    </div>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {record.key}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(record.createdAt)} · expires{" "}
                      {formatDate(record.expiresAt)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No idempotency records yet.</p>
        )}
      </section>
    </PaymentPageShell>
  );
}
