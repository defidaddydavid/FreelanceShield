import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  darkMode?: boolean;
}

export const FreelanceShieldLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  withText = true,
  darkMode = true,
}) => {
  // Size mapping
  const sizeMap = {
    sm: { logo: 24, text: 'text-sm' },
    md: { logo: 32, text: 'text-base' },
    lg: { logo: 48, text: 'text-lg' },
    xl: { logo: 64, text: 'text-xl' },
  };

  const { logo: logoSize, text: textSize } = sizeMap[size];
  
  // Colors based on dark mode
  const logoColor = darkMode ? '#5e35b1' : '#5e35b1'; // Deep purple in both modes
  const textColor = darkMode ? '#bdbdbd' : '#2A2A2A'; // Silver in dark mode, dark gray in light mode

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield logo based on the provided image */}
        <path
          d="M120 30C89.5 45.5 59 53 30 53v77c0 42.5 33.8 70.7 90 110 56.2-39.3 90-67.5 90-110V53c-29 0-59.5-7.5-90-23z"
          stroke={logoColor}
          strokeWidth="12"
          fill="none"
        />
        <path
          d="M120 60c-15 10-30 15-45 15v38.5c0 21.25 16.9 35.35 45 55 28.1-19.65 45-33.75 45-55V75c-15 0-30-5-45-15z"
          stroke={logoColor}
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M120 90c-7.5 5-15 7.5-22.5 7.5v19.25c0 10.625 8.45 17.675 22.5 27.5 14.05-9.825 22.5-16.875 22.5-27.5V97.5c-7.5 0-15-2.5-22.5-7.5z"
          stroke={logoColor}
          strokeWidth="6"
          fill="none"
        />
      </svg>
      
      {withText && (
        <span 
          className={`font-mono ${textSize} tracking-wide`}
          style={{ color: textColor }}
        >
          FreelanceShield
        </span>
      )}
    </div>
  );
};

export default FreelanceShieldLogo;
