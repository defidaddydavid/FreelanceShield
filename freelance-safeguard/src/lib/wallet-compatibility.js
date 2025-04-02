/**
 * Wallet Compatibility Module
 * 
 * This module handles compatibility between different wallet providers without
 * conflicting with browser extensions.
 */

// Export a safe reference to any wallet providers
export const safeProviders = {
  solana: {}
};

// Intentionally NOT touching window.ethereum at all
// Let browser extensions handle it completely

console.info('FreelanceShield: Wallet compatibility module loaded');

export default safeProviders;
