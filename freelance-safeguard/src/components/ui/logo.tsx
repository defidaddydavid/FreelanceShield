import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stylized shield with blockchain nodes */}
      <path 
        d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" 
        className="fill-shield-blue dark:fill-blue-500"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path 
        d="M12 4L6 7v4c0 4.16 2.88 8.05 6 9 3.12-.95 6-4.84 6-9V7l-6-3z" 
        fill="white" 
        className="dark:fill-gray-800"
      />
      {/* Blockchain nodes */}
      <circle cx="9" cy="9" r="1.5" className="fill-shield-blue-light dark:fill-blue-400" />
      <circle cx="15" cy="9" r="1.5" className="fill-shield-blue-light dark:fill-blue-400" />
      <circle cx="12" cy="13" r="1.5" className="fill-shield-blue-light dark:fill-blue-400" />
      <circle cx="9" cy="17" r="1.5" className="fill-shield-blue-light dark:fill-blue-400" />
      <circle cx="15" cy="17" r="1.5" className="fill-shield-blue-light dark:fill-blue-400" />
      {/* Connection lines */}
      <line x1="9" y1="9" x2="12" y2="13" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
      <line x1="15" y1="9" x2="12" y2="13" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
      <line x1="12" y1="13" x2="9" y2="17" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
      <line x1="12" y1="13" x2="15" y2="17" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
      <line x1="9" y1="9" x2="15" y2="9" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
      <line x1="9" y1="17" x2="15" y2="17" stroke="#4D94FF" strokeWidth="0.75" className="dark:stroke-blue-400" />
    </svg>
  );
};

export default Logo;
