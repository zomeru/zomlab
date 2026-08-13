# Core Module Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all implemented Core labs follow one UI, state, API, service, accessibility, and
testing architecture while preserving their routes and educational behavior.

**Architecture:** Routes own validated URL state, Core components compose shared application and UI
primitives, hooks own typed HTTP and TanStack Query behavior, Hono routes own HTTP translation,
services consume injected repositories, and repositories own PostgreSQL or R2. Worker-specific R2
tests run in a separate workerd Vitest project.

**Tech Stack:** TypeScript 6, React 19, TanStack Start/Router/Query/Table, Hono, Zod 4, Drizzle,
Radix UI, Tailwind CSS 4, Vitest 4, `@cloudflare/vitest-pool-workers`, Playwright, Storybook, pnpm,
and Turborepo.

## Global Constraints

- Use Node.js `>=24.18.1` and pnpm `11.20.0` from the repository root.
- Preserve unrelated user changes and never edit generated route, Worker type, migration, or graph
  files manually.
- Use `@zomlab/ui` only for application-wide primitives; keep domain components in their Core lab.
- Preserve existing routes, API envelopes, ownership rules, private cache headers, and external
  behavior except approved accessibility, confirmation, and error-propagation corrections.
- Use semantic Tailwind tokens and the existing visible-focus and reduced-motion conventions.
- Keep TanStack Query as the only owner of server state and TanStack Router search parameters as the
  owner of shareable URL state.
- Do not add KV, Argon2, WebAssembly, optimistic writes, or a generic CRUD/resource framework.
- Follow test-first steps for behavioral changes and commit each independently reviewable task.

---

### Task 1: Add the separate workerd test lane

**Files:**

- Modify: `package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.workers.config.ts`
- Create: `apps/web/tsconfig.worker-tests.json`
- Create: `apps/web/src/integration/hono/storage/core/files.repository.worker.test.ts`
- Modify: `pnpm-lock.yaml` through pnpm

**Interfaces:**

- Produces: `pnpm test:workers` at the root and `pnpm --filter @zomlab/web test:workers`.
- Produces: a workerd project that includes only `**/*.worker.test.ts`.
- Consumes: `apps/web/wrangler.jsonc` staging compatibility settings and `FILE_UPLOADS` R2 binding.

- [ ] **Step 1: Add the R2 characterization test before the worker script exists**

```ts
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createFileRepository } from "./files.repository";

describe("FileRepository in workerd", () => {
  it("round-trips a private R2 object and isolates user prefixes", async () => {
    const repository = createFileRepository(env.FILE_UPLOADS);
    const file = new File(["Core worker test"], "worker.txt", { type: "text/plain" });

    const uploaded = await repository.put("user-a", "file-a", file);

    expect(uploaded).toMatchObject({
      id: "file-a",
      name: "worker.txt",
      size: file.size,
      type: "text/plain",
    });
    expect(await repository.list("user-b")).toEqual([]);
    expect(await repository.list("user-a")).toEqual([uploaded]);

    const stored = await repository.get("user-a", "file-a");
    expect(stored).not.toBeNull();
    expect(await stored?.text()).toBe("Core worker test");

    expect(await repository.delete("user-a", "file-a")).toBe(true);
    expect(await repository.delete("user-a", "file-a")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the missing script and confirm the lane is not configured**

Run: `pnpm --filter @zomlab/web test:workers`

Expected: FAIL because `test:workers` does not exist.

- [ ] **Step 3: Install the compatible pool package**

Run: `pnpm add -D @cloudflare/vitest-pool-workers@^0.21.2 --filter @zomlab/web`

Expected: `apps/web/package.json` and `pnpm-lock.yaml` record the dependency without changing the
installed Vitest major.

- [ ] **Step 4: Add the workerd config and isolated TypeScript config**

```ts
// apps/web/vitest.workers.config.ts
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.jsonc",
        environment: "staging",
      },
    }),
  ],
  test: {
    include: ["**/*.worker.test.ts"],
  },
});
```

```jsonc
// apps/web/tsconfig.worker-tests.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["@cloudflare/vitest-pool-workers/types", "./worker-configuration.d.ts"]
  },
  "include": [
    "src/**/*.worker.test.ts",
    "vitest.workers.config.ts",
    "worker-configuration.d.ts"
  ]
}
```

- [ ] **Step 5: Exclude worker tests from the normal web project**

```ts
import base from "@zomlab/vitest-config";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    exclude: [...configDefaults.exclude, "**/*.worker.test.ts"],
  },
});
```

- [ ] **Step 6: Add scripts and include worker types in the web type gate**

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "check-types": "tsc --noEmit && tsc --noEmit -p tsconfig.worker-tests.json",
    "test": "vitest run",
    "test:workers": "vitest run --config vitest.workers.config.ts"
  }
}
```

