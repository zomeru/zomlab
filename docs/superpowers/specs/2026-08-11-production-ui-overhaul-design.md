# Production UI and design-system overhaul

## Goal

Turn ZomLab into a cohesive, production-grade engineering workspace and interactive
documentation product while preserving its current architecture, application behavior, and
technical identity. The result should be elegant, understated, responsive, accessible, and
recognizably ZomLab rather than an unmodified shadcn/ui installation.

## Approved direction

Use the approved **Engineering workbench** direction: an inset, tool-like application shell
with calm neutral surfaces, precise hierarchy, compact technical typography, and restrained
slate-blue accents. Documentation remains content-led and editorial; interactive demos remain
first-class application surfaces. Avoid dashboard-style metric grids, marketing-page scale,
excess decoration, gradients, glassmorphism, and ornamental animation.

The existing sidebar information architecture and interaction model must remain recognizable.
Sections such as Core remain grouped, CRUD remains a nested group with Overview and Demo children,
active routes expand their ancestors, and planned entries remain labeled. Responsive work changes
the presentation of this model, not its hierarchy or source of truth.

## Repository evidence

- `apps/web` owns the TanStack Start shell, navigation data, theme toggle, global search, MDX
  mapping, Mermaid rendering, authentication composition, and the Core CRUD domain UI.
- `packages/ui` contains only three create-turbo-style sample components and basic Storybook
  configuration. The web application does not currently consume it.
- `apps/web/src/routes/__root.tsx` duplicates footer composition, embeds the desktop-only sidebar,
  and hides navigation below the `md` breakpoint.
- `apps/web/src/styles/globals.css` already uses Tailwind CSS v4, OKLCH variables, and semantic
  theme utilities, providing a sound migration base.
- Inputs, buttons, cards, errors, empty states, layout widths, and focus styles are repeated across
  auth, notes, navigation, and route components.
- MDX styling is centralized but limited; Mermaid uses component-local theme values and needs more
  robust responsive, loading, error, and theme-change behavior.
- Storybook 10 is configured for `packages/ui`, but its stories demonstrate boilerplate rather than
  a reusable design language.
- Existing Playwright coverage includes sidebar navigation and representative application routes.

## Current documentation decisions

Current shadcn/ui guidance supports a shared UI package in a monorepo, Tailwind CSS v4 semantic
variables mapped with `@theme inline`, package-local `components.json` aliases, and a Sidebar that
uses a desktop collapsible presentation and automatic mobile Sheet behavior. ZomLab will adopt
these patterns selectively and own the resulting source.

Current Storybook guidance supports React with Vite, global decorators and toolbar globals,
autodocs for reusable components, MDX documentation pages, viewport presets, and accessibility
checks. Storybook dependencies and configuration must remain development-only and must not enter
the application bundle.

## Architecture and ownership

### `packages/ui`

`packages/ui` becomes the canonical source for reusable visual primitives and shared design
patterns. Its public units must be independently understandable through explicit package exports.
It owns:

- semantic design tokens and Tailwind theme mappings;
- the design-system stylesheet consumed by the app and Storybook;
- class composition and variant helpers;
- accessible primitive components copied from or inspired by shadcn/ui;
- reusable layout, feedback, data-display, navigation, and documentation patterns;
- shared hooks required exclusively by those primitives, such as responsive sidebar state;
- Storybook stories and foundational design-system documentation.

It does not own:

- TanStack Router route definitions or route-aware navigation data;
- authentication, session, API, Hono, database, or notes-domain logic;
- application copy or route-specific page composition;
- raw shadcn files without a demonstrated consumer or design-system purpose.

Use a focused source structure rather than creating every possible category in advance:

```text
packages/ui/src/
  components/
    primitives/
    layout/
    navigation/
    feedback/
    docs/
  hooks/
  lib/
  styles/
  stories/
  index.ts
```

The exact directories may be reduced if a category would contain only one incidental file.

### `apps/web`

`apps/web` consumes `@zomlab/ui` and owns product composition. It retains:

- the root document and TanStack Start integration;
- `NAV`, active-route calculations, safe redirects, and search indexing;
- the application header, sidebar content, footer content, and route-specific page assemblies;
- auth and notes components where their behavior is domain-specific;
- MDX component registration and Mermaid invocation where they depend on application state.

Repeated raw controls and class strings move incrementally to shared components. Business
components remain in the app even when they are restyled with design-system primitives.

### Stylesheet and theme interface

