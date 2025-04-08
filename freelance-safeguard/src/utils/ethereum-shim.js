/**
 * Enhanced Solana Wallet Compatibility Helper for FreelanceShield
 * 
 * This module handles compatibility between web3 browser extensions
 * and Solana wallet integrations, reducing console errors and conflicts.
 */

(function() {
  try {
    console.info('FreelanceShield: Initializing enhanced Solana wallet compatibility');
    
    if (typeof window !== 'undefined') {
      // Set flag to indicate we're running on Solana, not Ethereum
      window.__freeLanceShieldSolanaMode = true;
      
      // Add proper type checking for all wallet provider access
      const safelyDetectWallet = (walletName, walletObj) => {
        try {
          if (walletObj && typeof walletObj === 'object') {
            console.info(`FreelanceShield: ${walletName} wallet detected`);
            return true;
          }
        } catch (e) {
          // Silent fail - don't log to avoid console clutter
        }
        return false;
      };
      
      // Detect installed wallets with proper error handling
      safelyDetectWallet('Phantom', window.phantom);
      safelyDetectWallet('Solflare', window.solflare);
      
      // Create dummy ethereum object for compatibility with existing libraries
      // that may expect window.ethereum to exist
      if (!window.ethereum) {
        window.ethereum = {
          // Non-functional placeholders that won't throw errors
          isMetaMask: false,
          _metamask: { isUnlocked: () => Promise.resolve(false) },
          request: async () => { 
            throw new Error('Ethereum methods not supported in Solana mode');
          },
          on: () => {},
          removeListener: () => {},
          autoRefreshOnNetworkChange: false,
          isConnected: () => false
        };
        
        console.info('FreelanceShield: Added Ethereum compatibility shim');
      }
    }
  } catch (e) {
    console.warn('FreelanceShield: Wallet compatibility initialization failed', e);
  }
})();
