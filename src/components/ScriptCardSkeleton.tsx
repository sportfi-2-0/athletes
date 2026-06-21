import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder shown in the results grid while scripts are being generated,
 * so the layout fills in immediately instead of staying empty.
 */
export function ScriptCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-8 w-20 shrink-0" />
      </div>
      <div className="space-y-3 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
