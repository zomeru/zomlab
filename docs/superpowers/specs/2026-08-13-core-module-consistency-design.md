# Core Module Consistency Refactor Design

**Date:** 2026-08-13

**Status:** Approved

## Summary

ZomLab's 14 implemented Core labs work, but they were completed in several batches and now expose
competing patterns for page composition, form controls, async states, URL state, query keys, client
errors, and service boundaries. This refactor will converge those implementations on the cleanest
existing patterns without creating a generic lab framework or changing the educational scope of the
modules.

The work covers rendered demos, route adapters, Core hooks, shared UI, Hono routes and services,
contracts, repositories, MDX documentation, and validation. External behavior remains stable except
for deliberate safety and correctness improvements such as destructive-action confirmation,
first-invalid-field focus, and proper HTTP error propagation.

## Goals

- Make every Core module feel like part of one application and design system.
- Use `@zomlab/ui` for general-purpose controls and interaction primitives.
- Keep Core-specific composition in `apps/web/src/labs/core/shared`.
- Standardize loading, empty, error, success, disabled, and pending behavior.
- Keep URL state, TanStack Query state, and local draft state in clearly defined owners.
- Make every typed client hook reject unsuccessful HTTP responses consistently.
- Align the notes and files service/repository boundaries without changing ownership guarantees.
- Add a separate workerd-based Vitest lane for behavior that Node and jsdom cannot model faithfully.
- Preserve existing routes, API response shapes, user data, and module-specific teaching behavior.

## Non-goals

- Building a generic CRUD, resource-list, form, or query framework.
- Moving domain-specific note, file, search, pagination, or table components into `@zomlab/ui`.
- Adding optimistic updates where the current flows do not require them.
- Replacing TanStack Query, TanStack Router, Hono, Zod, Drizzle, or existing contracts.
- Adding KV, Argon2, WebAssembly, or rate-limit behavior that the repository does not currently use.
- Redesigning the documentation shell, authentication experience, or non-Core navigation.

## Audit findings

### Shared UI and visual composition

- Nine foundation demos use `CoreDemoShell`; CRUD, file uploads, pagination, search, and tables
  repeat page-width and header markup with different widths and spacing.
- Pagination renders a hand-styled native `<select>`, state management renders a hand-styled
  checkbox, and routing duplicates button classes on links.
- CRUD uses a domain wrapper around `EmptyState`, while pagination, tables, and state management use
  styled paragraphs for equivalent empty collection states.
- Loading skeletons repeatedly recreate the same semantic `role="status"` wrapper.
- File upload actions and several toolbars assume horizontal space and need consistent mobile
  stacking.
- Dates, times, durations, and file sizes use several different locale and number formatting paths.

### Forms and accessibility

- Foundation form examples use `Field` primitives, while notes forms use direct `Label` and spacing
  markup.
- Some controls are missing stable `name` and autocomplete intent.
- Validation associates field errors correctly but does not focus the first invalid field.
- Validation success can remain visible after the validated draft changes.
- Note and file deletion occur immediately, with no confirmation or undo opportunity.
- Current primitives provide strong focus styling and semantic HTML; the inconsistent areas are
  mainly module-level composition and missing foundational controls.

### Client data and state

- Query keys are repeated as array literals across hooks and components.
- Notes hooks parse JSON without checking `response.ok`; delete can report success after a failed
  response. File and health hooks check status but discard the server's public error message.
- Search and tables independently implement the same prop-to-draft synchronization and debounced URL
  update flow.
- TanStack Query otherwise owns server state consistently, including placeholder data for pagination.

### Server architecture

- `createNoteService()` constructs its repository internally, while the file service is configured
  from its storage dependency.
- Notes routes catch every service error and translate it to 404, which can mask infrastructure
  failures. File routes translate only an explicit missing result.
- The notes update OpenAPI response is described as "Note created" instead of "Note updated".
- Contracts and ownership filtering are otherwise consistent: notes and files are scoped to the
  authenticated user and missing/non-owned resources do not reveal cross-user existence.

### Testing

- The default Vitest workspace runs Node/thread-based projects only.
- Core file storage relies on R2 and `cloudflare:workers`, so the most production-relevant repository
  behavior is currently covered only through browser tests against the development Worker runtime.
- `@cloudflare/vitest-pool-workers` version `0.21.2` supports the installed Vitest `4.1.10` and uses
  `cloudflareTest()` as a Vite plugin. The Workers pool is configured per Vitest project, so it must
  remain separate from the default Node/jsdom project.

