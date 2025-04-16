import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chateau-green-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-chateau-green-600",
  {
    variants: {
      variant: {
        default: "bg-chateau-green-600 text-white hover:bg-chateau-green-700 dark:bg-chateau-green-600 dark:hover:bg-chateau-green-700",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600",
        outline:
          "border border-chateau-green-200 bg-white hover:bg-chateau-green-100 hover:text-chateau-green-900 dark:border-chateau-green-700 dark:bg-gray-950 dark:hover:bg-chateau-green-800 dark:hover:text-chateau-green-50",
        secondary:
          "bg-chateau-green-200 text-chateau-green-900 hover:bg-chateau-green-300 dark:bg-chateau-green-800 dark:text-chateau-green-50 dark:hover:bg-chateau-green-700",
        ghost:
          "hover:bg-chateau-green-100 hover:text-chateau-green-900 dark:hover:bg-chateau-green-800 dark:hover:text-chateau-green-50",
        link: "text-chateau-green-600 underline-offset-4 hover:underline dark:text-chateau-green-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
