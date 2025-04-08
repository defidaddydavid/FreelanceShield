/**
 * Error handling utilities for FreelanceShield Solana integration
 * Provides standardized error handling, formatting, and recovery mechanisms
 */

// Common Solana error patterns to detect and handle
const WALLET_ERROR_PATTERNS = {
  WALLET_NOT_CONNECTED: ['wallet not connected', 'wallet disconnected', 'not connected'],
  WALLET_TIMEOUT: ['timeout', 'timed out'],
  USER_REJECTED: ['user rejected', 'rejected by user', 'rejected the request', 'declined'],
  INSUFFICIENT_FUNDS: ['insufficient', 'balance', '0 lamport', 'insufficient funds'],
  RPC_ERROR: ['rpc error', 'rpc connection', 'node', 'service unavailable'],
  INVALID_ADDRESS: ['invalid address', 'not a valid', 'invalid pubkey'],
  SIMULATION_FAILURE: ['simulation failed', 'transaction simulation'],
  ANCHOR_ERROR: ['anchor error', 'constraint', 'account discriminator'],
};

// Standardized error types for the application
export enum SolanaErrorType {
  WALLET_CONNECTION = 'wallet_connection',
  TRANSACTION = 'transaction',
  RPC = 'rpc',
  USER_ACTION = 'user_action',
  ACCOUNT = 'account',
  UNKNOWN = 'unknown',
}

// Format error messages to be user-friendly
export function formatSolanaErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  // Extract message from various error formats
  const errorMessage = error.message || error.msg || error.reason || error.toString();
  
  // Check for common error patterns and provide user-friendly messages
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.WALLET_NOT_CONNECTED)) {
    return 'Wallet is not connected. Please connect your wallet and try again.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.USER_REJECTED)) {
    return 'Transaction was rejected by the user.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.INSUFFICIENT_FUNDS)) {
    return 'Insufficient funds to complete this transaction. Please add more SOL to your wallet.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.RPC_ERROR)) {
    return 'Network connection error. Please check your internet connection or try again later.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.INVALID_ADDRESS)) {
    return 'Invalid wallet address provided.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.SIMULATION_FAILURE)) {
    return 'Transaction simulation failed. This may indicate an issue with the transaction parameters.';
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.ANCHOR_ERROR)) {
    // Attempt to extract more specific Anchor error message
    const anchorMatch = errorMessage.match(/custom program error: (.+?)(?:\s*\(0x|\))/i);
    if (anchorMatch && anchorMatch[1]) {
      return `Smart contract error: ${anchorMatch[1]}`;
    }
    return 'Smart contract error occurred.';
  }
  
  // If we can't identify the error, return a sanitized version of the error message
  // Limit length and remove any sensitive data or stack traces
  return truncateErrorMessage(errorMessage);
}

// Categorize error by type to help with error handling logic
export function getSolanaErrorType(error: any): SolanaErrorType {
  if (!error) return SolanaErrorType.UNKNOWN;
  
  const errorMessage = error.message || error.msg || error.reason || error.toString();
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.WALLET_NOT_CONNECTED)) {
    return SolanaErrorType.WALLET_CONNECTION;
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.USER_REJECTED)) {
    return SolanaErrorType.USER_ACTION;
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.RPC_ERROR)) {
    return SolanaErrorType.RPC;
  }
  
  if (matchesErrorPattern(errorMessage, [
    ...WALLET_ERROR_PATTERNS.INSUFFICIENT_FUNDS,
    ...WALLET_ERROR_PATTERNS.INVALID_ADDRESS,
    ...WALLET_ERROR_PATTERNS.SIMULATION_FAILURE
  ])) {
    return SolanaErrorType.TRANSACTION;
  }
  
  if (matchesErrorPattern(errorMessage, WALLET_ERROR_PATTERNS.ANCHOR_ERROR)) {
    return SolanaErrorType.ACCOUNT;
  }
  
  return SolanaErrorType.UNKNOWN;
}

// Check if an error message matches any of the provided patterns
function matchesErrorPattern(message: string, patterns: string[]): boolean {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase();
  return patterns.some(pattern => lowerMessage.includes(pattern));
}

// Truncate and sanitize error messages for display
function truncateErrorMessage(message: string): string {
  if (!message) return 'An unknown error occurred';
  
  // Convert objects or arrays to strings
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }
  
  // Remove any potential sensitive data (keys, signatures, etc.)
  message = message
    .replace(/0x[a-fA-F0-9]{8,}/g, '[REDACTED]')
    .replace(/([A-Za-z0-9+/=]{40,})/g, '[REDACTED]');
  
  // Truncate long error messages
  const MAX_LENGTH = 150;
  if (message.length > MAX_LENGTH) {
    return message.substring(0, MAX_LENGTH) + '...';
  }
  
  return message;
}

// Track errors for reporting
const errorCache = new Map<string, { count: number; lastOccurrence: Date }>();

// Log and track errors for monitoring
export function trackSolanaError(error: any, context: string = 'general'): void {
  const errorType = getSolanaErrorType(error);
  const errorMessage = formatSolanaErrorMessage(error);
  const errorKey = `${errorType}:${errorMessage}`;
  
  // Update error cache
  const existing = errorCache.get(errorKey);
  if (existing) {
    errorCache.set(errorKey, {
      count: existing.count + 1,
      lastOccurrence: new Date()
    });
  } else {
    errorCache.set(errorKey, {
      count: 1,
      lastOccurrence: new Date()
    });
  }
  
  // Log to console in a standardized format
  console.error(`[FreelanceShield] [${errorType}] [${context}] ${errorMessage}`, error);
}