`packages/ui` exports a token stylesheet that contains semantic CSS variables, the `.dark` token
overrides, `@theme inline` mappings, and shared base/component layers. It does not import Tailwind
itself. `apps/web/src/styles/globals.css` remains the application's single CSS entry point: it
imports Tailwind once, registers `packages/ui/src` as a Tailwind source, imports the shared token
stylesheet, and then defines app-only MDX or route rules. Storybook uses its own preview stylesheet
that imports Tailwind once, scans `packages/ui/src`, and imports the same shared token stylesheet.

The app and Storybook both apply resolved theme state to the root element with exactly one `.light`
or `.dark` class. Components consume semantic utilities only; they do not own a parallel theme
provider or duplicate token values.

## Design foundations

### Color

Use an OKLCH-based semantic token system with equivalent intent in light and dark themes:

- canvas: `background`, `foreground`;
- surfaces: `card`, `popover`, `surface-muted`, `surface-elevated`;
- structure: `border`, `border-subtle`, `border-strong`, `input`, `ring`;
- actions: `primary`, `secondary`, `accent`, and their foreground pairs;
- feedback: `destructive`, `success`, `warning`, `info`, with foreground and subtle-surface pairs;
- navigation: the shadcn-compatible sidebar token family.

Use a mostly neutral palette with a restrained slate-blue technical accent. Accent color signals
interaction, selection, focus, and limited emphasis; it does not decorate large regions. Verify
text, icons, focus indicators, and control boundaries against the applicable WCAG contrast
requirements in both themes and forced-colors mode.

### Typography

Use one intentionally selected UI/body sans and one highly legible monospace face. Prefer a
self-hosted or system-resilient loading strategy that avoids layout shift and preserves readable
fallbacks. Define roles for page title, page description, section heading, subsection heading,
body, label, metadata, caption, inline code, and code block text.

Documentation typography remains compact enough for technical material. Default prose targets a
65–75 character line, uses a comfortable body line height, and avoids marketing-scale headings.
Code keeps clear differentiation without reducing legibility.

### Spacing, geometry, elevation, and motion

- Use a 4px base rhythm with named container gutters and section gaps.
- Derive a compact radius scale around 6–12px from one base token.
- Use borders for structure and layered, subtle shadows only for true elevation.
- Keep desktop controls approximately 40px high when density permits and provide at least WCAG's
  minimum target size, aiming for 44px touch targets on mobile.
- Use short, interruptible CSS transitions for state changes.
- Avoid a JavaScript animation dependency. Reduced motion replaces movement with opacity or removes
  nonessential transition effects.

## Shared component scope

The first implementation wave is mandatory and maps directly to current consumers:

| Shared unit | Current consumer boundary |
| --- | --- |
| Button, Input, Textarea, Label, Badge | auth, notes, search, header actions, and planned labels |
| Dropdown Menu | current custom profile/user menu |
| Collapsible, Sheet, and Sidebar family | current nested sidebar and its responsive presentation |
| Skeleton, Alert, and Empty State | profile loading, auth/notes failures, and notes empty state |
| Card, App Shell, Page Container, and Page Header | root shell, auth cards, notes, and route layouts |
| Callout, Code Container, Demo Panel, Diagram Container, Table Wrapper | MDX, terminal/source blocks, embedded demos, Mermaid, and documentation tables |

Helpers for class composition and semantic variants are also mandatory. Separator, Tooltip, and
other shadcn primitives are added only when integration reveals a current, named consumer; their
existence is not part of completion. Selects, dialogs, popovers, pagination, tabs, and other unused
catalog components remain out of scope.

Variants must encode product semantics rather than arbitrary visual permutations. Components use
native elements and accessible Radix/shadcn behavior where an interaction pattern requires focus
management, keyboard navigation, or dismissal behavior.

## Application shell and navigation

### Shared shell

Use an inset workbench shell with one consistent header, navigation region, content inset, and
footer. Establish shared dimensions for header height, sidebar widths, gutters, and content widths.
The footer becomes one composition rather than duplicate root and component implementations.

Page containers support at least:

- narrow documentation content;
- default content pages;
- wide demo and diagram pages.

Routes select an intentional container variant instead of repeating unrelated max-width values.

### Desktop

At `64rem`/1024 CSS pixels and above, render a persistent, scrollable 16rem sidebar. It is expanded
by default and can collapse fully off-canvas; the header retains a visible, keyboard-accessible
trigger. Do not implement an icon-only rail in this pass because the current text-led navigation has
no stable icon model. Persist desktop expanded/collapsed state in a `zomlab_sidebar` cookie and read
that cookie during server rendering so hydration does not change the initial content inset. The
content inset may transition only after a user-triggered state change. A keyboard shortcut is not a
completion requirement.