Add to the root `package.json` and append `pnpm run test:workers` after `pnpm run test` in
`check:all`:

```json
{
  "scripts": {
    "test:workers": "pnpm --filter @zomlab/web test:workers"
  }
}
```

- [ ] **Step 7: Run the worker lane and type gates**

Run: `pnpm test:workers`

Expected: PASS with the R2 round-trip test inside workerd.

Run: `pnpm check-types`

Expected: PASS for both application and worker-test TypeScript projects.

- [ ] **Step 8: Commit the worker test lane**

```bash
git add package.json apps/web/package.json apps/web/vitest.config.ts \
  apps/web/vitest.workers.config.ts apps/web/tsconfig.worker-tests.json \
  apps/web/src/integration/hono/storage/core/files.repository.worker.test.ts pnpm-lock.yaml
git commit -m "test(web): add workerd worker test lane"
```

### Task 2: Add tested query keys, API response parsing, and formatters

**Files:**

- Create: `apps/web/src/lib/query-keys.ts`
- Create: `apps/web/src/lib/query-keys.test.ts`
- Create: `apps/web/src/lib/api-response.ts`
- Create: `apps/web/src/lib/api-response.test.ts`
- Create: `apps/web/src/labs/core/shared/formatters.ts`
- Create: `apps/web/src/labs/core/shared/formatters.test.ts`

**Interfaces:**

- Produces: `queryKeys.health`, `queryKeys.files`, `queryKeys.notes.list(query)`, and
  `queryKeys.notes.detail(id)`.
- Produces: `readJsonResponse<T>(response, fallbackMessage): Promise<T>`.
- Produces: `formatDate`, `formatDateTime`, `formatTime`, `formatDuration`, and `formatBytes`.

- [ ] **Step 1: Write failing query-key tests**

```ts
import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("keeps list inputs and detail IDs under stable prefixes", () => {
    const query = { page: 2, pageSize: 5, query: "core" };

    expect(queryKeys.notes.list(query)).toEqual(["notes", "list", query]);
    expect(queryKeys.notes.detail("note-1")).toEqual(["notes", "detail", "note-1"]);
    expect(queryKeys.files.all).toEqual(["files"]);
    expect(queryKeys.health.all).toEqual(["health"]);
  });
});
```

- [ ] **Step 2: Write failing response-parser tests**

```ts
import { describe, expect, it } from "vitest";
import { ApiResponseError, readJsonResponse } from "./api-response";

describe("readJsonResponse", () => {
  it("returns successful typed JSON", async () => {
    const response = Response.json({ status: "ok" });
    await expect(readJsonResponse(response, "Request failed")).resolves.toEqual({ status: "ok" });
  });

  it("throws the public API message for an unsuccessful response", async () => {
    const response = Response.json(
      { error: { code: "NOTE_NOT_FOUND", message: "Note not found" } },
      { status: 404 },
    );

    await expect(readJsonResponse(response, "Request failed")).rejects.toMatchObject<
      Partial<ApiResponseError>
    >({ code: "NOTE_NOT_FOUND", message: "Note not found", status: 404 });
  });

  it("uses stable fallback copy for malformed failures", async () => {
    const response = new Response(null, { status: 503 });
    await expect(readJsonResponse(response, "Files are unavailable")).rejects.toThrow(
      "Files are unavailable",
    );
  });
});
```

