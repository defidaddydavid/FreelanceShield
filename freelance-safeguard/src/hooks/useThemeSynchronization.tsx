import { useSolanaTheme } from "@/contexts/SolanaThemeProvider";
import { useEffect } from "react";

/**
 * Hook to synchronize theme with system preferences
 * Use this in your layout component to ensure theme consistency
 */
export function useThemeSynchronization() {
  const { isDark, setIsDark } = useSolanaTheme();
  
  useEffect(() => {
    // Check for system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Check for stored preference
    const storedTheme = localStorage.getItem("theme");
    
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setIsDark]);
  
  // Update DOM and localStorage when theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);
}
