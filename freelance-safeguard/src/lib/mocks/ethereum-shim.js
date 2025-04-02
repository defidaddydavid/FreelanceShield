/**
 * Ethereum Compatibility Shim for FreelanceShield
 * 
 * This module provides a safe approach for Solana functionality
 * without interfering with browser extensions.
 */

// Export dummy values for imports, but don't touch window.ethereum
export const ethereum = null;
export const web3 = null;

// Export an empty provider interface
export const provider = {
  isConnected: false,
  networkVersion: null,
  selectedAddress: null,
  chainId: null
};

console.info('FreelanceShield: Running in Solana-only mode');

export default null;
