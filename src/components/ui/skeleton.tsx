import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-bigg-dark/50 via-bigg-neon-green/10 to-bigg-dark/50 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

// Enhanced table skeleton for admin interface
function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Table header skeleton */}
      <div className="grid grid-cols-6 gap-4 p-4 border-b border-bigg-neon-green/10">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="grid grid-cols-6 gap-4 p-4 hover:bg-bigg-neon-green/5">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

// Card skeleton for dashboard stats
function CardSkeleton() {
  return (
    <div className="border border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// List skeleton for recent items
function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bigg-neon-green/5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-3 w-full max-w-sm" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, TableSkeleton, CardSkeleton, ListSkeleton }