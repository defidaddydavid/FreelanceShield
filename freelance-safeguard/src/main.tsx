// FreelanceShield uses Privy for Solana-only authentication
import './polyfills';

import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Block specific browser extension errors (like MetaMask/Phantom)
// This prevents the "Cannot read properties of null (reading 'type')" error
document.addEventListener('DOMContentLoaded', () => {
  // Create a global error handler for inpage.js errors
  window.addEventListener('error', (event) => {
    const errorMsg = event.error?.message || event.message;
    if (errorMsg && (
      errorMsg.includes("Cannot read properties of null (reading 'type')") ||
      errorMsg.includes('inpage.js')
    )) {
      console.log('Suppressed wallet extension error:', errorMsg);
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
});

// Create error handler for Solana wallet errors
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    if (
      error.message.includes('Wallet not ready') ||
      error.message.includes('wallet adapter') ||
      error.message.includes('Solana') ||
      error.message.includes('wallet disconnected')
    ) {
      console.log('Suppressing Solana wallet error:', error.message);
      event.preventDefault();
    }
  }
});

// Wrap the app with error boundaries and providers
const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate checking for wallet compatibility
    const checkWalletCompatibility = async () => {
      try {
        // Wait for DOM to be fully loaded
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error during wallet compatibility check:', error);
        setLoadError(error instanceof Error ? error : new Error('Unknown error during initialization'));
        setIsLoading(false);
      }
    };

    checkWalletCompatibility();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading FreelanceShield...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Initialization Error</h2>
          <p className="text-gray-300 mb-4">
            We encountered an error while loading FreelanceShield. This may be due to a browser
            compatibility issue.
          </p>
          <p className="text-gray-400 text-sm mb-4">Error: {loadError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <App />;
};

// Mount the application with error handling
try {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <AppWrapper />
      </StrictMode>
    );
  }
} catch (error) {
  console.error('Error rendering FreelanceShield application:', error);
  // Render a fallback UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: 'Open Sans', sans-serif; padding: 2rem; text-align: center;">
        <h1>FreelanceShield</h1>
        <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
          Refresh
        </button>
      </div>
    `;
  }
}