### Tablet

Below `64rem`, remove the persistent sidebar and use the overlay Sheet presentation. Do not retain a
compact rail. Tablet widths use the same navigation tree and focus behavior as mobile with a maximum
18rem Sheet width.

### Mobile

Render the complete existing navigation inside a full-height Sheet. The Sheet must:

- trap focus while open and restore focus to its trigger when closed;
- close with Escape, its close control, and an appropriate backdrop interaction;
- prevent background scroll and overscroll chaining;
- respect safe areas and remain independently scrollable;
- expose visible active state and expanded ancestors;
- preserve comfortable touch targets and avoid off-screen controls.

The Sheet width is `min(18rem, calc(100vw - 2rem))`. It closes after a navigation link is selected.
Mobile/overlay open state is transient and is never written to the desktop-state cookie. Active-route
ancestors always open when the navigation mounts. User-opened inactive sections remain open only
while that navigation instance is mounted; closing and reopening the Sheet re-derives disclosure
state from the active route rather than persisting arbitrary expansions.

All presentations use the same `NAV` data and active-state logic. There is no separately maintained
mobile menu tree.

## Theme behavior

Replace the hardcoded initial dark class and binary post-hydration toggle with an explicit
preference contract:

- accepted preferences are `light`, `dark`, and `system`;
- store the preference under the existing `theme` local-storage key;
- when no preference exists, default to `system`;
- a small inline head bootstrap resolves the stored preference and `prefers-color-scheme` before the
  first paint, then applies exactly one `.light` or `.dark` class and matching `color-scheme`;
- system preference listens for operating-system changes while selected;
- the accessible theme control exposes all three named options and indicates the selected option;
- theme changes update shared components, MDX, code surfaces, overlays, and Mermaid without reload;
- Storybook's theme toolbar sets an explicit light or dark class and does not persist app preference.

The bootstrap must be deterministic, covered by a non-React theme-resolution unit test, and verified
for no incorrect-theme flash or hydration warning in a production build.

## MDX and documentation UI

Map standard MDX elements to a unified documentation system: headings, paragraphs, links, lists,
blockquotes, tables, inline code, code blocks, horizontal rules, and images. Preserve semantic
heading order, add appropriate heading scroll margins, use descriptive link treatment, and constrain
prose width without constraining embedded demos.

Documentation patterns share consistent headers, section spacing, callouts, architecture regions,
live-demo containers, source containers, references, API examples, result panels, copy controls,
and table overflow behavior. Code and tables may scroll within their own region; the page itself
must not acquire horizontal overflow.

## Mermaid

Separate deterministic Mermaid configuration from the React rendering lifecycle. The configuration
helper maps semantic design tokens into light and dark Mermaid theme variables without hardcoding a
single-theme palette. The renderer must re-render when the resolved application theme changes and
must avoid race conditions or stale diagram output.

The shared Diagram Container provides consistent padding, border, label/action placement, loading
status, recoverable error presentation, and local horizontal overflow. Large diagrams remain usable
at narrow widths. Error copy identifies the failed diagram and preserves diagnostic detail without
breaking page layout.

## Storybook

Storybook becomes the design-system reference for developers. Remove boilerplate stories and add:

- foundation documentation for colors, typography, spacing, radii, elevation, and motion;
- meaningful stories for component variants and states actually used by ZomLab;
- light and dark theme controls implemented through a global decorator;
- representative desktop and mobile viewport presets;
- disabled, loading, destructive, empty, long-content, and responsive examples where relevant;
- accessibility checks for interactive primitives and composite navigation patterns.

Do not create stories for every private implementation detail. Prefer autodocs for clear primitives
and authored MDX pages where design rationale and composition guidance matter.

## Accessibility and UX writing

- Preserve one visible primary `main` landmark and the first-focusable skip link.
- Use native elements first and retain visible `focus-visible` indicators.
- Give icon-only controls accessible names and hide decorative icons from assistive technology.
- Follow expected keyboard behavior for menus, disclosures, sidebar navigation, and Sheets.
- Validate forms on submission, connect inline errors with `aria-describedby`, and focus the first
  invalid field where practical.