- [ ] **Step 3: Write failing formatter tests**

```ts
import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatDuration } from "./formatters";

describe("Core formatters", () => {
  it("formats comparable values consistently", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatDuration(12.34)).toBe("12.3 ms");
    expect(formatDate("2026-08-13T00:00:00.000Z")).toContain("Aug");
  });
});
```

- [ ] **Step 4: Run the tests and confirm missing-module failures**

Run: `pnpm test -- apps/web/src/lib/query-keys.test.ts apps/web/src/lib/api-response.test.ts apps/web/src/labs/core/shared/formatters.test.ts`

Expected: FAIL because the three modules do not exist.

- [ ] **Step 5: Implement stable query-key factories**

```ts
import type { NoteListQuery } from "@zomlab/contracts";

export const queryKeys = {
  files: { all: ["files"] as const },
  health: { all: ["health"] as const },
  notes: {
    all: ["notes"] as const,
    lists: ["notes", "list"] as const,
    list: (query: NoteListQuery) => ["notes", "list", query] as const,
    details: ["notes", "detail"] as const,
    detail: (id: string) => ["notes", "detail", id] as const,
  },
} as const;
```

- [ ] **Step 6: Implement the public response parser**

Implement `ApiResponseError` with `status`, optional `code`, and optional `detail`. Parse failed JSON
with `apiErrorSchema.safeParse`, never expose malformed bodies, and return successful JSON through
the response's inferred `json()` method.

```ts
type JsonResponse<T> = Response & { json(): Promise<T> };

export async function readJsonResponse<T>(
  response: JsonResponse<T>,
  fallbackMessage: string,
): Promise<T>;
```

- [ ] **Step 7: Implement fixed-locale `Intl` formatters**

Use module-level formatters with locale `en-US` and timezone `UTC`. Include `UTC` in time and
date-time output so the stable timezone is visible rather than misleading.

- [ ] **Step 8: Run focused tests and commit**

Run: `pnpm test -- apps/web/src/lib/query-keys.test.ts apps/web/src/lib/api-response.test.ts apps/web/src/labs/core/shared/formatters.test.ts`

Expected: PASS.

```bash
git add apps/web/src/lib/query-keys.ts apps/web/src/lib/query-keys.test.ts \
  apps/web/src/lib/api-response.ts apps/web/src/lib/api-response.test.ts \
  apps/web/src/labs/core/shared/formatters.ts \
  apps/web/src/labs/core/shared/formatters.test.ts
git commit -m "refactor(core): centralize client data utilities"
```

### Task 3: Standardize Core query and mutation hooks

**Files:**

- Modify: `apps/web/src/hooks/use-health.ts`
- Modify: `apps/web/src/labs/core/crud/hooks/use-notes.ts`
- Modify: `apps/web/src/labs/core/crud/hooks/use-note.ts`
- Modify: `apps/web/src/labs/core/crud/hooks/use-create-note.ts`
- Modify: `apps/web/src/labs/core/crud/hooks/use-update-note.ts`
- Modify: `apps/web/src/labs/core/crud/hooks/use-delete-note.ts`
- Modify: `apps/web/src/labs/core/file-uploads/hooks/use-files.ts`

**Interfaces:**

- Consumes: `queryKeys` and `readJsonResponse` from Task 2.
- Produces: hooks that reject every non-2xx response and invalidate only stable key prefixes.

- [ ] **Step 1: Add a regression test for failed delete responses**

Extend `api-response.test.ts` with a 404 delete envelope and assert that parsing rejects before a
mutation can call its success path. This test stays at the response boundary because the repository
does not currently install a React hook renderer.

- [ ] **Step 2: Refactor read hooks**

Use these exact key mappings and safe fallback messages:

```ts
queryKeys.health.all;
queryKeys.notes.list(options);
queryKeys.notes.detail(id);
queryKeys.files.all;
```

