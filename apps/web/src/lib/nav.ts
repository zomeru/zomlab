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
      { label: "Better Auth" },
      { label: "Passkeys" },
      { label: "RBAC" },
      { label: "MFA" },
    ],
  },
  {
    type: "section",
    label: "System",
    items: [{ label: "Status", href: "/status" }],
  },
] as const;

export type NavigableItem = { label: string; href: string; section: string };
