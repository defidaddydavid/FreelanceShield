import React from 'react';
import { NETWORK_CONFIG } from '@/lib/solana/constants';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useSolanaTheme } from '@/contexts/SolanaProviders';

export type NetworkStatus = 'connected' | 'disconnected' | 'error';

interface NetworkBadgeProps {
  status?: NetworkStatus;
  className?: string;
  showTooltip?: boolean;
}

/**
 * NetworkBadge Component
 * 
 * Displays the current Solana network (mainnet/devnet) with connection status
 * in a retro-futuristic style consistent with FreelanceShield's design system
 */
const NetworkBadge = ({ 
  status = 'disconnected', 
  className,
  showTooltip = true
}: NetworkBadgeProps) => {
  const { isDark } = useSolanaTheme();
  
  // Determine if we're on testnet based on endpoint or env var
  const isTestnet = NETWORK_CONFIG.endpoint.includes('devnet') || 
                    NETWORK_CONFIG.endpoint.includes('testnet') || 
                    import.meta.env.VITE_SOLANA_NETWORK !== 'mainnet-beta';
  
  // Network name for display
  const networkName = isTestnet ? 'DEVNET' : 'MAINNET';
  
  // Status icon and color config based on connection status
  const statusConfig = {
    connected: {
      icon: <Wifi className="h-3.5 w-3.5" />,
      color: 'text-green-500',
      borderColor: 'border-green-500/50',
      bgColor: 'bg-green-500/10',
      tooltipText: `Connected to Solana ${networkName}`,
    },
    disconnected: {
      icon: <WifiOff className="h-3.5 w-3.5" />,
      color: 'text-yellow-500',
      borderColor: 'border-yellow-500/50',
      bgColor: 'bg-yellow-500/10',
      tooltipText: `Not connected to ${networkName}`,
    },
    error: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      color: 'text-red-500',
      borderColor: 'border-red-500/50',
      bgColor: 'bg-red-500/10',
      tooltipText: `Connection error on ${networkName}`,
    },
  };

  const { icon, color, borderColor, bgColor, tooltipText } = statusConfig[status];

  // Retro-futuristic badge with neon glow effect
  const badge = (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono",
        "transition-all duration-300 cursor-default",
        bgColor,
        borderColor,
        color,
        // Active state glow effect
        status === 'connected' ? (
          isDark 
            ? "shadow-[0_0_8px_0px_rgba(34,197,94,0.3)]" 
            : "shadow-[0_0_5px_0px_rgba(34,197,94,0.2)]"
        ) : "",
        className
      )}
    >
      {icon}
      <span className="uppercase tracking-wider">{networkName}</span>
    </div>
  );

  // Wrap with tooltip if needed
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default NetworkBadge;
