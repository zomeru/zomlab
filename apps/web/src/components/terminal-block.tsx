"use client";

interface TerminalBlockProps {
  lines: { label: string; command?: string; value?: string }[];
}

export function TerminalBlock({ lines }: TerminalBlockProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted">
      <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">~/zomlab</span>
        <span aria-hidden="true" className="ml-auto font-mono text-xs text-muted-foreground">
          bash
        </span>
      </div>
      <div className="space-y-2 p-3">
        {lines.map((line) => (
          <div
            key={line.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <span className="hidden w-36 shrink-0 text-sm text-muted-foreground sm:block">
              {line.label}
            </span>
            <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-foreground">
              {line.command}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
