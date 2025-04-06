import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 24, 
  withText = false,
  textSize = "text-lg"
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light mode logo */}
      <img 
        src="/logo.png" 
        alt="FreelanceShield Logo"
        width={size}
        height={size}
        className="object-contain dark:hidden"
      />
      
      {/* Dark mode logo */}
      <img 
        src="/logo dark.png" 
        alt="FreelanceShield Logo"
        width={size}
        height={size}
        className="object-contain hidden dark:block"
      />
      
      {withText && (
        <span className={`ml-2 font-['NT_Brick_Sans'] ${textSize} tracking-wide text-gray-800 dark:text-gray-200`}>
          FreelanceShield
        </span>
      )}
    </div>
  );
};

export default Logo;