Use these fallback messages with `readJsonResponse`: `"Health data is unavailable"` for health,
`"Notes could not be loaded"` for note lists, `"The note could not be loaded"` for note detail,
and `"Files could not be loaded"` for file lists. Retain `keepPreviousData` for note lists and the
30-second health refetch interval.

- [ ] **Step 3: Refactor mutation hooks**

- Create note: parse success JSON, then invalidate `queryKeys.notes.lists`.
- Update note: parse success JSON, then invalidate the exact detail and `notes.lists`.
- Delete note: require a successful parsed response, then invalidate `notes.lists` and remove the
  deleted detail key.
- Upload/delete file: require successful responses, then invalidate `queryKeys.files.all`.

- [ ] **Step 4: Run focused tests and type checking**

Run: `pnpm test -- apps/web/src/lib/api-response.test.ts apps/web/src/lib/query-keys.test.ts`

Run: `pnpm --filter @zomlab/web check-types`

Expected: PASS with no response casts or `any`.

- [ ] **Step 5: Commit the hook convergence**

```bash
git add apps/web/src/hooks/use-health.ts apps/web/src/labs/core/crud/hooks \
  apps/web/src/labs/core/file-uploads/hooks/use-files.ts apps/web/src/lib/api-response.test.ts
git commit -m "refactor(core): standardize query and mutation hooks"
```

### Task 4: Align notes and files service boundaries

**Files:**

- Modify: `packages/database/src/repositories/core/crud.ts`
- Create: `apps/web/src/integration/hono/service/core/notes.service.test.ts`
- Create: `apps/web/src/integration/hono/service/core/files.service.test.ts`
- Modify: `apps/web/src/integration/hono/service/core/notes.service.ts`
- Modify: `apps/web/src/integration/hono/service/core/files.service.ts`
- Modify: `apps/web/src/integration/hono/routes/core/notes.route.ts`
- Modify: `apps/web/src/integration/hono/routes/core/files.route.ts`

**Interfaces:**

- Consumes: the existing exported `NoteRepository` and `FileRepository` interfaces.
- Produces: `createNoteService(repository: NoteRepository)` and
  `createFileService(repository: FileRepository)`.
- Produces: missing note/file results translated only at the Hono route boundary.

- [ ] **Step 1: Write failing note-service tests with a repository fake**

Cover `getById`, `update`, and `delete` returning `null`/`false` from the repository. Assert service
methods return a deliberate missing value. Add a repository rejection test and assert the exact error
escapes unchanged rather than becoming a missing result.

- [ ] **Step 2: Write failing file-service tests with a repository fake**

Pass a fake `FileRepository` directly. Assert list totals, upload delegation, missing download, and
missing delete behavior without constructing an R2 bucket.

- [ ] **Step 3: Run service tests and confirm constructor/type failures**

Run: `pnpm test -- apps/web/src/integration/hono/service/core/notes.service.test.ts apps/web/src/integration/hono/service/core/files.service.test.ts`

Expected: FAIL because both service factories still construct or accept concrete storage.

- [ ] **Step 4: Reuse the repository boundaries and inject both repositories**

```ts
export type NoteRepository = ReturnType<typeof createNoteRepository>;

export function createNoteService(repository: NoteRepository): NoteService;
export function createFileService(repository: FileRepository): FileService;
```

Make missing note reads/writes return `null`; keep list/create success types unchanged. Do not catch
repository errors in services.

- [ ] **Step 5: Compose repositories in route modules and narrow 404 translation**

```ts
const noteService = createNoteService(createNoteRepository());
const fileService = createFileService(createFileRepository(env.FILE_UPLOADS));
```

Replace broad notes `try/catch` blocks with explicit missing-result checks. Keep `NoteNotFoundError`
and `FileNotFoundError` at the route boundary. Change the PATCH OpenAPI description to
`"Note updated"`.

- [ ] **Step 6: Run service, error-handler, and API contract tests**

