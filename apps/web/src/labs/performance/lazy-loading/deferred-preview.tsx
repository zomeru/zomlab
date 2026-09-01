import { useEffect } from "react";

const CELLS = Array.from({ length: 600 }, (_, index) => ({
  id: `deferred-cell-${index}`,
  opacity: 0.25 + ((index * 17) % 70) / 100,
}));

export function DeferredPreview({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);

  return (
    <figure>
      <figcaption className="sr-only">Deferred analytics preview</figcaption>
      <div className="grid grid-cols-12 gap-1">
        {CELLS.map((cell) => (
          <span
            className="h-3 rounded-sm bg-primary/45"
            key={cell.id}
            style={{ opacity: cell.opacity }}
          />
        ))}
      </div>
    </figure>
  );
}
