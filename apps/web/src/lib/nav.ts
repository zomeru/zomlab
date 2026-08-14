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
      {
        label: "Routing",
        children: [
          { label: "Overview", href: "/core/routing" },
          { label: "Demo", href: "/core/routing-demo" },
        ],
      },
      {
        label: "Forms",
        children: [
          { label: "Overview", href: "/core/forms" },
          { label: "Demo", href: "/core/forms-demo" },
        ],
      },
      {
        label: "Validation",
        children: [
          { label: "Overview", href: "/core/validation" },
          { label: "Demo", href: "/core/validation-demo" },
        ],
      },
      {
        label: "State Management",
        children: [
          { label: "Overview", href: "/core/state-management" },
          { label: "Demo", href: "/core/state-management-demo" },
        ],
      },
      {
        label: "Data Fetching",
        children: [
          { label: "Overview", href: "/core/data-fetching" },
          { label: "Demo", href: "/core/data-fetching-demo" },
        ],
      },
      {
        label: "CRUD",
        children: [
          { label: "Overview", href: "/core/crud" },
          { label: "Data Boundaries", href: "/core/crud/data-boundaries" },
          { label: "Demo", href: "/core/crud-demo" },
        ],
      },
      {
        label: "Search & Filtering",
        children: [
          { label: "Overview", href: "/core/search-filter" },
          { label: "Demo", href: "/core/search-filter-demo" },
        ],
      },
      {
        label: "Pagination",
        children: [
          { label: "Overview", href: "/core/pagination" },
          { label: "Demo", href: "/core/pagination-demo" },
        ],
      },
      {
        label: "Tables",
        children: [
          { label: "Overview", href: "/core/tables" },
          { label: "Server Data", href: "/core/tables/server-data" },
          { label: "Demo", href: "/core/tables-demo" },
        ],
      },
      {
        label: "File Uploads",
        children: [
          { label: "Overview", href: "/core/file-uploads" },
          { label: "Storage & Security", href: "/core/file-uploads/storage-security" },
          { label: "Demo", href: "/core/file-uploads-demo" },
        ],
      },
      {
        label: "Error Handling",
        children: [
          { label: "Overview", href: "/core/error-handling" },
          { label: "Error Contract", href: "/core/error-handling/error-contract" },
          { label: "Demo", href: "/core/error-handling-demo" },
        ],
      },
      {
        label: "Caching",
        children: [
          { label: "Overview", href: "/core/caching" },
          { label: "Demo", href: "/core/caching-demo" },
        ],
      },
      {
        label: "Middleware",
        children: [
          { label: "Overview", href: "/core/middleware" },
          { label: "Demo", href: "/core/middleware-demo" },
        ],
      },
      {
        label: "Logging",
        children: [
          { label: "Overview", href: "/core/logging" },
          { label: "Demo", href: "/core/logging-demo" },
        ],
      },
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

export type NavigableItem = { label: string; href: string; path: string };

export function getNavigableItems(): NavigableItem[] {
  const items: NavigableItem[] = [];

  for (const entry of NAV) {
    if (entry.type === "link") {
      items.push({ label: entry.label, href: entry.href, path: "" });
    } else {
      for (const item of entry.items) {
        if ("href" in item) {
          items.push({ label: item.label, href: item.href, path: entry.label });
        }
        if ("children" in item) {
          for (const child of item.children) {
            items.push({
              label: child.label,
              href: child.href,
              path: `${entry.label} / ${item.label}`,
            });
          }
        }
      }
    }
  }

  return items;
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href;
}

function isPathWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(pathname: string, entry: NavEntry): boolean {
  if (entry.type !== "section") return false;

  return entry.items.some((item) => {
    if ("href" in item) {
      return isPathWithin(pathname, item.href);
    }
    if ("children" in item) {
      return item.children.some((child) => isPathWithin(pathname, child.href));
    }
    return false;
  });
}