Run: `pnpm test -- apps/web/src/integration/hono/service/core/notes.service.test.ts apps/web/src/integration/hono/service/core/files.service.test.ts apps/web/src/integration/hono/errors/error-handler.test.ts`

Run: `pnpm test:e2e -- e2e/contracts/notes.contract.spec.ts e2e/contracts/files.contract.spec.ts`

Expected: PASS; unknown failures remain 500 and missing/non-owned resources remain 404.

- [ ] **Step 7: Commit the service boundary refactor**

```bash
git add packages/database/src/repositories/core/crud.ts \
  apps/web/src/integration/hono/service/core \
  apps/web/src/integration/hono/routes/core/notes.route.ts \
  apps/web/src/integration/hono/routes/core/files.route.ts
git commit -m "refactor(core): align service repository boundaries"
```

### Task 5: Add missing shared UI primitives

**Files:**

- Create: `packages/ui/src/components/select.tsx`
- Create: `packages/ui/src/components/checkbox.tsx`
- Create: `packages/ui/src/components/alert-dialog.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/components/design-system.stories.tsx`
- Modify: `packages/ui/src/components/composites.stories.tsx`

**Interfaces:**

- Produces: `Select(props: ComponentProps<"select">)`.
- Produces: `Checkbox` wrapping `Checkbox.Root` and `CheckboxIndicator` wrapping
  `Checkbox.Indicator`.
- Produces: composable `AlertDialog*` exports matching the installed Radix primitives.

- [ ] **Step 1: Add Storybook usages before implementing the exports**

Add a controlled checked checkbox and labeled native select to `design-system.stories.tsx`. Add an
AlertDialog with a destructive action and cancel action to `composites.stories.tsx`.

- [ ] **Step 2: Run UI type checking and confirm missing imports**

Run: `pnpm --filter @zomlab/ui check-types`

Expected: FAIL because the new component modules do not exist.

- [ ] **Step 3: Implement Select and Checkbox**

Select uses the existing input tokens, `h-10`, `rounded-md`, explicit background/foreground colors,
and visible focus. Checkbox uses Radix `Checkbox.Root` and `Checkbox.Indicator`, a Lucide `Check`
icon marked decorative, `size-5`, and `data-[state=checked]` semantic token styles.

- [ ] **Step 4: Implement AlertDialog primitives**

Export Root, Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Cancel, and Action.
Use the existing overlay shadow, semantic surfaces, reduced-motion-safe opacity/transform classes,
and `buttonVariants` for outline cancel and destructive action buttons. Let Radix own focus trapping,
Escape handling, and focus restoration.

- [ ] **Step 5: Export and verify primitives**

Run: `pnpm --filter @zomlab/ui check-types`

Run: `pnpm build-storybook`

Expected: PASS in default and dark Storybook themes.

- [ ] **Step 6: Commit the shared primitives**

```bash
git add packages/ui/src/components/select.tsx packages/ui/src/components/checkbox.tsx \
  packages/ui/src/components/alert-dialog.tsx packages/ui/src/index.ts \
  packages/ui/src/components/design-system.stories.tsx \
  packages/ui/src/components/composites.stories.tsx
git commit -m "feat(ui): add select checkbox and alert dialog"
```

### Task 6: Standardize Core page composition and URL-backed search

**Files:**

- Modify: `apps/web/src/labs/core/shared/core-demo-shell.tsx`
- Create: `apps/web/src/labs/core/shared/core-loading-state.tsx`
- Create: `apps/web/src/labs/core/shared/use-debounced-query.ts`
- Modify: `apps/web/src/labs/core/search-filter/components/search-filter-demo.tsx`
- Modify: `apps/web/src/labs/core/tables/components/tables-demo.tsx`
- Modify: `apps/web/src/routes/_authenticated.core.search-filter-demo.tsx`
- Modify: `apps/web/src/routes/_authenticated.core.tables-demo.tsx`

**Interfaces:**

