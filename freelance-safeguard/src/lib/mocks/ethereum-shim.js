/**
 * Ethereum Blocking Shim for FreelanceShield
 * 
 * This module blocks Ethereum-related functionality while ensuring
 * Solana connections work properly. It's specifically designed to 
 * prevent EVM ask/inpage integration while maintaining Solana support.
 */

// Block window.ethereum property definition
if (typeof window !== 'undefined') {
  // Create a getter that returns null for all ethereum-related properties
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    get: function() {
      console.warn('FreelanceShield: Ethereum access blocked as this is a Solana-only application');
      return null;
    }
  });
  
  // Also block web3 property
  Object.defineProperty(window, 'web3', {
    configurable: true,
    get: function() {
      console.warn('FreelanceShield: Web3 access blocked as this is a Solana-only application');
      return null;
    }
  });
}

// Export empty values for any imports
export const ethereum = null;
export const web3 = null;

// Export a dummy provider function
export const getDefaultProvider = () => {
  console.warn('FreelanceShield: Ethereum provider requested but not available');
  return null;
};

// Log that the shim is active
console.info('FreelanceShield: Ethereum blocking shim active - using real Solana connections only');

export default null;
