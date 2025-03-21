/**
 * Empty Web3 mock module
 * 
 * This mock prevents errors from Ethereum-related code that might be imported
 * while ensuring we're using real Solana connections exclusively.
 */

// Return empty/null values for Web3 or Ethereum interfaces if they're accidentally imported
export default null;

// Prevent window.ethereum injection
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ethereum', {
    value: null,
    writable: false,
    configurable: false
  });
}

// Ensure no Web3 functionality is available
export const Web3 = null;
export const eth = null;
export const utils = null;
export const providers = null;

// Make sure any imported module knows this is just a mock
console.warn('Web3 mock loaded - FreelanceShield uses Solana exclusively');
