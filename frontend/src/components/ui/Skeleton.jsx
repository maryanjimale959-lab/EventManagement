/** Grey placeholder shapes shown while content loads. */
export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EventCardSkeleton() {
  return (
    <div className="event-card" aria-hidden="true">
      <Skeleton className="aspect-[16/10] !rounded-none" />
      <div className="flex gap-3.5 p-4">
        <Skeleton className="h-12 w-12 shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
    </div>
  );
}
