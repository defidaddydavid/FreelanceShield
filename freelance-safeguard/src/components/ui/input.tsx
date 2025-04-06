import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-shield-purple/30 bg-white px-3 py-2 text-sm",
          "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shield-purple",
          "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-shield-blue/30 dark:bg-gray-900 dark:ring-offset-gray-900 dark:placeholder:text-gray-400",
          "dark:focus-visible:ring-shield-blue",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
)
Input.displayName = "Input"

export { Input }
