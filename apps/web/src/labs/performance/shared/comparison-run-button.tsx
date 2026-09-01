"use client";

import { Button } from "@zomlab/ui/components/button";
import { useEffect, useState } from "react";

export function ComparisonRunButton({
  className = "w-full sm:w-auto",
  onClick,
  pending,
  pendingLabel = "Running unoptimized, then optimized…",
}: {
  className?: string;
  onClick: () => void;
  pending: boolean;
  pendingLabel?: string;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  return (
    <Button className={className} disabled={!hydrated || pending} onClick={onClick} type="button">
      {pending ? pendingLabel : "Run comparison"}
    </Button>
  );
}