- Announce async status with stable polite live regions and urgent non-field errors with alerts.
- Do not communicate state through color alone.
- Support 200% zoom, 320px reflow, forced colors, and reduced motion.
- Use concise sentence-case interface copy, verb-first actions, descriptive links, and errors that
  state recovery steps. Empty states orient the reader and point to the next action.

## Loading, empty, error, and destructive states

Shared feedback patterns define consistent visual and semantic behavior while the app supplies
domain-specific copy and actions. Loading indicators retain the original action label where
possible. Errors appear near the failed operation and include a recovery path. Destructive actions
name the consequence and do not rely on color alone. Existing API behavior and error envelopes are
unchanged by this UI work.

## Performance

- Preserve server-renderable composition and add client boundaries only for real interaction state.
- Import primitives through explicit package exports so unused components remain tree-shakeable.
- Keep Storybook-only dependencies outside runtime dependencies and production imports.
- Prefer CSS transitions and avoid a general motion package.
- Choose font loading that minimizes flash and layout shift.
- Lazy-load or otherwise isolate Mermaid's cost where the existing route architecture permits.
- Avoid duplicate mobile and desktop navigation trees in the rendered DOM when hidden copies would
  create unnecessary work or accessibility ambiguity.

## Testing and browser verification

Do not add React component tests or visual snapshots. Add unit tests only for deterministic non-React
logic introduced by this work, such as class/variant helpers, Mermaid configuration, or theme
resolution utilities.

Update existing Playwright coverage for the responsive sidebar and other changed user flows. The
automated responsive matrix covers 375, 768, and 1280 CSS pixels in both explicit themes for the
shell/sidebar and at least one MDX/Mermaid route. Browser verification must cover representative
homepage, documentation, demo, auth/form, MDX, Mermaid, and authenticated routes when credentials
and an isolated database are available.

Perform and record a manual browser audit at 320, 375, 430, 768, 1024, 1280, and 1440+ pixel widths
in light and dark themes. Include:

- sidebar opening, closing, nesting, active state, focus trap, and focus restoration;
- keyboard-only traversal, visible focus, reduced motion, and 200% zoom;
- header, content, footer, forms, cards, tables, code, MDX, and Mermaid overflow;
- route transitions, hydration behavior, layout shifts, browser console errors, and warnings.

Build Storybook as an additional design-system gate. The final required commands are:

```bash
pnpm run check:all
pnpm run test:e2e
pnpm run build-storybook
pnpm run build
```

Run `graphify update .` after implementation changes, as required by repository policy.

## Final implementation report

The completion response records:

1. major UI and design-system changes;
2. the final `packages/ui` structure and components moved or adopted by `apps/web`;
3. responsive sidebar and mobile navigation behavior;
4. theme, color, and typography decisions;
5. MDX, Mermaid, and Storybook changes;
6. accessibility and performance decisions;
7. tests added or updated and the recorded manual browser matrix;
8. remaining technical debt or follow-up work;
9. the observed result of each required validation command.

Do not claim completion when a required command was not run or did not pass.

## Implementation sequence

1. Establish package exports, shared styling, utilities, and semantic tokens.
2. Add the minimum accessible primitives required by existing application components.
3. Build layout and sidebar primitives, then integrate the root shell without changing navigation
   data or routing behavior.
4. Refactor repeated application controls and surfaces while retaining domain ownership.
5. Apply shared page containers and documentation patterns.
6. Integrate MDX mappings and Mermaid configuration/container behavior.
7. Replace Storybook boilerplate with foundation and component documentation.
8. Complete responsive, accessibility, theme, performance, and browser audits.
9. Refresh Graphify output and run all validation gates.

Each step must leave existing tests usable and avoid a broad, unreviewable rewrite.

## Non-goals

- Do not rewrite TanStack Start routing, Hono APIs, authentication, database access, or notes logic.
- Do not change the public API contracts or error envelopes.
- Do not implement planned labs or replace the current navigation hierarchy.
- Do not add every shadcn component preemptively.
- Do not introduce React component tests or broad visual snapshot testing.
- Do not copy Noteside branding, exact layout, typography, or color choices.
- Do not add a JavaScript animation framework for decorative polish.
- Do not clean unrelated repository inconsistencies unless a touched file requires a focused fix.

## Completion criteria

The work is complete when the application presents one coherent engineering-workbench identity;
`packages/ui` is the reusable design-system boundary; the existing nested sidebar works across
desktop, tablet, and mobile; light and dark themes are polished; MDX and Mermaid belong visually to
the product; Storybook documents foundations and meaningful states; accessibility and performance
requirements are verified; and every required validation command passes without weakened checks.
