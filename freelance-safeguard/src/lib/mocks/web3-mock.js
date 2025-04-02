/**
 * Empty Web3 mock module
 * 
 * This module provides null exports for Web3 functionality
 * without interfering with browser extensions or wallet providers.
 */

// Simple null export that can be safely imported
export default null;

// Safe exports for any imports
export const Web3 = null;
export const web3 = null;
export const ethereum = null;

// Log that we're using the Solana-only mode
console.info('FreelanceShield: Web3 mock active (Solana-only mode)');
