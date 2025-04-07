import { Moon, Sun } from "lucide-react";
import { useSolanaTheme } from "@/contexts/SolanaThemeProvider";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggleButton() {
  const { isDark, setIsDark } = useSolanaTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className={cn(
        "rounded-full w-10 h-10 transition-all shadow-sm",
        "bg-white dark:bg-gray-800",
        "border-shield-purple/20 dark:border-shield-blue/20",
        "hover:bg-shield-purple/10 dark:hover:bg-shield-blue/20",
        "focus:ring-2 focus:ring-shield-purple/30 dark:focus:ring-shield-blue/30"
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        "h-[1.2rem] w-[1.2rem] transition-all text-shield-blue",
        "rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
      )} />
      <Moon className={cn(
        "absolute h-[1.2rem] w-[1.2rem] transition-all text-shield-purple",
        "rotate-90 scale-0 dark:rotate-0 dark:scale-100"
      )} />
    </Button>
  );
}
