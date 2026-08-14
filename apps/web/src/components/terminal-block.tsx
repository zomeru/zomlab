"use client";

import { CodeContainer } from "@zomlab/ui/components/docs";

interface TerminalBlockProps {
  lines: { label: string; command?: string; value?: string }[];
}

export function TerminalBlock({ lines }: TerminalBlockProps) {
  return (
    <CodeContainer className="mt-4" label="~/zomlab · bash">
      <div className="space-y-2 p-3">
        {lines.map((line) => (
          <div
            key={line.label}
            className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
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
    </CodeContainer>
  );
}
