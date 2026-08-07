"use client";

import { useEffect, useState } from "react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const { default: mermaid } = await import("mermaid");
        const dark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "default",
        });
        const { svg: rendered } = await mermaid.render(
          `mermaid-${Math.random().toString(36).slice(2)}`,
          chart,
        );
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    }

    void render();

    const observer = new MutationObserver(() => {
      if (!cancelled) void render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
        {chart}
        <span className="mt-2 block font-medium">Mermaid error: {error}</span>
      </pre>
    );
  }

  if (!svg) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading diagram…</div>;
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border border-border bg-card p-4"
      // Mermaid renders to sanitized SVG (securityLevel: "strict").
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required by Mermaid API
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
