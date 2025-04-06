/**
 * Solana Wallet Compatibility Helper for FreelanceShield
 * 
 * This module handles compatibility between web3 browser extensions
 * and our Solana wallet integration.
 */

(function() {
  try {
    console.info('FreelanceShield: Initializing Solana wallet compatibility');
    
    if (typeof window !== 'undefined') {
      // Set a flag to indicate we're running on Solana, not Ethereum
      window.__freeLanceShieldSolanaMode = true;
      
      // Non-intrusive detection of installed wallets
      if (window.phantom) {
        console.info('FreelanceShield: Phantom wallet detected');
      } 
      
      if (window.solflare) {
        console.info('FreelanceShield: Solflare wallet detected');
      }
      
      if (window.backpack) {
        console.info('FreelanceShield: Backpack wallet detected');
      }
    }
  } catch (e) {
    console.warn('FreelanceShield: Wallet compatibility initialization failed', e);
  }
})();