## Target architecture

```text
TanStack route
  -> Core feature component
  -> Core-shared composition
  -> @zomlab/ui primitives

Core feature component
  -> typed query/mutation hook
  -> query-key factory + response parser
  -> typed Hono client
  -> Hono route
  -> injected service
  -> injected repository
  -> PostgreSQL or R2 binding
```

### Ownership rules

- Route files validate and own URL search state, then pass typed values and callbacks to features.
- Feature components orchestrate local drafts and compose UI; they do not issue raw network calls.
- Hooks own typed API calls, TanStack Query keys, invalidation, and HTTP-to-error conversion.
- Hono routes own authentication, request validation, HTTP status codes, and public domain errors.
- Services own use-case behavior and consume repository interfaces.
- Repositories own Drizzle or R2 operations and never render HTTP concerns.
- Contracts remain the source of shared request and response types.

## UI and component design

### `@zomlab/ui`

Add only missing application-wide primitives:

- `Select`: a styled native select that preserves platform semantics, explicit theme colors, focus
  treatment, disabled state, and the existing control height/radius.
- `Checkbox`: an accessible checkbox primitive with a shared visual treatment and minimum target
  size when composed with its label.
- `AlertDialog`: composable confirmation primitives based on the installed Radix UI dependency,
  including focus trapping, Escape handling, focus restoration, and cancel/confirm actions.

Export the new primitives consistently and add Storybook examples for default, disabled, error,
pending, destructive, and dark-theme states. Do not move Core-specific text or workflows into the UI
package.

### Core-shared composition

Extend `CoreDemoShell` with explicit content-width variants for standard, roomy, and table layouts.
Every top-level Core demo will use it instead of recreating page headers and width containers.

Add a small semantic loading wrapper in `apps/web/src/labs/core/shared` that supplies the stable
status region while accepting module-specific skeleton shapes as children. Keep error copy and empty
state copy inside each domain, using `Alert` and `EmptyState` primitives directly.

Add shared `Intl.DateTimeFormat` and `Intl.NumberFormat` helpers for Core dates, times, durations, and
file sizes. These helpers must produce stable output during hydration and expose tabular values where
comparison matters.

### Forms and actions

- Use `Field`, `FieldLabel`, `FieldError`, and descriptions consistently in forms.
- Give controls stable `name`, appropriate `autocomplete`, type, and input intent.
- Keep submit actions enabled until submission begins; show stable pending labels and disable during
  active mutations.
- Focus the first invalid field after failed validation.
- Clear stale success feedback when the associated draft changes.
- Use the same AlertDialog composition for note and file deletion. Pending destructive operations
  remain protected from duplicate submission.
- Compose routing topic links with shared button behavior instead of duplicating Tailwind classes.

### Responsive and thematic behavior

- Form actions and toolbars stack at mobile widths and align horizontally at larger breakpoints.
- Tables retain semantic markup and horizontal overflow rather than hiding important columns or
  actions.
- Long user-controlled filenames, note titles, and note content must truncate, wrap, or break without
  forcing page overflow.
- All new components use semantic tokens and must render correctly in both `.light` and `.dark`
  themes.
- Existing reduced-motion and visible-focus behavior remains intact.

## Client data and state design

### Query keys

Create stable query-key factories for:

- health
- note collections, including page, page size, query, sort field, and direction
- individual note details
- files

All queries, mutations, and explicit invalidations use these factories. Prefix invalidation remains
available for refreshing all note collections after a write.

### API response handling

Add one typed helper under `apps/web/src/lib` that:

1. checks `response.ok`;
2. returns successful JSON when present;
3. parses the public `{ error: { code, message, detail? } }` envelope on failure;
4. throws an `Error` containing safe, actionable public copy;
5. falls back to a stable generic message for malformed or empty failures.

Use it in health, notes, and files hooks. A mutation only reaches `onSuccess` after an actually
successful response.

### URL-backed search

Move the duplicated debounced-query draft behavior into a Core-shared hook. Search and table route
components own the typed functional URL update; feature components receive consistent `query` and
`onQueryChange` inputs. Page changes reset to page 1 when query or sort state changes.

TanStack Query remains the only server-state owner. Pagination keeps `placeholderData` so background
page changes do not replace useful content with a full loading state.

## Server design

### Repository injection

Change both service factories to consume their repository interface explicitly:

```ts
createNoteService(repository: NoteRepository): NoteService
createFileService(repository: FileRepository): FileService
```

Route modules compose the concrete repositories with their services. This keeps the existing module
shape and Hono client inference while making service behavior independently testable.

