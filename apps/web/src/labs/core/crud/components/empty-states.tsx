import {
  EmptyStateDescription,
  EmptyState as EmptyStatePrimitive,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";

export function EmptyState() {
  return (
    <EmptyStatePrimitive>
      <EmptyStateTitle>No notes yet</EmptyStateTitle>
      <EmptyStateDescription>
        Create your first note above to begin your private workspace.
      </EmptyStateDescription>
    </EmptyStatePrimitive>
  );
}
