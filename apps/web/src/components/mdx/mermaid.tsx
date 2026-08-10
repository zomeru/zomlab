"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { DiagramContainer } from "@zomlab/ui/components/docs";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { createMermaidThemeVariables } from "@zomlab/ui/lib/mermaid-theme";
import { useEffect, useId, useRef, useState } from "react";

let mermaidRenderQueue = Promise.resolve();

function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const result = mermaidRenderQueue.then(task, task);
  mermaidRenderQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const id = useId().replaceAll(":", "");
  const renderGeneration = useRef(0);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const generation = ++renderGeneration.current;

      try {
        const styles = getComputedStyle(document.documentElement);
        const token = (name: string) => styles.getPropertyValue(name).trim();
        const themeVariables = createMermaidThemeVariables({
          background: token("--diagram-background"),
          border: token("--diagram-border"),
          foreground: token("--diagram-foreground"),
          muted: token("--diagram-muted"),
          mutedForeground: token("--diagram-muted-foreground"),
          primary: token("--diagram-primary"),
          primaryForeground: token("--diagram-primary-foreground"),
        });

        const rendered = await enqueueMermaidRender(async () => {
          const { default: mermaid } = await import("mermaid");
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            themeVariables,
          });
          return mermaid.render(`mermaid-${id}-${generation}`, chart);
        });

        if (!cancelled && generation === renderGeneration.current) {
          setError(null);
          setSvg(rendered.svg);
        }
      } catch (e) {
        if (!cancelled && generation === renderGeneration.current) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
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
  }, [chart, id]);

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <span className="font-medium">Diagram could not be rendered.</span>
        <span className="mt-1 block font-mono text-xs">{error}</span>
      </Alert>
    );
  }

  if (!svg) {
    return <Skeleton className="my-6 h-56" aria-label="Loading diagram" />;
  }

  return (
    <DiagramContainer
      aria-label="Architecture diagram"
      // Mermaid renders to sanitized SVG (securityLevel: "strict").
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required by Mermaid API
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
