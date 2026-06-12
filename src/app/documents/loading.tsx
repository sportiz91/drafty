export default function DocumentsLoading() {
  return (
    <div className="flex gap-6" aria-busy="true">
      <div className="h-72 w-64 shrink-0 animate-pulse rounded-[var(--radius-panel)] bg-surface" />
      <div className="h-72 flex-1 animate-pulse rounded-[var(--radius-card)] bg-surface" />
    </div>
  );
}
