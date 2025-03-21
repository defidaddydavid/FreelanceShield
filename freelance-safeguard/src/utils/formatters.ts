/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a number as a currency with the specified currency symbol
 * @param value The value to format
 * @param currency The currency symbol or code to use
 * @param decimals The number of decimal places to show
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'SOL', decimals: number = 4): string {
  if (value === null || value === undefined) {
    return `-.-- ${currency}`;
  }
  
  // Format the number with the specified number of decimal places
  const formattedValue = value.toFixed(decimals);
  
  // Add thousand separators if needed
  const parts = formattedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${parts.join('.')} ${currency}`;
}

/**
 * Shorten a wallet address or other long string for display
 * @param address The full address or string to shorten
 * @param prefixLength Number of characters to keep at the beginning
 * @param suffixLength Number of characters to keep at the end
 * @returns Shortened address with ellipsis in the middle
 */
export function shortenAddress(address: string, prefixLength: number = 4, suffixLength: number = 4): string {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}

/**
 * Format a date to a human-readable string
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format a number as a percentage
 * @param value The value to format (0.1 = 10%)
 * @param decimals The number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (value === null || value === undefined) return '-.--';
  
  // Convert to percentage and format
  const percentage = value * 100;
  return `${percentage.toFixed(decimals)}%`;
}
