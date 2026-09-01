"use client";

import { type SignatureDemoProvider, signatureDemoProviderSchema } from "@zomlab/contracts";
import { Alert, AlertDescription, AlertTitle } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Select } from "@zomlab/ui/components/select";
import { Textarea } from "@zomlab/ui/components/textarea";
import { Check, KeyRound, ShieldCheck, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useSignDemoPayload, useValidateDemoSignature } from "~/labs/payments/hooks/use-payments";
import { PaymentPageShell } from "./payment-shared";

const SAMPLE_PAYLOAD = `{
  "type": "payment.succeeded",
  "data": { "id": "pay_demo" }
}`;

const providerMechanics = [
  {
    title: "Stripe",
    text: "Stripe signs timestamp.rawBody with HMAC-SHA256. The webhook route passes the untouched body and Stripe-Signature header to the official SDK, which also enforces timestamp tolerance.",
  },
  {
    title: "PayMongo",
    text: "PayMongo signs timestamp.rawBody with the endpoint's whsk_ secret. Test events use the te field. ZomLab applies a five-minute replay window and a timing-safe digest comparison.",
  },
  {
    title: "PayPal",
    text: "PayPal uses an asymmetric certificate signature. ZomLab validates required transmission headers and replay time, then calls PayPal's official verify-webhook-signature sandbox endpoint.",
  },
];

export function SignatureValidationDemo() {
  const [provider, setProvider] = useState<SignatureDemoProvider>("stripe");
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD);
  const [signature, setSignature] = useState("");
  const sign = useSignDemoPayload();
  const validate = useValidateDemoSignature();

  async function handleSign() {
    validate.reset();
    try {
      const result = await sign.mutateAsync({ provider, payload });
      setSignature(result.signature);
    } catch {
      // The request error remains rendered below the controls.
    }
  }

  async function handleValidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await validate.mutateAsync({ provider, payload, signature });
    } catch {
      // The request error remains rendered below the controls.
    }
  }

  return (
    <PaymentPageShell
      title="Signature validation"
      description="Change an exact raw payload and observe why a previously valid HMAC no longer proves authenticity. Provider webhook routes use their official verification mechanism."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {providerMechanics.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive HMAC demonstration</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 lg:grid-cols-2" onSubmit={handleValidate}>
            <div className="space-y-5">
              <Field>
                <FieldLabel htmlFor="signature-provider">Signature format</FieldLabel>
                <Select
                  id="signature-provider"
                  value={provider}
                  onChange={(event) => {
                    const parsed = signatureDemoProviderSchema.safeParse(event.target.value);
                    if (!parsed.success) return;
                    setProvider(parsed.data);
                    setSignature("");
                    validate.reset();
                  }}
                >
                  <option value="stripe">Stripe HMAC header</option>
                  <option value="paymongo">PayMongo test HMAC header</option>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="signature-payload">Raw payload</FieldLabel>
                <Textarea
                  className="min-h-52 font-mono text-sm"
                  id="signature-payload"
                  value={payload}
                  onChange={(event) => {
                    setPayload(event.target.value);
                    validate.reset();
                  }}
                  spellCheck={false}
                />
              </Field>
              <Button
                disabled={sign.isPending}
                onClick={handleSign}
                type="button"
                variant="outline"
              >
                <KeyRound aria-hidden="true" />
                {sign.isPending ? "Signing payload…" : "Sign current payload"}
              </Button>
            </div>
            <div className="space-y-5">
              <Field>
                <FieldLabel htmlFor="signature-value">Signature header</FieldLabel>
                <Input
                  id="signature-value"
                  value={signature}
                  onChange={(event) => {
                    setSignature(event.target.value);
                    validate.reset();
                  }}
                  spellCheck={false}
                />
              </Field>
              <Button disabled={validate.isPending || signature.length === 0} type="submit">
                <ShieldCheck aria-hidden="true" />
                {validate.isPending ? "Validating signature…" : "Validate signature"}
              </Button>
              {sign.error || validate.error ? (
                <Alert variant="destructive" role="alert">
                  {(sign.error ?? validate.error)?.message}
                </Alert>
              ) : null}
              {validate.data ? (
                <Alert variant={validate.data.valid ? "success" : "destructive"} role="status">
                  <AlertTitle className="flex items-center gap-2">
                    {validate.data.valid ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <X aria-hidden="true" className="size-4" />
                    )}
                    {validate.data.valid ? "Valid signature" : "Invalid signature"}
                  </AlertTitle>
                  <AlertDescription>
                    {validate.data.valid
                      ? "The timestamp and exact raw payload match the signed digest."
                      : "The payload or signature changed. The webhook must be rejected before processing."}
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sign the sample, validate it, then edit one character in the payload and validate
                  the unchanged signature again.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </PaymentPageShell>
  );
}
