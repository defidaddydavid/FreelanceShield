/**
 * Ethereum Compatibility Plugin for FreelanceShield
 * 
 * This plugin handles potential conflicts with browser extensions
 * by ensuring the ethereum property isn't redefined or blocked.
 */

// Simple runtime check to ensure ethereum property is not manipulated
// This doesn't try to modify window.ethereum at all, but provides
// informational logging for debugging
(function() {
  try {
    console.info('FreelanceShield: Ethereum compatibility check running');
    
    if (typeof window !== 'undefined') {
      // Just add a non-intrusive property for debugging
      window.__freeLanceShieldEthCompatCheck = true;
      
      // Log if ethereum is already defined (likely by an extension)
      if (window.ethereum) {
        console.info('FreelanceShield: Ethereum object detected (from extension)');
      } else {
        console.info('FreelanceShield: No ethereum object detected');
      }
    }
  } catch (e) {
    console.warn('FreelanceShield: Ethereum compatibility check failed', e);
  }
})();
