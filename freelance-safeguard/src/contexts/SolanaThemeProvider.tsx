import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes'; // Assuming you're using next-themes for theme management

// Define theme types
type SolanaTheme = 'light' | 'dark' | 'system';

// Create context with default values
interface SolanaThemeContextType {
  theme: SolanaTheme;
  setTheme: (theme: SolanaTheme) => void;
  isDark: boolean;
  // Add Solana UI specific theme utilities
  getSolanaColor: (lightColor: string, darkColor: string) => string;
}

const SolanaThemeContext = createContext<SolanaThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
  getSolanaColor: () => '',
});

// Hook to use the Solana theme context
export const useSolanaTheme = () => useContext(SolanaThemeContext);

interface Props {
  children: ReactNode;
}

export const SolanaThemeProvider: FC<Props> = ({ children }) => {
  // Use your existing theme system (this example uses next-themes)
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  
  // Map your theme system to Solana theme
  const theme = (nextTheme as SolanaTheme) || 'system';
  
  // Update isDark state when theme changes
  useEffect(() => {
    setIsDark(resolvedTheme === 'dark');
  }, [resolvedTheme]);
  
  // Function to set theme that works with your existing theme system
  const setTheme = (newTheme: SolanaTheme) => {
    setNextTheme(newTheme);
  };
  
  // Utility function to get the right color based on current theme
  const getSolanaColor = (lightColor: string, darkColor: string): string => {
    return isDark ? darkColor : lightColor;
  };
  
  // Create the context value
  const contextValue: SolanaThemeContextType = {
    theme,
    setTheme,
    isDark,
    getSolanaColor,
  };
  
  return (
    <SolanaThemeContext.Provider value={contextValue}>
      {children}
    </SolanaThemeContext.Provider>
  );
};
