import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Design system/Foundations reference",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = [
  ["Canvas", "bg-background"],
  ["Card", "bg-card"],
  ["Muted surface", "bg-surface-muted"],
  ["Primary", "bg-primary"],
  ["Accent", "bg-accent"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Destructive", "bg-destructive"],
] as const;

export const Tokens: Story = {
  render: () => (
    <main className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-2xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-link">
          Engineering workbench
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Foundation tokens</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Semantic color, typography, geometry, elevation, and motion shared by ZomLab surfaces.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Color roles</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLORS.map(([label, color]) => (
            <div key={label} className="overflow-hidden rounded-xl shadow-surface">
              <div className={`h-20 ${color}`} />
              <p className="bg-card px-3 py-2 font-mono text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-6 shadow-surface">
          <h2 className="text-xl font-semibold">Typography</h2>
          <p className="mt-5 text-4xl font-semibold tracking-[-0.04em]">Page title</p>
          <p className="mt-3 max-w-[65ch] leading-7 text-muted-foreground">
            Inter carries dense technical prose with a calm rhythm and resilient system fallbacks.
          </p>
          <code className="mt-4 block font-mono text-sm">pnpm check:all</code>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-surface">
          <h2 className="text-xl font-semibold">Geometry and elevation</h2>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="size-16 rounded-md bg-surface-muted" />
            <div className="size-20 rounded-xl bg-surface-elevated shadow-surface" />
            <div className="size-24 rounded-2xl bg-popover shadow-overlay" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Borders provide structure; shadows are reserved for raised and overlay surfaces. Motion
            is short, interruptible, and removed when reduced motion is requested.
          </p>
        </div>
      </section>
    </main>
  ),
};
