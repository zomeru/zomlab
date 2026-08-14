"use client";

import { DiagramContainer } from "@zomlab/ui/components/docs";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { lazy, Suspense, useId } from "react";
import { type ArchitectureDiagramId, architectureDiagrams } from "./architecture-diagrams";

const ArchitectureDiagramCanvas = lazy(async () => {
  const module = await import("./architecture-diagram-canvas");
  return { default: module.ArchitectureDiagramCanvas };
});

interface ArchitectureDiagramProps {
  diagram: ArchitectureDiagramId;
}

export function ArchitectureDiagram({ diagram }: ArchitectureDiagramProps) {
  const definition = architectureDiagrams[diagram];
  const titleId = useId();
  const descriptionId = useId();

  return (
    <DiagramContainer
      data-slot="architecture-diagram"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <figcaption className="border-b border-border-subtle bg-surface-muted/55 px-4 py-3 sm:px-5">
        <span id={titleId} className="block text-sm font-semibold text-foreground">
          {definition.title}
        </span>
        <span id={descriptionId} className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {definition.description} Drag to pan; use the controls to zoom or fit.
        </span>
      </figcaption>
      <div className="h-[26rem] bg-[var(--diagram-background)] sm:h-[30rem]">
        <Suspense
          fallback={
            <Skeleton
              className="h-full rounded-none"
              aria-label={`Loading ${definition.title} architecture diagram`}
            />
          }
        >
          <ArchitectureDiagramCanvas definition={definition} />
        </Suspense>
      </div>
    </DiagramContainer>
  );
}
