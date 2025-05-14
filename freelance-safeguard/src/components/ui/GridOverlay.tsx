import React, { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

interface GridOverlayProps {
  children: React.ReactNode;
  className?: string;
  gridOpacity?: number;
  gridSize?: number;
}

/**
 * GridOverlay
 * 
 * A component that adds a grid pattern overlay to its children.
 * This is different from GridBackground as it doesn't replace the existing component.
 * 
 * @param children - Content to render inside the grid
 * @param className - Additional classes to apply to the container
 * @param gridOpacity - Grid line opacity (default: 0.1)
 * @param gridSize - Grid line density (default: 20)
 */
const GridOverlay = ({
  children,
  className,
  gridOpacity = 0.1,
  gridSize = 20
}: GridOverlayProps) => {
  const { isDark } = useSolanaTheme();
  
  return (
    <div className={cn("relative w-full h-full", className)}>
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none z-0",
          isDark ? "text-gray-700" : "text-gray-300"
        )}
        style={{ opacity: gridOpacity }}
      >
        {Array.from({ length: gridSize + 1 }).map((_, i) => (
          <Fragment key={`v-${i}`}>
            <div 
              className={cn(
                "absolute top-0 bottom-0 w-px",
                isDark ? "bg-gray-700" : "bg-gray-300"
              )} 
              style={{ left: `${(i / gridSize) * 100}%` }} 
            />
          </Fragment>
        ))}
        {Array.from({ length: gridSize + 1 }).map((_, i) => (
          <Fragment key={`h-${i}`}>
            <div 
              className={cn(
                "absolute left-0 right-0 h-px",
                isDark ? "bg-gray-700" : "bg-gray-300"
              )} 
              style={{ top: `${(i / gridSize) * 100}%` }} 
            />
          </Fragment>
        ))}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GridOverlay;
