"use client";

import type { PaymentProvider, PaymentStatus, PaymentTransaction } from "@zomlab/contracts";
import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { CodeContainer } from "@zomlab/ui/components/docs";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Check, Circle, CircleX, Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate } from "~/labs/core/shared/formatters";

export function PaymentPageShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader>
        <PageTitle>{title}</PageTitle>
        <PageDescription>{description}</PageDescription>
      </PageHeader>
      <div className="space-y-10">{children}</div>
    </div>
  );
}

export function formatMinorAmount(amount: number, currency: string): string {
  const whole = Math.trunc(amount / 100).toLocaleString("en-PH");
  const fraction = (amount % 100).toString().padStart(2, "0");
  return `${currency === "PHP" ? "₱" : `${currency} `}${whole}.${fraction}`;
}

function statusVariant(status: PaymentStatus) {
  if (status === "succeeded") return "success" as const;
  if (status === "pending" || status === "requires_action") return "accent" as const;
  return "outline" as const;
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant={statusVariant(status)}
      className={
        status === "failed" || status === "canceled" ? "border-destructive/30 text-destructive" : ""
      }
    >
      {status.replace("_", " ")}
    </Badge>
  );
}

export function PaymentLifecycle({ status }: { status?: PaymentStatus }) {
  const stages = ["Created", "Pending", status === "failed" ? "Failed" : "Succeeded"];
  const activeIndex =
    status === "succeeded" || status === "failed" || status === "canceled"
      ? 2
      : status === "pending" || status === "requires_action"
        ? 1
        : 0;
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Payment lifecycle">
      {stages.map((stage, index) => {
        const complete = index < activeIndex || (index === 2 && status === "succeeded");
        const failed = index === 2 && (status === "failed" || status === "canceled");
        const current = index === activeIndex;
        const Icon = failed ? CircleX : complete ? Check : current ? Clock3 : Circle;
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className="flex min-h-12 items-center gap-3 rounded-lg bg-muted/45 px-4 py-3 text-sm"
          >
            <Icon
              aria-hidden="true"
              className={failed ? "size-4 text-destructive" : "size-4 text-muted-foreground"}
            />
            <span className={current ? "font-semibold text-foreground" : "text-muted-foreground"}>
              {stage}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function TransactionDetails({ transaction }: { transaction: PaymentTransaction }) {
  const rows = [
    ["Transaction ID", transaction.id],
    ["Provider reference", transaction.providerReferenceId ?? "Not assigned"],
    ["Provider payment ID", transaction.providerPaymentId ?? "Not assigned"],
    ["Provider status", transaction.metadata.providerStatus ?? "Not reported"],
    ["Webhook event", transaction.metadata.lastWebhookEventType ?? "Not received"],
    ["Created", formatDate(transaction.createdAt)],
    ["Updated", formatDate(transaction.updatedAt)],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-1 break-all font-mono text-sm text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TransactionHistory({
  error,
  isLoading,
  items,
}: {
  error?: Error | null;
  isLoading: boolean;
  items?: PaymentTransaction[];
}) {
  return (
    <section aria-labelledby="payment-history-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight" id="payment-history-heading">
          Payment history
        </h2>
        <p className="text-sm text-muted-foreground" role="status">
          {items ? `${items.length} ${items.length === 1 ? "transaction" : "transactions"}` : ""}
        </p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading payment history…</p> : null}
      {error ? (
        <Alert variant="destructive" role="alert">
          {error.message}
        </Alert>
      ) : null}
      {items?.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>No payments yet</EmptyStateTitle>
          <EmptyStateDescription>
            Create a sandbox checkout above to see its verified lifecycle here.
          </EmptyStateDescription>
        </EmptyState>
      ) : null}
      {items?.length ? (
        <ul className="grid gap-4 lg:grid-cols-2" aria-label="Payment transactions">
          {items.map((transaction) => (
            <li key={transaction.id}>
              <Card className="h-full">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle>
                      {formatMinorAmount(transaction.amount, transaction.currency)}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={transaction.status} />
                </CardHeader>
                <CardContent>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {transaction.providerReferenceId ?? "Provider reference not assigned"}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function JsonCodeBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <CodeContainer label={label}>
      <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </CodeContainer>
  );
}

export function ProviderConfigurationNotice({
  configured,
  provider,
}: {
  configured?: boolean;
  provider: string;
}) {
  if (configured !== false) return null;
  return (
    <Alert variant="warning" role="status">
      <AlertTitle>{provider} is not configured</AlertTitle>
      <AlertDescription>
        Add the sandbox credentials listed below, restart the development server, and try again.
      </AlertDescription>
    </Alert>
  );
}

export const providerLabels: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  paymongo: "PayMongo",
  paypal: "PayPal",
};
