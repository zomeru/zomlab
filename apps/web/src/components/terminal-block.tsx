"use client";

import { useState } from "react";

interface TerminalBlockProps {
  lines: { label: string; command?: string; value?: string }[];
}

export function TerminalBlock({ lines }: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const commands = lines
    .filter((line) => line.command)
    .map((line) => line.command)
    .join("\n");

  async function copyAll() {
    if (!commands) return;
    await navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-destructive/80" aria-hidden="true" />
          <span className="size-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="size-3 rounded-full bg-green-500/80" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="rounded-md px-2 py-1 font-mono text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm">
          {lines.map((line, i) => (
            <div key={`${line.label}-${i}`} className="flex items-start gap-3">
              {line.command ? (
                <>
                  <span className="select-none text-muted-foreground" aria-hidden="true">
                    $
                  </span>
                  <code className="text-foreground">{line.command}</code>
                  <span className="ml-auto text-muted-foreground/50">{line.label}</span>
                </>
              ) : (
                <>
                  <span className="select-none text-muted-foreground" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-muted-foreground">
                    {line.label}: {line.value}
                  </span>
                </>
              )}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
