// src/polyfills.ts
import { Buffer } from 'buffer';

// Add type declarations for global objects
declare global {
  interface Window {
    _ethereumRef?: any;
    ethereum?: any;
    process?: any;
    Buffer: typeof Buffer;
  }
}

// Polyfill Buffer
window.Buffer = Buffer;

// Polyfill process with minimal required properties
window.process = {
  env: {},
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0),
  // Add other essential properties as needed
};

// Handle ethereum object more safely
// Instead of trying to redefine the ethereum property, we'll just store a reference
// without modifying the window object
if (window.ethereum) {
  try {
    // Store a reference without modifying the property
    const ethereumRef = window.ethereum;
    
    // Create a safer way to access ethereum if needed
    window._ethereumRef = ethereumRef;
    
    // Don't delete or redefine window.ethereum as it causes conflicts
    // with other wallet providers
  } catch (error) {
    console.warn('Failed to handle ethereum object:', error);
  }
}
