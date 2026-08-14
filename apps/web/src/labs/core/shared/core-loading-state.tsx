import { cn } from "@zomlab/ui/lib/utils";
import type { ReactNode } from "react";

interface CoreLoadingStateProps {
  children: ReactNode;
  className?: string;
  label: string;
}

export function CoreLoadingState({ children, className, label }: CoreLoadingStateProps) {
  return (
    <div aria-label={label} className={cn(className)} role="status">
      {children}
    </div>
  );
}
