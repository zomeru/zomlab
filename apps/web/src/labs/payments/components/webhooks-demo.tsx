"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Badge } from "@zomlab/ui/components/badge";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { ArrowDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { formatDate } from "~/labs/core/shared/formatters";
import { usePaymentWebhook, usePaymentWebhooks } from "~/labs/payments/hooks/use-payments";
import { JsonCodeBlock, PaymentPageShell, providerLabels } from "./payment-shared";

const lifecycle = [
  "Payment provider",
  "Webhook request",
  "Signature validation",
  "Event parsing",
  "Idempotency check",
  "Business logic",
  "PostgreSQL",
  "200 response",
];

export function WebhooksDemo() {
  const [selectedId, setSelectedId] = useState<string>();
  const events = usePaymentWebhooks();
  const detail = usePaymentWebhook(selectedId);

  return (
    <PaymentPageShell
      title="Payment webhooks"
      description="Inspect how signed provider events move through verification, deduplication, sanitized persistence, and transaction updates."
    >
      <section aria-labelledby="webhook-lifecycle-heading">
        <h2 className="mb-4 text-xl font-semibold tracking-tight" id="webhook-lifecycle-heading">
          Verified event lifecycle
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {lifecycle.map((step, index) => (
            <li key={step} className="contents">
              <div className="flex min-h-16 items-center gap-3 rounded-xl bg-muted/45 px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background font-mono text-xs shadow-[var(--surface-shadow)]">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </div>
              {index < lifecycle.length - 1 ? (
                <ArrowDown
                  aria-hidden="true"
                  className="mx-auto size-4 text-muted-foreground sm:hidden"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="recent-webhooks-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight" id="recent-webhooks-heading">
              Recent verified events
            </h2>
            <Button onClick={() => events.refetch()} size="sm" type="button" variant="outline">
              <RefreshCw aria-hidden="true" />
              Refresh events
            </Button>
          </div>
          {events.error ? (
            <Alert variant="destructive" role="alert">
              {events.error.message}
            </Alert>
          ) : null}
          {events.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading webhook events…</p>
          ) : null}
          {events.data?.items.length === 0 ? (
            <EmptyState>
              <EmptyStateTitle>No verified events yet</EmptyStateTitle>
              <EmptyStateDescription>
                Complete a provider checkout after configuring its webhook endpoint.
              </EmptyStateDescription>
            </EmptyState>
          ) : null}
          {events.data?.items.length ? (
            <ul className="space-y-3" aria-label="Recent webhook events">
              {events.data.items.map((event) => (
                <li key={event.id}>
                  <button
                    aria-pressed={selectedId === event.id}
                    className="w-full rounded-xl bg-card p-4 text-start shadow-[var(--surface-shadow)] transition-[background-color,box-shadow] hover:bg-muted/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    onClick={() => setSelectedId(event.id)}
                    type="button"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium">{event.eventType}</span>
                      <Badge variant={event.status === "processed" ? "success" : "outline"}>
                        {event.status}
                      </Badge>
                    </span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {providerLabels[event.provider]} · {formatDate(event.receivedAt)}
                    </span>
                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                      {event.providerEventId}
                    </span>
                    {event.duplicateCount > 0 ? (
                      <span className="mt-2 block text-xs font-medium text-warning">
                        {event.duplicateCount} duplicate delivery
                        {event.duplicateCount === 1 ? "" : "ies"}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="webhook-detail-heading">
          <h2 className="mb-4 text-xl font-semibold tracking-tight" id="webhook-detail-heading">
            Event detail
          </h2>
          {!selectedId ? (
            <EmptyState>
              <EmptyStateTitle>Select an event</EmptyStateTitle>
              <EmptyStateDescription>
                Open a verified event to inspect its sanitized payload and processing result.
              </EmptyStateDescription>
            </EmptyState>
          ) : null}
          {detail.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading detail…</p>
          ) : null}
          {detail.error ? (
            <Alert variant="destructive" role="alert">
              {detail.error.message}
            </Alert>
          ) : null}
          {detail.data ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{detail.data.eventType}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Processing result
                    </p>
                    <p className="mt-1 text-sm">
                      {detail.data.result?.message ?? "No result recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Duplicate status
                    </p>
                    <p className="mt-1 text-sm">
                      {detail.data.duplicateCount > 0
                        ? `${detail.data.duplicateCount} duplicate deliveries ignored`
                        : "First delivery"}
                    </p>
                  </div>
                  {detail.data.error ? (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                        Processing error
                      </p>
                      <p className="mt-1 text-sm text-destructive">{detail.data.error}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <JsonCodeBlock label="Sanitized webhook payload" value={detail.data.payload} />
              <JsonCodeBlock
                label="Signature header summary"
                value={detail.data.signatureHeaders}
              />
            </div>
          ) : null}
        </section>
      </div>
    </PaymentPageShell>
  );
}
