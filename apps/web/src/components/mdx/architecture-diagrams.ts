export type DiagramNodeTone = "default" | "primary" | "success" | "warning" | "danger";

export type DiagramHandlePosition = "top" | "right" | "bottom" | "left";

export interface DiagramNodeDefinition {
  id: string;
  label: string;
  position: Readonly<{ x: number; y: number }>;
  tone?: DiagramNodeTone;
}

export interface DiagramEdgeDefinition<NodeId extends string = string> {
  source: NodeId;
  target: NodeId;
  label?: string;
  dashed?: boolean;
  sourceHandle?: DiagramHandlePosition;
  targetHandle?: DiagramHandlePosition;
}

export interface ArchitectureDiagramDefinition {
  description: string;
  edges: readonly DiagramEdgeDefinition[];
  nodes: readonly DiagramNodeDefinition[];
  title: string;
}

function defineDiagram<const Nodes extends readonly DiagramNodeDefinition[]>(
  definition: Omit<ArchitectureDiagramDefinition, "edges" | "nodes"> & {
    edges: readonly DiagramEdgeDefinition<Nodes[number]["id"]>[];
    nodes: Nodes;
  },
) {
  return definition;
}

export const architectureDiagrams = {
  "caching-lifecycle": defineDiagram({
    title: "Query cache lifecycle",
    description: "How a query moves between missing, fetching, fresh, and stale states.",
    nodes: [
      { id: "missing", label: "Missing", position: { x: 0, y: 130 } },
      { id: "fetching", label: "Fetching", position: { x: 250, y: 130 }, tone: "primary" },
      { id: "fresh", label: "Fresh", position: { x: 500, y: 20 }, tone: "success" },
      { id: "stale", label: "Stale", position: { x: 500, y: 240 }, tone: "warning" },
    ],
    edges: [
      { source: "missing", target: "fetching", label: "mount" },
      { source: "fetching", target: "fresh", label: "success" },
      { source: "fresh", target: "stale", label: "stale time expires" },
      { source: "stale", target: "fetching", label: "active refetch" },
      {
        source: "fresh",
        target: "fetching",
        label: "invalidate",
        sourceHandle: "left",
        targetHandle: "top",
      },
      {
        source: "fetching",
        target: "fresh",
        label: "cache updated",
        sourceHandle: "bottom",
        targetHandle: "bottom",
        dashed: true,
      },
    ],
  }),
  "crud-boundaries": defineDiagram({
    title: "Replaceable CRUD boundaries",
    description: "Route composition injects either the production repository or a test double.",
    nodes: [
      { id: "route", label: "Route composition", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "service", label: "NoteService", position: { x: 300, y: 130 }, tone: "success" },
      { id: "repository", label: "NoteRepository", position: { x: 0, y: 240 } },
      { id: "test-double", label: "Repository test double", position: { x: 0, y: 390 } },
      { id: "drizzle", label: "Drizzle", position: { x: 600, y: 240 } },
    ],
    edges: [
      { source: "route", target: "service", label: "inject" },
      { source: "repository", target: "service", label: "data access" },
      { source: "test-double", target: "service", label: "same interface", dashed: true },
      { source: "repository", target: "drizzle" },
    ],
  }),
  "crud-request-flow": defineDiagram({
    title: "CRUD request flow",
    description:
      "A note operation crosses typed UI, API, authorization, service, and storage boundaries.",
    nodes: [
      { id: "ui", label: "React notes UI", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "query", label: "TanStack Query hooks", position: { x: 240, y: 20 } },
      { id: "client", label: "Typed Hono client", position: { x: 480, y: 20 } },
      { id: "route", label: "OpenAPI route", position: { x: 720, y: 20 } },
      { id: "auth", label: "Session authorization", position: { x: 720, y: 230 }, tone: "warning" },
      { id: "service", label: "Note service", position: { x: 480, y: 230 } },
      { id: "repository", label: "Note repository", position: { x: 240, y: 230 } },
      {
        id: "database",
        label: "Drizzle and PostgreSQL",
        position: { x: 0, y: 230 },
        tone: "success",
      },
    ],
    edges: [
      { source: "ui", target: "query" },
      { source: "query", target: "client" },
      { source: "client", target: "route" },
      { source: "route", target: "auth" },
      { source: "auth", target: "service" },
      { source: "service", target: "repository" },
      { source: "repository", target: "database" },
    ],
  }),
  "data-fetching-lifecycle": defineDiagram({
    title: "Server-state lifecycle",
    description: "Loading, error, success, and background fetching remain distinct UI states.",
    nodes: [
      { id: "loading", label: "Loading", position: { x: 0, y: 130 }, tone: "primary" },
      { id: "success", label: "Success", position: { x: 280, y: 20 }, tone: "success" },
      { id: "error", label: "Error", position: { x: 280, y: 240 }, tone: "danger" },
      {
        id: "fetching",
        label: "Background fetching",
        position: { x: 560, y: 20 },
        tone: "primary",
      },
    ],
    edges: [
      { source: "loading", target: "success", label: "response" },
      { source: "loading", target: "error", label: "failure" },
      { source: "success", target: "fetching", label: "interval or refetch" },
      { source: "fetching", target: "success", label: "fresh response" },
      {
        source: "fetching",
        target: "success",
        label: "cached-data failure",
        dashed: true,
        sourceHandle: "bottom",
        targetHandle: "bottom",
      },
      { source: "error", target: "loading", label: "retry" },
    ],
  }),
  "error-contract": defineDiagram({
    title: "Public error contract",
    description: "Each layer translates only the failure information owned by its boundary.",
    nodes: [
      { id: "repository", label: "Repository result or exception", position: { x: 0, y: 20 } },
      { id: "service", label: "Service use case", position: { x: 260, y: 20 } },
      { id: "route", label: "Route translates domain outcome", position: { x: 520, y: 20 } },
      {
        id: "handler",
        label: "Shared handler serializes failure",
        position: { x: 520, y: 230 },
        tone: "warning",
      },
      { id: "client", label: "Client validates envelope", position: { x: 260, y: 230 } },
      { id: "ui", label: "UI renders recovery", position: { x: 0, y: 230 }, tone: "primary" },
    ],
    edges: [
      { source: "repository", target: "service" },
      { source: "service", target: "route" },
      { source: "route", target: "handler" },
      { source: "handler", target: "client" },
      { source: "client", target: "ui" },
    ],
  }),
  "error-classification": defineDiagram({
    title: "Error classification",
    description: "Known failures retain safe detail; unknown failures are logged and masked.",
    nodes: [
      { id: "failure", label: "Thrown failure", position: { x: 280, y: 0 }, tone: "danger" },
      { id: "type", label: "Known error type?", position: { x: 280, y: 150 }, tone: "warning" },
      { id: "domain", label: "Preserve public code and status", position: { x: 0, y: 320 } },
      {
        id: "validation",
        label: "Return validation detail with 422",
        position: { x: 230, y: 320 },
      },
      { id: "http", label: "Map safe HTTP error", position: { x: 460, y: 320 } },
      {
        id: "internal",
        label: "Log privately and return masked 500",
        position: { x: 690, y: 320 },
        tone: "danger",
      },
      {
        id: "envelope",
        label: "Stable error envelope",
        position: { x: 345, y: 520 },
        tone: "success",
      },
    ],
    edges: [
      { source: "failure", target: "type" },
      { source: "type", target: "domain", label: "ApiError" },
      { source: "type", target: "validation", label: "ZodError" },
      { source: "type", target: "http", label: "HTTPException" },
      { source: "type", target: "internal", label: "unknown" },
      { source: "domain", target: "envelope" },
      { source: "validation", target: "envelope" },
      { source: "http", target: "envelope" },
      { source: "internal", target: "envelope" },
    ],
  }),
  "file-upload-flow": defineDiagram({
    title: "Private upload flow",
    description:
      "Client hints are followed by authoritative server validation and private R2 storage.",
    nodes: [
      { id: "input", label: "Browser file input", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "client", label: "Client checks", position: { x: 260, y: 20 } },
      { id: "form", label: "Typed multipart request", position: { x: 520, y: 20 } },
      { id: "auth", label: "Server session", position: { x: 520, y: 230 }, tone: "warning" },
      { id: "validate", label: "Authoritative Zod validation", position: { x: 260, y: 230 } },
      { id: "service", label: "File service creates UUID", position: { x: 0, y: 230 } },
      {
        id: "r2",
        label: "Private user-prefixed R2 object",
        position: { x: 0, y: 440 },
        tone: "success",
      },
    ],
    edges: [
      { source: "input", target: "client" },
      { source: "client", target: "form" },
      { source: "form", target: "auth" },
      { source: "auth", target: "validate" },
      { source: "validate", target: "service" },
      { source: "service", target: "r2" },
    ],
  }),
  "middleware-onion": defineDiagram({
    title: "Middleware request and response path",
    description: "The request enters in registration order and the response unwinds in reverse.",
    nodes: [
      { id: "request", label: "Request", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "request-id", label: "Request ID", position: { x: 250, y: 20 } },
      { id: "timing", label: "Timing", position: { x: 500, y: 20 } },
      { id: "security", label: "Security", position: { x: 500, y: 250 }, tone: "warning" },
      { id: "route", label: "Route", position: { x: 250, y: 250 }, tone: "success" },
    ],
    edges: [
      { source: "request", target: "request-id", label: "enter" },
      { source: "request-id", target: "timing", label: "enter" },
      { source: "timing", target: "security", label: "enter" },
      { source: "security", target: "route", label: "handle" },
      {
        source: "route",
        target: "security",
        label: "response",
        dashed: true,
        sourceHandle: "bottom",
        targetHandle: "bottom",
      },
      { source: "security", target: "timing", label: "headers", dashed: true },
      {
        source: "timing",
        target: "request-id",
        label: "server timing",
        dashed: true,
        sourceHandle: "top",
        targetHandle: "top",
      },
      {
        source: "request-id",
        target: "request",
        label: "completed",
        dashed: true,
        sourceHandle: "bottom",
        targetHandle: "bottom",
      },
    ],
  }),
  "pagination-flow": defineDiagram({
    title: "Pagination data flow",
    description: "One validated page input drives an ordered slice and a matching total count.",
    nodes: [
      { id: "controls", label: "Page controls", position: { x: 0, y: 130 }, tone: "primary" },
      { id: "url", label: "Validated URL state", position: { x: 250, y: 130 } },
      { id: "key", label: "Query key with page inputs", position: { x: 500, y: 130 } },
      { id: "api", label: "Notes API", position: { x: 750, y: 130 } },
      { id: "rows", label: "Ordered rows with limit and offset", position: { x: 500, y: 340 } },
      { id: "count", label: "Total count with the same filter", position: { x: 750, y: 340 } },
      {
        id: "response",
        label: "Items and page metadata",
        position: { x: 250, y: 340 },
        tone: "success",
      },
    ],
    edges: [
      { source: "controls", target: "url" },
      { source: "url", target: "key" },
      { source: "key", target: "api" },
      { source: "api", target: "rows" },
      { source: "api", target: "count" },
      { source: "rows", target: "response" },
      { source: "count", target: "response" },
    ],
  }),
  "routing-flow": defineDiagram({
    title: "URL routing flow",
    description: "Generated matching and search validation happen before guards and rendering.",
    nodes: [
      { id: "url", label: "URL", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "match", label: "Generated route match", position: { x: 250, y: 20 } },
      { id: "search", label: "Validate search parameters", position: { x: 500, y: 20 } },
      {
        id: "guard",
        label: "Run authentication layout",
        position: { x: 500, y: 230 },
        tone: "warning",
      },
      {
        id: "render",
        label: "Render matched component",
        position: { x: 250, y: 230 },
        tone: "success",
      },
      { id: "fallback", label: "Use schema fallback", position: { x: 750, y: 230 } },
    ],
    edges: [
      { source: "url", target: "match" },
      { source: "match", target: "search" },
      { source: "search", target: "guard" },
      { source: "guard", target: "render" },
      { source: "search", target: "fallback", label: "invalid value", dashed: true },
    ],
  }),
  "search-filter-flow": defineDiagram({
    title: "Debounced search flow",
    description: "Draft input becomes shareable URL state before selecting a cached API result.",
    nodes: [
      { id: "reader", label: "Reader", position: { x: 0, y: 20 }, tone: "primary" },
      { id: "draft", label: "Input draft", position: { x: 250, y: 20 } },
      { id: "url", label: "Router search", position: { x: 500, y: 20 } },
      { id: "cache", label: "Query cache", position: { x: 500, y: 250 } },
      { id: "api", label: "API", position: { x: 250, y: 250 }, tone: "success" },
    ],
    edges: [
      { source: "reader", target: "draft", label: "type text" },
      { source: "draft", target: "url", label: "commit after 300 ms" },
      { source: "url", target: "cache", label: "key with query" },
      { source: "cache", target: "api", label: "filtered page" },
      {
        source: "api",
        target: "cache",
        label: "matches and total",
        dashed: true,
        sourceHandle: "bottom",
        targetHandle: "bottom",
      },
      { source: "cache", target: "reader", label: "render results", dashed: true },
    ],
  }),
  "task-state": defineDiagram({
    title: "Local task state",
    description: "The reducer keeps an empty or active task collection through explicit actions.",
    nodes: [
      { id: "empty", label: "Empty", position: { x: 0, y: 100 } },
      { id: "active", label: "Active", position: { x: 330, y: 100 }, tone: "primary" },
    ],
    edges: [
      { source: "empty", target: "active", label: "add" },
      {
        source: "active",
        target: "active",
        label: "add, toggle, or remove",
        sourceHandle: "right",
        targetHandle: "bottom",
      },
      {
        source: "active",
        target: "empty",
        label: "remove final task",
        sourceHandle: "top",
        targetHandle: "top",
        dashed: true,
      },
    ],
  }),
  "table-data-flow": defineDiagram({
    title: "Server-backed table flow",
    description:
      "Navigation owns collection inputs while the server returns rows ready for TanStack Table.",
    nodes: [
      {
        id: "controls",
        label: "Search, sort, and page controls",
        position: { x: 0, y: 20 },
        tone: "primary",
      },
      { id: "url", label: "Router search state", position: { x: 260, y: 20 } },
      { id: "query", label: "TanStack Query key", position: { x: 520, y: 20 } },
      { id: "api", label: "Server filtering, sorting, pagination", position: { x: 520, y: 240 } },
      {
        id: "table",
        label: "TanStack Table receives processed rows",
        position: { x: 260, y: 240 },
        tone: "success",
      },
      { id: "visibility", label: "Column visibility", position: { x: 0, y: 240 } },
      { id: "markup", label: "Semantic table markup", position: { x: 260, y: 450 } },
    ],
    edges: [
      { source: "controls", target: "url" },
      { source: "url", target: "query" },
      { source: "query", target: "api" },
      { source: "api", target: "table" },
      { source: "visibility", target: "table" },
      { source: "table", target: "markup" },
    ],
  }),
  "validation-flow": defineDiagram({
    title: "Validation result flow",
    description: "Parsing produces either a typed value or accessible field-level feedback.",
    nodes: [
      { id: "draft", label: "Unknown draft", position: { x: 0, y: 130 } },
      { id: "parse", label: "Zod safeParse", position: { x: 260, y: 130 }, tone: "primary" },
      { id: "typed", label: "Typed note value", position: { x: 520, y: 20 }, tone: "success" },
      { id: "errors", label: "Field error map", position: { x: 520, y: 240 }, tone: "danger" },
      { id: "focus", label: "Focus first invalid field", position: { x: 780, y: 160 } },
      { id: "aria", label: "Connect error text with ARIA", position: { x: 780, y: 320 } },
    ],
    edges: [
      { source: "draft", target: "parse" },
      { source: "parse", target: "typed", label: "success" },
      { source: "parse", target: "errors", label: "failure" },
      { source: "errors", target: "focus" },
      { source: "errors", target: "aria" },
    ],
  }),
} as const satisfies Record<string, ArchitectureDiagramDefinition>;

export type ArchitectureDiagramId = keyof typeof architectureDiagrams;
