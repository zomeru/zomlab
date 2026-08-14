import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState>
      <EmptyStateTitle>
        {query ? `No notes match “${query}”` : "No notes to search"}
      </EmptyStateTitle>
      <EmptyStateDescription>
        {query
          ? "Try a different search term or clear the filter to see all of your notes."
          : "Create a note above, then use the search field to filter it."}
      </EmptyStateDescription>
    </EmptyState>
  );
}
