import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-bigg-dark/50 shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }