import type { PaymentProvider } from "@zomlab/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { CodeContainer } from "@zomlab/ui/components/docs";

const setup = {
  stripe: {
    variables: ['STRIPE_SECRET_KEY=""', 'STRIPE_PUBLISHABLE_KEY=""', 'STRIPE_WEBHOOK_SECRET=""'],
    endpoint: "/api/payments/webhooks/stripe",
    local: "stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe",
    dashboard:
      "Use Developers → API keys in test mode. Copy the whsec_ secret printed by Stripe CLI or the endpoint signing secret from Workbench.",
    testing:
      "Successful card: 4242 4242 4242 4242. Generic decline: 4000 0000 0000 0002. Use any future expiry and any three-digit CVC.",
    docs: "https://docs.stripe.com/testing",
    docsLabel: "Read Stripe test-mode documentation",
  },
  paymongo: {
    variables: ['PAYMONGO_PUBLIC_KEY=""', 'PAYMONGO_SECRET_KEY=""', 'PAYMONGO_WEBHOOK_SECRET=""'],
    endpoint: "/api/payments/webhooks/paymongo",
    local: "cloudflared tunnel --url http://localhost:3000",
    dashboard:
      "Get sk_test_ and pk_test_ keys from Settings → Developers. Create a test webhook for the public HTTPS tunnel URL and copy its whsk_ signing secret.",
    testing:
      "Successful card: 4343 4343 4343 4345. Generic decline: 4111 1111 1111 1111. Use any future expiry and any three-digit CVC.",
    docs: "https://docs.paymongo.com/docs/payment-acceptance-testing",
    docsLabel: "Read PayMongo test-mode documentation",
  },
  paypal: {
    variables: [
      'PAYPAL_CLIENT_ID=""',
      'PAYPAL_CLIENT_SECRET=""',
      'PAYPAL_WEBHOOK_ID=""',
      'PAYPAL_ENVIRONMENT="sandbox"',
    ],
    endpoint: "/api/payments/webhooks/paypal",
    local: "cloudflared tunnel --url http://localhost:3000",
    dashboard:
      "Create a REST app in the PayPal Developer Dashboard, use its sandbox client credentials, and register the public HTTPS webhook URL. Store the webhook ID, not the client ID.",
    testing:
      "Approve with the personal sandbox account paired with your app's business sandbox account. No real money moves.",
    docs: "https://developer.paypal.com/sandbox-testing/accounts/",
    docsLabel: "Read PayPal sandbox-account documentation",
  },
} as const;

export function ProviderSetupGuide({ provider }: { provider: PaymentProvider }) {
  const guide = setup[provider];
  const productionUrl = `https://your-domain.example${guide.endpoint}`;
  return (
    <section aria-labelledby={`${provider}-setup-heading`}>
      <h2 className="mb-4 text-xl font-semibold tracking-tight" id={`${provider}-setup-heading`}>
        Sandbox setup and manual testing
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment variables</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeContainer label=".env">
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                <code>{guide.variables.join("\n")}</code>
              </pre>
            </CodeContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard and webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{guide.dashboard}</p>
            <div>
              <p className="font-medium text-foreground">Local forwarding</p>
              <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {guide.local}
              </code>
            </div>
            <div>
              <p className="font-medium text-foreground">Production webhook URL</p>
              <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {productionUrl}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 rounded-xl bg-muted/45 p-5 text-sm leading-relaxed">
        <p className="font-medium text-foreground">Manual success and failure checks</p>
        <p className="mt-2 text-muted-foreground">{guide.testing}</p>
        <a
          className="mt-3 inline-flex min-h-10 items-center text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          href={guide.docs}
          rel="noreferrer"
          target="_blank"
        >
          {guide.docsLabel}
        </a>
      </div>
    </section>
  );
}
