/**
 * Polyfills for FreelanceShield
 * 
 * This file provides necessary polyfills for Solana blockchain compatibility
 * without interfering with existing browser extensions.
 */

import { Buffer } from 'buffer';
import { TextEncoder, TextDecoder } from 'util';

// Safely setup global Buffer for Solana transactions
if (typeof window !== 'undefined') {
  // Add Buffer to window with proper type safety
  window.Buffer = window.Buffer || Buffer;
  
  // Set global for node polyfills
  window.global = window;
  
  // Process polyfill with environment variables required for Solana
  if (!window.process) {
    window.process = {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        MOCK_DATA: 'false', // Ensure real blockchain data is used
      },
      browser: true,
      version: '',
      nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0)
    } as any;
  }
}

// Initialize TextEncoder/TextDecoder polyfills if needed
if (typeof window.TextEncoder === 'undefined') {
  window.TextEncoder = TextEncoder;
}

if (typeof window.TextDecoder === 'undefined') {
  window.TextDecoder = TextDecoder;
}

// Override crypto polyfill for Solana
if (typeof window.crypto === 'undefined') {
  // @ts-ignore - Use secure random if available
  window.crypto = {
    getRandomValues: function(array: Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
}

console.info('FreelanceShield: Polyfills initialized for Solana blockchain compatibility');

// Export nothing - this file is imported for its side effects only
export {};
