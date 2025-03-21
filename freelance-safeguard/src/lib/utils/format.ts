// Format utilities for the application
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { USDC_MULTIPLIER } from '@/lib/solana/constants';

/**
 * Format a number as currency with 2 decimal places
 * @param value Number to format
 * @returns Formatted string with 2 decimal places
 */
export function formatCurrency(value: number | { toNumber: () => number }): string {
  // Handle BN-like (BigNumber) values from Solana
  const numValue = typeof value === 'number' ? value : 
                  value && typeof value.toNumber === 'function' ? value.toNumber() : 0;
  
  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a USDC amount from lamports to USDC
 * @param lamports Amount in USDC lamports (USDC * 10^6)
 * @returns Formatted USDC amount
 */
export function formatUSDC(lamports: number): string {
  return formatCurrency(lamports / USDC_MULTIPLIER);
}

/**
 * Convert USDC amount to lamports
 * @param usdc Amount in USDC
 * @returns Amount in lamports (USDC * 10^6)
 */
export function parseUSDC(usdc: number): number {
  return Math.floor(usdc * USDC_MULTIPLIER);
}

/**
 * Format a date to a readable string format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate time ago from a date
 * @param date Date to calculate from
 * @returns String representing time elapsed
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  
  return Math.floor(seconds) + " seconds ago";
}

/**
 * Format a percentage with specific decimal places
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return value.toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Truncate an address or other long string
 * @param str String to truncate
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Truncated string
 */
export function truncateString(str: string, startChars: number = 4, endChars: number = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;
  
  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}

/**
 * Format a SOL balance with appropriate units
 * @param lamports Amount in lamports
 * @returns Formatted SOL balance string
 */
export function formatSolBalance(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  
  if (sol < 0.001) {
    return `${(sol * 1000000).toFixed(0)} μSOL`;
  } else if (sol < 1) {
    return `${sol.toFixed(3)} SOL`;
  } else {
    return `${sol.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} SOL`;
  }
}
