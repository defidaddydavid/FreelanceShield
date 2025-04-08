import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { applyThemeClass, getCurrentTheme } from '@/utils/theme-utils';

// Define theme types
type SolanaTheme = 'light' | 'dark';

// Create context with default values
interface SolanaThemeContextType {
  theme: SolanaTheme;
  setTheme: (theme: SolanaTheme) => void;
  isDark: boolean;
  toggleTheme: () => void;
  themeReady: boolean;
  // Add Solana UI specific theme utilities
  getSolanaColor: (lightColor: string, darkColor: string) => string;
  getPrimaryColor: () => string;
}

const SolanaThemeContext = createContext<SolanaThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDark: true,
  toggleTheme: () => {},
  themeReady: false,
  getSolanaColor: () => '',
  getPrimaryColor: () => '',
});

// Hook to use the Solana theme context
export const useSolanaTheme = () => useContext(SolanaThemeContext);

interface Props {
  children: ReactNode;
}

export const SolanaThemeProvider: FC<Props> = ({ children }) => {
  // Use the theme system (next-themes)
  const { setTheme: setNextTheme } = useTheme();
  const [theme, setThemeState] = useState<SolanaTheme>('dark');
  const [isDark, setIsDark] = useState(true); // Default to dark mode
  const [themeReady, setThemeReady] = useState(false);
  
  // Handle SSR by waiting for theme to be available
  useEffect(() => {
    // Only set themeReady in browser environment to avoid SSR issues
    if (typeof window !== 'undefined') {
      // Initialize theme
      const currentTheme = getCurrentTheme();
      setThemeState(currentTheme);
      setIsDark(currentTheme === 'dark');
      setNextTheme(currentTheme);
      setThemeReady(true);
    }
  }, [setNextTheme]);
  
  // Function to set theme with localStorage persistence
  const setTheme = (newTheme: SolanaTheme) => {
    setThemeState(newTheme);
    setNextTheme(newTheme);
    applyThemeClass(newTheme);
    
    // Apply the theme immediately to avoid flicker
    setIsDark(newTheme === 'dark');
  };
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Get color based on current theme
  const getSolanaColor = (lightColor: string, darkColor: string) => {
    // If we want to use shield-purple as our primary accent color,
    // we can still provide this utility for cases where we need different colors
    return isDark ? darkColor : lightColor;
  };
  
  // Get primary brand color - consistently returns purple for brand elements
  const getPrimaryColor = () => {
    return 'text-shield-purple';
  };
  
  return (
    <SolanaThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        isDark, 
        toggleTheme, 
        themeReady,
        getSolanaColor,
        getPrimaryColor
      }}
    >
      {children}
    </SolanaThemeContext.Provider>
  );
};