- Produces: `CoreDemoShell({ width?: "standard" | "roomy" | "table" })`.
- Produces: `CoreLoadingState({ label, children, className? })`.
- Produces: `useDebouncedQuery({ query, onQueryChange, wait? })` returning `queryDraft` and
  `setQueryDraft`.
- Produces: matching `query`/`onQueryChange` props for search and table demos.

- [ ] **Step 1: Add E2E regression assertions for URL search ownership**

In `e2e/search-filter.spec.ts` and `e2e/tables.spec.ts`, retain the current single debounced request
assertion and add a back-navigation assertion that restores the field from the URL without emitting a
duplicate request.

- [ ] **Step 2: Run the two E2E specs before refactoring**

Run: `pnpm test:e2e -- e2e/search-filter.spec.ts e2e/tables.spec.ts`

Expected: the new back-navigation assertion should expose any duplicate or stale draft behavior.

- [ ] **Step 3: Add explicit shell widths and semantic loading wrapper**

Use a static width map rather than boolean props:

```ts
const widths = {
  roomy: "max-w-4xl",
  standard: "max-w-3xl",
  table: "max-w-6xl",
} as const;
```

`CoreLoadingState` renders `role="status"`, the supplied accessible label, and children without
choosing skeleton geometry.

- [ ] **Step 4: Extract debounced draft synchronization**

The shared hook synchronizes external query changes into the draft and invokes `onQueryChange` only
when the debounced value differs from the current URL value. Keep the wait at 300 ms.

- [ ] **Step 5: Move URL updates to both route components**

Use functional TanStack Router search updates that preserve existing parameters and reset `page` to
1 for tables. Pass stable callbacks to feature components.

- [ ] **Step 6: Run search/table E2E and type gates**

Run: `pnpm test:e2e -- e2e/search-filter.spec.ts e2e/tables.spec.ts`

Run: `pnpm --filter @zomlab/web check-types`

Expected: PASS with one URL owner and no duplicated effects in feature components.

- [ ] **Step 7: Commit shared Core composition**

```bash
git add apps/web/src/labs/core/shared \
  apps/web/src/labs/core/search-filter/components/search-filter-demo.tsx \
  apps/web/src/labs/core/tables/components/tables-demo.tsx \
  apps/web/src/routes/_authenticated.core.search-filter-demo.tsx \
  apps/web/src/routes/_authenticated.core.tables-demo.tsx \
  e2e/search-filter.spec.ts e2e/tables.spec.ts
git commit -m "refactor(core): standardize demo composition and search state"
```

### Task 7: Converge foundation demos on shared forms, states, and formatting

**Files:**

- Modify: `apps/web/src/labs/core/caching/components/caching-demo.tsx`
- Modify: `apps/web/src/labs/core/data-fetching/components/data-fetching-demo.tsx`
- Modify: `apps/web/src/labs/core/error-handling/components/error-handling-demo.tsx`
- Modify: `apps/web/src/labs/core/forms/components/forms-demo.tsx`
- Modify: `apps/web/src/labs/core/logging/components/logging-demo.tsx`
- Modify: `apps/web/src/labs/core/middleware/components/middleware-demo.tsx`
- Modify: `apps/web/src/labs/core/routing/components/routing-demo.tsx`
- Modify: `apps/web/src/labs/core/state-management/components/state-management-demo.tsx`
- Modify: `apps/web/src/labs/core/validation/components/validation-demo.tsx`
- Modify: `e2e/core-foundations.spec.ts`

**Interfaces:**

- Consumes: shared UI primitives, shell/loading composition, and formatters from Tasks 2, 5, and 6.
- Produces: consistent field, empty, loading, result, and navigation behavior across foundations.

- [ ] **Step 1: Add failing accessibility assertions**

In `e2e/core-foundations.spec.ts`:

- Submit validation with both fields empty and assert `Validated title` receives focus.
- Assert the task checkbox remains discoverable by its task label.
- Assert routing topic controls remain links and preserve `aria-current="page"`.

Run: `pnpm test:e2e -- e2e/core-foundations.spec.ts`

