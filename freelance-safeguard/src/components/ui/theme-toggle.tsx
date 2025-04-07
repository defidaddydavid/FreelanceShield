import { Moon, Sun } from "lucide-react";
import { useSolanaTheme } from "@/contexts/SolanaThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { isDark, setIsDark } = useSolanaTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "rounded-full transition-all",
            "bg-white dark:bg-gray-800",
            "hover:bg-shield-purple/10 dark:hover:bg-shield-blue/20",
            "border border-shield-purple/20 dark:border-shield-blue/20"
          )}
        >
          <Sun className={cn(
            "h-[1.2rem] w-[1.2rem] transition-all",
            "text-shield-purple rotate-0 scale-100",
            "dark:-rotate-90 dark:scale-0"
          )} />
          <Moon className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all",
            "text-shield-blue rotate-90 scale-0",
            "dark:rotate-0 dark:scale-100"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setIsDark(false)}
          className={cn(
            "cursor-pointer",
            !isDark && "bg-shield-purple/10 text-shield-purple font-medium"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setIsDark(true)}
          className={cn(
            "cursor-pointer",
            isDark && "bg-shield-blue/10 text-shield-blue font-medium dark:bg-shield-blue/20"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
