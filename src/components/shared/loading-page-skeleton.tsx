import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type LoadingPageSkeletonProps = {
  className?: string | undefined
  showTable?: boolean | undefined
}

function LoadingPageSkeleton({
  className,
  showTable = true,
}: LoadingPageSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("space-y-6", className)}
    >
      <span className="sr-only">화면을 불러오는 중입니다.</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 bg-card p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {showTable ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { LoadingPageSkeleton }
export type { LoadingPageSkeletonProps }