Expected: FAIL on first-invalid-field focus before the implementation.

- [ ] **Step 2: Standardize fields and validation**

- Forms: add stable `autocomplete="off"` and existing names to non-auth fields.
- Validation: keep refs for title/content, focus title then content based on errors, and clear success
  when either controlled value changes.
- State management: use `Field`/`FieldLabel`, shared Checkbox, and shared EmptyState.

- [ ] **Step 3: Standardize navigation and async states**

- Routing: compose topic Links through `Button asChild` or `buttonVariants`; remove copied button
  classes while retaining link semantics and active styles.
- Data fetching: use `CoreLoadingState` and shared time formatting.
- Caching: use the same time formatter and stable query key.
- Logging: use shared duration/time formatting.
- Error handling and middleware: preserve domain-specific cards and alerts inside the shared shell.

- [ ] **Step 4: Run foundation E2E and focused unit tests**

Run: `pnpm test:e2e -- e2e/core-foundations.spec.ts`

Run: `pnpm test -- apps/web/src/labs/core/shared/formatters.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the foundation convergence**

```bash
git add apps/web/src/labs/core/{caching,data-fetching,error-handling,forms,logging,middleware,routing,state-management,validation} \
  e2e/core-foundations.spec.ts
git commit -m "refactor(core): converge foundation demo patterns"
```

### Task 8: Converge CRUD, search, pagination, tables, and file uploads

**Files:**

- Modify: `apps/web/src/labs/core/crud/components/note-form.tsx`
- Modify: `apps/web/src/labs/core/crud/components/note-detail.tsx`
- Modify: `apps/web/src/labs/core/crud/components/notes-view.tsx`
- Delete: `apps/web/src/labs/core/crud/components/empty-states.tsx`
- Modify: `apps/web/src/labs/core/pagination/components/pagination-demo.tsx`
- Modify: `apps/web/src/labs/core/search-filter/components/search-empty-state.tsx`
- Modify: `apps/web/src/labs/core/search-filter/components/search-filter-demo.tsx`
- Modify: `apps/web/src/labs/core/tables/components/tables-demo.tsx`
- Modify: `apps/web/src/labs/core/tables/components/notes-table.tsx`
- Modify: `apps/web/src/labs/core/file-uploads/components/file-uploads-demo.tsx`
- Modify: `e2e/notes.spec.ts`
- Modify: `e2e/pagination.spec.ts`
- Modify: `e2e/tables.spec.ts`
- Modify: `e2e/file-uploads.spec.ts`

**Interfaces:**

- Consumes: `CoreDemoShell`, `CoreLoadingState`, Select, AlertDialog, Field, EmptyState, and formatters.
- Produces: one destructive confirmation interaction for notes and files.

- [ ] **Step 1: Update destructive E2E tests first**

After clicking a note or file Delete control, assert a dialog with a specific title appears, assert the
resource still exists before confirmation, click the destructive confirmation action, then assert the
existing deletion result.

Run: `pnpm test:e2e -- e2e/notes.spec.ts e2e/file-uploads.spec.ts`

Expected: FAIL because deletion is currently immediate.

- [ ] **Step 2: Standardize page shells and async collection states**

- CRUD, pagination, and search use standard width.
- File uploads use roomy width.
- Tables use table width.
- Replace repeated loading wrappers with `CoreLoadingState`.
- Replace styled empty paragraphs with `EmptyState`, `EmptyStateTitle`, and
  `EmptyStateDescription`.
- Delete the redundant CRUD `empty-states.tsx` wrapper and import the UI primitive directly.

- [ ] **Step 3: Standardize forms and responsive toolbars**

- Note create/edit forms use `Field`, labels, names, descriptions, inline errors, and consistent
  button rows.
- Pagination uses shared Select for page size and keeps URL-backed native semantics.
- File upload action rows stack on mobile and align horizontally from `sm` upward.
- Preserve table overflow and ensure long titles/content keep `min-w-0`, truncation, or wrapping.

- [ ] **Step 4: Add note and file AlertDialog confirmations**

Use the same structure and labels:

- title: `Delete note?` / `Delete file?`
- description: identify the resource and state that deletion cannot be undone;
- cancel: `Cancel`;
- action: `Delete note` / `Delete file`;
- pending action: `Deleting…` and disabled duplicate submission.

Keep mutation errors visible after the dialog closes or inside the controlled dialog until the user
can read and retry them.

- [ ] **Step 5: Replace local formatting**

Use Core formatters for note timestamps, table dates, uploaded dates, and file sizes. Remove local
`formatDate` and `formatBytes` functions.

- [ ] **Step 6: Run focused resource E2E tests**

Run: `pnpm test:e2e -- e2e/notes.spec.ts e2e/search-filter.spec.ts e2e/pagination.spec.ts e2e/tables.spec.ts e2e/file-uploads.spec.ts`

Expected: PASS for CRUD, search, pagination, sorting, uploads, confirmation, and ownership behavior.

- [ ] **Step 7: Commit the resource-demo convergence**

```bash
git add apps/web/src/labs/core/crud apps/web/src/labs/core/pagination \
  apps/web/src/labs/core/search-filter apps/web/src/labs/core/tables \
  apps/web/src/labs/core/file-uploads e2e/notes.spec.ts e2e/search-filter.spec.ts \
  e2e/pagination.spec.ts e2e/tables.spec.ts e2e/file-uploads.spec.ts
