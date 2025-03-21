
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

const GlassCard = ({ 
  hoverEffect = true, 
  className, 
  children, 
  ...props 
}: GlassCardProps) => {
  return (
    <div 
      className={cn(
        'glass-effect rounded-2xl',
        hoverEffect && 'transition-all duration-300 hover:shadow-glass-hover transform hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
