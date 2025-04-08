import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional maximum width constraint for the container
   * If not provided, the default max-w-7xl will be used
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full" | "none";
}

/**
 * Container component that provides consistent padding and max-width
 * Used for content layout across the application
 */
export function Container({
  className,
  maxWidth = "7xl",
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        maxWidth !== "none" && `max-w-${maxWidth}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
