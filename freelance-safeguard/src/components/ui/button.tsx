import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "",
  {
    variants: {},
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shield-purple",
          "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-shield-purple text-white hover:bg-shield-purple/90 dark:bg-shield-blue dark:hover:bg-shield-blue/90",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-700",
          variant === "outline" && "border border-shield-purple/30 bg-transparent hover:bg-shield-purple/10 text-shield-purple dark:border-shield-blue/30 dark:text-shield-blue dark:hover:bg-shield-blue/20",
          variant === "ghost" && "hover:bg-shield-purple/10 hover:text-shield-purple dark:hover:bg-shield-blue/20 dark:hover:text-shield-blue",
          variant === "link" && "text-shield-purple underline-offset-4 hover:underline dark:text-shield-blue",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