### Missing resources and errors

- Note `getById`, `update`, and `delete` service operations return a deliberate missing result rather
  than throwing a generic error.
- Files retain the same deliberate missing-result convention.
- Hono handlers translate only those missing results to `NoteNotFoundError` or `FileNotFoundError`.
- Unexpected repository and service failures reach `apiErrorHandler`, are logged server-side, and are
  masked as the existing 500 envelope.
- Update the notes PATCH OpenAPI description to "Note updated".
- Preserve status 422 validation, 401 authentication, 403 middleware, 404 ownership, private cache
  headers, and all existing public response shapes.

## Worker-runtime testing design

Add `@cloudflare/vitest-pool-workers` as an `apps/web` development dependency and add a separate
`apps/web/vitest.workers.config.ts`:

```ts
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

Wrangler remains the source of truth for the Worker entry point, compatibility date,
`nodejs_compat`, and `FILE_UPLOADS` binding. Test-only Miniflare overrides may be added only when an
implemented test requires them.

Add `**/*.worker.test.ts` to the default web Vitest project's exclusions while extending
`configDefaults.exclude`. Add a worker-test TypeScript configuration that loads
`@cloudflare/vitest-pool-workers/types` and the generated Worker types without adding Worker test
globals to the normal application project.

Add an initial R2 repository worker test that verifies:

- upload and metadata serialization;
- listing order and total contents;
- user-prefix isolation;
- download body and metadata;
- deletion and missing-object behavior;
- isolated storage between tests.

Do not add `kvNamespaces` or `CompiledWasm` module rules until KV or Wasm-backed code exists. The
Workers Rate Limiting binding is not simulated locally; tests of rate-limit decisions must inject a
typed binding stub at the narrow boundary rather than pretending Miniflare provides production rate
limiting.

Add `test:workers` scripts to `apps/web` and the repository root. Include the worker lane in the main
quality gate so `.worker.test.ts` files cannot silently drift.

## Documentation updates

- Keep the existing overview structure and route links for every Core lab.
- Update descriptions only where the implementation boundary changes.
- Document query-key factories, response error propagation, repository injection, and workerd tests
  where they are part of the lesson.
- Update `README.md` and `AGENTS.md` command and architecture references for the worker test lane and
  corrected service behavior.
- Do not document unimplemented KV, Argon2, Wasm, or rate-limit emulation.

## Testing and validation

### Focused automated tests

- Unit-test query-key factories, response parsing, and formatters.
- Unit-test note and file service success and missing-resource behavior with repository fakes.
- Add Storybook coverage for new primitives and representative light/dark states.
- Update E2E deletion workflows to confirm destructive actions.
- Add focused browser assertions for invalid-field focus, dialog keyboard behavior, accessible names,
  status regions, responsive stacking, and preserved URL state.
- Run the R2 repository test inside workerd through the separate worker config.

### Repository gates

Run and fix attributable failures from:

```bash
graphify update .
pnpm format
pnpm lint:workflows
pnpm lint
pnpm deps:check
pnpm deps:unused
pnpm check-types
pnpm test
pnpm test:workers
pnpm test:e2e
pnpm build-storybook
pnpm build
```

The generated graph remains tool-owned and must not be edited manually.

Perform representative visual checks in light and dark themes at mobile, tablet, and desktop widths.
Record any unrelated pre-existing failure separately rather than weakening a gate.

## Intentionally retained differences

- Table pages use a wider shell because data density requires it.
- File uploads use a roomier shell because attachment actions need more horizontal space.
- Loading skeleton geometry remains domain-specific even though its semantic wrapper is shared.
- Search-specific and no-data empty-state copy remains in each module.
- Notes use PostgreSQL and files use R2; repository interfaces align their boundary without hiding the
  storage models behind a generic repository.
- Query mutations remain non-optimistic because correctness and educational clarity outweigh the
  small perceived-latency benefit for these demos.

## Success criteria

- No Core module recreates a shared control or application-wide async-state presentation.
- Similar pages, forms, lists, tables, and destructive actions share structure and behavior.
- Every unsuccessful typed client response becomes a query or mutation error.
- Unknown server failures cannot be mislabeled as missing resources.
- Worker-specific R2 behavior is exercised inside workerd and excluded from the default Node suite.
- Light, dark, mobile, tablet, and desktop checks pass for representative Core flows.
- Formatting, linting, dependency checks, types, unit tests, worker tests, E2E tests, Storybook, and
  the production build pass.
