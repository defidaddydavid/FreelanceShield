import { cn } from "@/lib/utils";
import { useSolanaTheme } from "@/contexts/SolanaThemeProvider";

interface GridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  withTopAccent?: boolean;
  withBottomAccent?: boolean;
  density?: 'low' | 'medium' | 'high';
}

/**
 * GridBackground Component
 * 
 * A reusable component that provides the retro-futuristic grid background pattern.
 * It supports both dark and light modes and includes optional top/bottom accent lines.
 * 
 * @param className - Additional classes to apply to the container
 * @param children - Content to render inside the grid background
 * @param withTopAccent - Whether to show a purple accent line at the top
 * @param withBottomAccent - Whether to show a purple accent line at the bottom
 * @param density - Grid line density: 'low' (40px), 'medium' (28px), or 'high' (20px)
 */
export const GridBackground: React.FC<GridBackgroundProps> = ({
  className,
  children,
  withTopAccent = false,
  withBottomAccent = false,
  density = 'medium'
}) => {
  const { isDark } = useSolanaTheme();
  
  const gridSize = 
    density === 'low' ? '40px' :
    density === 'high' ? '20px' : '28px';
  
  return (
    <div className={cn(
      "relative overflow-hidden",
      className
    )}>
      {/* Background color */}
      <div className={cn(
        "absolute inset-0 z-0",
        isDark ? "bg-shield-purple/5" : "bg-shield-purple/3"
      )} />
      
      {/* Top accent line */}
      {withTopAccent && (
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 z-10",
          isDark 
            ? "bg-gradient-to-r from-shield-purple via-shield-purple/70 to-transparent" 
            : "bg-gradient-to-r from-shield-purple via-shield-purple/50 to-transparent"
        )} />
      )}
      
      {/* Bottom accent line */}
      {withBottomAccent && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px] z-10",
          isDark 
            ? "bg-gradient-to-r from-shield-purple/30 via-shield-purple/10 to-transparent" 
            : "bg-gradient-to-r from-shield-purple/20 via-shield-purple/5 to-transparent"
        )} />
      )}
      
      {/* Grid background */}
      <div className={cn(
        "absolute inset-0 z-0",
        isDark 
          ? "bg-[linear-gradient(to_right,#8878782d_1px,transparent_1px),linear-gradient(to_bottom,#8878782d_1px,transparent_1px)]" 
          : "bg-[linear-gradient(to_right,#8878781a_1px,transparent_1px),linear-gradient(to_bottom,#8878781a_1px,transparent_1px)]",
        `bg-[size:${gridSize}_${gridSize}]`
      )} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GridBackground;
