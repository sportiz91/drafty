export default function DocumentsLoading() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row" aria-busy="true">
      <div className="h-24 w-full animate-pulse lg:h-72 lg:w-64 lg:shrink-0 rounded-[var(--radius-panel)] bg-surface" />
      <div className="h-72 flex-1 animate-pulse rounded-[var(--radius-card)] bg-surface" />
    </div>
  );
}
