export type NavSection = {
  label: string;
  items: NavItem[];
};

export type NavItem =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] }
  | { label: string };

export type NavEntry =
  | { type: "link"; label: string; href: string }
  | { type: "section"; label: string; items: NavItem[] };

export const NAV: NavEntry[] = [
  { type: "link", label: "Getting Started", href: "/" },
  {
    type: "section",
    label: "Core",
    items: [
      { label: "Routing" },
      { label: "Forms" },
      { label: "Validation" },
      { label: "State Management" },
      { label: "Data Fetching" },
      {
        label: "CRUD",
        children: [
          { label: "Overview", href: "/core/crud" },
          { label: "Demo", href: "/core/crud/demo" },
        ],
      },
      { label: "Search & Filtering" },
      { label: "Pagination" },
      { label: "Tables" },
      { label: "File Uploads" },
      { label: "Error Handling" },
      { label: "Caching" },
      { label: "Middleware" },
      { label: "Logging" },
    ],
  },
  {
    type: "section",
    label: "Authentication",
    items: [
      { label: "JWT" },
      { label: "OAuth" },
      { label: "Clerk" },
      { label: "Better Auth" },
      { label: "Passkeys" },
      { label: "RBAC" },
      { label: "MFA" },
    ],
  },
  {
    type: "section",
    label: "Generative AI",
    items: [
      { label: "Chat" },
      { label: "Image Generation" },
      { label: "Audio" },
      { label: "Speech to Text" },
      { label: "Text to Speech" },
      { label: "Video" },
      { label: "Agents" },
      { label: "RAG" },
      { label: "Embeddings" },
      { label: "MCP" },
    ],
  },
  {
    type: "section",
    label: "Web3",
    items: [
      { label: "Wallet" },
      { label: "NFT" },
      { label: "Token" },
      { label: "Signature" },
      { label: "SIWE" },
    ],
  },
  {
    type: "section",
    label: "Payments",
    items: [
      { label: "Stripe" },
      { label: "PayMongo" },
      { label: "PayPal" },
      { label: "Webhooks" },
      { label: "Idempotency" },
      { label: "Signature Validation" },
    ],
  },
  {
    type: "section",
    label: "Realtime",
    items: [
      { label: "WebSockets" },
      { label: "SSE" },
      { label: "Live Chat" },
      { label: "Presence" },
      { label: "Notifications" },
    ],
  },
  {
    type: "section",
    label: "Maps",
    items: [{ label: "Leaflet" }, { label: "Google Maps" }, { label: "Mapbox" }],
  },
  {
    type: "section",
    label: "CMS",
    items: [{ label: "Sanity" }, { label: "Payload" }, { label: "Strapi" }],
  },
  {
    type: "section",
    label: "Performance",
    items: [
      { label: "React Memo" },
      { label: "Virtualization" },
      { label: "Lazy Loading" },
      { label: "Code Splitting" },
      { label: "Caching" },
      { label: "Bundle Analysis" },
    ],
  },
  {
    type: "section",
    label: "Security",
    items: [
      { label: "CSP" },
      { label: "CSRF" },
      { label: "Rate Limit" },
      { label: "SQL Injection" },
      { label: "XSS" },
      { label: "Secrets Management" },
    ],
  },
  {
    type: "section",
    label: "Architecture",
    items: [
      { label: "Microservices" },
      { label: "Event Driven" },
      { label: "CQRS" },
      { label: "Microfrontend" },
      { label: "BFF" },
    ],
  },
  {
    type: "section",
    label: "DevOps",
    items: [
      { label: "Docker" },
      { label: "CI/CD" },
      { label: "Kubernetes" },
      { label: "Monitoring" },
      { label: "Deployment" },
    ],
  },
  {
    type: "section",
    label: "Testing",
    items: [{ label: "Vitest" }, { label: "Cypress" }, { label: "Playwright" }],
  },
  {
    type: "section",
    label: "System",
    items: [{ label: "Status", href: "/status" }],
  },
] as const;

export type NavigableItem = { label: string; href: string; section: string };

export function getNavigableItems(): NavigableItem[] {
  const items: NavigableItem[] = [];

  for (const entry of NAV) {
    if (entry.type === "link") {
      items.push({ label: entry.label, href: entry.href, section: "Getting Started" });
    } else {
      for (const item of entry.items) {
        if ("href" in item) {
          items.push({ label: item.label, href: item.href, section: entry.label });
        }
        if ("children" in item) {
          for (const child of item.children) {
            items.push({ label: child.label, href: child.href, section: entry.label });
          }
        }
      }
    }
  }

  return items;
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(pathname: string, entry: NavEntry): boolean {
  if (entry.type !== "section") return false;

  return entry.items.some((item) => {
    if ("href" in item) {
      return isNavActive(pathname, item.href);
    }
    if ("children" in item) {
      return item.children.some((child) => isNavActive(pathname, child.href));
    }
    return false;
  });
}
