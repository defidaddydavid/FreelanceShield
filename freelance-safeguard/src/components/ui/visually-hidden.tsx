import React from 'react';

/**
 * VisuallyHidden component for accessibility
 * Visually hides content but keeps it accessible to screen readers
 * 
 * @param props - Component props including children and any HTML div attributes
 * @returns VisuallyHidden component
 */
export function VisuallyHidden({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
      }}
    >
      {children}
    </div>
  );
}

export default VisuallyHidden;
