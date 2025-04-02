/**
 * Polyfills for FreelanceShield
 * 
 * This file provides necessary polyfills for browser compatibility
 * without interfering with existing browser extensions.
 */

import { Buffer } from 'buffer';

// Safely setup global Buffer without touching window.ethereum
if (typeof window !== 'undefined') {
  // Add Buffer to window
  window.Buffer = window.Buffer || Buffer;
  
  // Set global for node polyfills
  window.global = window;
  
  // Safe process polyfill that doesn't interfere with extensions
  // Use 'as any' to bypass TypeScript type checking for the simplified process object
  if (!window.process) {
    window.process = { env: {} } as any;
  }
}

console.info('FreelanceShield: Polyfills initialized successfully');

// Export nothing - this file is imported for its side effects only
export {};
