export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <p className="font-medium text-foreground">No notes yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Create your first note above.</p>
    </div>
  );
}
