import React from 'react';
// Import PNG fallbacks since SVG imports are causing issues
import privyWordmarkWhite from '@/assets/wallets/Privy_Wordmark_White.png';
import privyWordmarkBlack from '@/assets/wallets/Privy_Wordmark_Black.png';

interface PrivyLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'white' | 'black'; // Monochrome usage
  type?: 'wordmark' | 'brandmark'; // Wordmark (text) or brandmark (icon)
}

const PrivyLogo: React.FC<PrivyLogoProps> = ({ 
  className = '', 
  width = 100, 
  height = 32,
  variant = 'white',
  type = 'wordmark',
}) => {
  // For now, we'll use the PNG wordmarks for both types
  // This is a temporary solution until SVG imports are fixed
  const logoSrc = variant === 'white' ? privyWordmarkWhite : privyWordmarkBlack;

  return (
    <img
      src={logoSrc}
      alt={type === 'brandmark' ? 'Privy Mark' : 'Privy'}
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain', display: 'inline-block' }}
    />
  );
};

export default PrivyLogo;
