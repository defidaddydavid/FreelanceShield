import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textSize?: string;
  onClick?: () => void;
  textColor?: string;
  textMargin?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 24, 
  withText = false,
  textSize = "text-lg",
  onClick,
  textColor = "text-shield-purple",
  textMargin = "ml-2"
}) => {
  return (
    <div 
      className={`flex items-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Use the purple logo consistently for both light and dark modes */}
      <img 
        src="/logo.png" 
        alt="FreelanceShield Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      
      {withText && (
        <span className={cn(
          `font-['NT_Brick_Sans'] ${textSize} tracking-wide`,
          textColor,
          textMargin
        )}>
          FreelanceShield
        </span>
      )}
    </div>
  );
};

export default Logo;
