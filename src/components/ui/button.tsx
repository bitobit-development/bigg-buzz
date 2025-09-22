import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bigg-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:cursor-pointer active:cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden transform hover:transform-gpu active:transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-bigg-neon-green to-bigg-neon-green-bright text-white shadow-bigg-glow-green hover:shadow-bigg-glow-green-intense hover:scale-105 hover:brightness-110 active:scale-95 active:brightness-90 font-extrabold tracking-wide [&>*]:text-white transition-all duration-200 ease-out",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl",
        outline:
          "border-2 border-bigg-neon-green bg-transparent text-bigg-neon-green shadow-sm hover:bg-bigg-neon-green hover:text-white hover:shadow-bigg-glow-green hover:scale-105 active:scale-95 transition-all duration-200 ease-out hover:[&>*]:text-white",
        secondary:
          "bg-gradient-to-r from-bigg-dark to-bigg-dark-lighter text-white border border-bigg-neon-green/30 shadow-sm hover:from-bigg-dark-lighter hover:to-bigg-dark hover:border-bigg-neon-green/50 hover:shadow-bigg-glow-green transition-all duration-300 [&>*]:text-white",
        ghost:
          "bg-transparent text-white hover:bg-bigg-dark/50 hover:text-bigg-neon-green hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        link:
          "text-bigg-neon-green underline-offset-4 hover:underline hover:text-bigg-neon-green-bright transition-colors duration-300",
        chrome:
          "bg-gradient-to-r from-bigg-chrome to-bigg-chrome-light text-black shadow-lg hover:shadow-xl transform hover:scale-105 bigg-text-chrome border border-bigg-chrome/50",
        orange:
          "bg-gradient-to-r from-bigg-bee-orange to-bigg-bee-orange-bright text-white shadow-bigg-glow-orange hover:shadow-lg hover:scale-105 active:scale-95 font-extrabold [&>*]:text-white",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