git commit -m "refactor(core): standardize resource demo interactions"
```

### Task 9: Reconcile documentation and execute every quality gate

**Files:**

- Modify: `apps/web/src/labs/core/*/content/overview.mdx` only where implementation wording changed
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: relevant Storybook stories if visual verification exposes a missing state
- Modify: relevant E2E specs only for confirmed accessibility or responsive regressions
- Generated by tool: `graphify-out/*`

**Interfaces:**

- Consumes: all completed tasks.
- Produces: accurate architecture/command documentation and a fully validated repository.

- [ ] **Step 1: Update docs to match implemented behavior**

Document repository injection, public client-error propagation, confirmation-based deletion, stable
query-key factories, and the separate workerd lane. Add `pnpm test:workers` to README and AGENTS
command tables. Preserve the accurate warning that non-Core navigation entries are planned; update
only the stale notes-service and Core documentation drift bullets that this refactor resolves.

- [ ] **Step 2: Refresh the generated knowledge graph**

Run: `graphify update .`

Expected: graph files update through the generator only.

- [ ] **Step 3: Run formatting and static policy gates**

Run in order:

```bash
pnpm format
pnpm lint:workflows
pnpm lint
pnpm deps:check
pnpm deps:unused
pnpm check-types
```

Expected: every command exits 0.

- [ ] **Step 4: Run unit, Worker, and browser suites**

```bash
pnpm test
pnpm test:workers
pnpm test:e2e
```

Expected: every command exits 0. Use an isolated database as required by the E2E suite.

- [ ] **Step 5: Build Storybook and the production application**

```bash
pnpm build-storybook
pnpm build
```

Expected: both builds exit 0.

- [ ] **Step 6: Verify visual and accessibility states manually**

Check representative foundation, form/validation, CRUD, table, and upload pages at mobile, tablet,
and desktop widths in light and dark themes. Traverse controls by keyboard, confirm visible focus,
open/cancel/confirm dialogs with keyboard, inspect accessible names, and verify no horizontal page
overflow outside the table container.

- [ ] **Step 7: Review the complete diff and commit documentation/generated updates**

Run: `git diff --check`

Run: `git status --short`

Confirm generated files were changed only by Graphify and no unrelated user files are staged.

```bash
git add README.md AGENTS.md apps/web/src/labs/core graphify-out
git commit -m "docs(core): align labs with standardized architecture"
```

- [ ] **Step 8: Request final code review**

Invoke `superpowers:requesting-code-review`, address confirmed findings, rerun the affected focused
tests, then invoke `superpowers:verification-before-completion` before reporting completion.
