import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border-2 border-bigg-neon-green/20 bg-bigg-dark backdrop-blur-sm px-4 py-3 text-base text-white shadow-lg transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 placeholder:font-medium focus-visible:outline-none focus-visible:border-bigg-neon-green focus-visible:ring-2 focus-visible:ring-bigg-neon-green/50 focus-visible:shadow-bigg-glow-green hover:border-bigg-neon-green/40 hover:bg-bigg-dark-lighter disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bigg-dark/50 md:text-sm font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
