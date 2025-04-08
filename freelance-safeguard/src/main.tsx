import './polyfills';
import './utils/ethereum-shim.js';

import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import global styles
import './index.css';

// Create error handler for Solana wallet errors
window.addEventListener('error', (event) => {
  // Handle null property access errors from wallet adapters
  if (event.error?.message?.includes('Cannot read properties of null') &&
      (event.filename?.includes('inpage.js') || 
       event.error.stack?.includes('wallet-adapter'))) {
    console.warn('Intercepted Solana wallet adapter error:', event.error.message);
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  
  // Handle Backpack wallet errors
  if (event.error?.message?.includes('BackpackWalletAdapter') ||
      event.error?.stack?.includes('BackpackWalletAdapter')) {
    console.debug('Ignoring missing BackpackWalletAdapter error');
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  
  // Handle BraveWalletAdapter errors
  if (event.error?.message?.includes('BraveWalletAdapter') ||
      event.error?.stack?.includes('BraveWalletAdapter')) {
    console.debug('Ignoring BraveWalletAdapter error');
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, { capture: true });

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Handle wallet adapter promise rejections
  if (event.reason?.message?.includes('wallet') ||
      event.reason?.message?.includes('adapter') ||
      event.reason?.stack?.includes('wallet-adapter')) {
    console.warn('Intercepted Solana wallet promise rejection:', event.reason.message);
    event.preventDefault();
    return true;
  }
  
  // Handle common RPC errors
  if (event.reason?.message?.includes('429 Too Many Requests') ||
      event.reason?.message?.includes('timeout')) {
    console.warn('Intercepted RPC error:', event.reason.message);
    event.preventDefault();
    return true;
  }
});

// AppWrapper component to handle delayed initialization
const AppWrapper = () => {
  const [initialized, setInitialized] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing Solana application...');
  
  useEffect(() => {
    // Delay wallet initialization to ensure DOM is fully loaded
    let loadingInterval: number;
    
    // Set up loading message animation
    if (!initialized) {
      let dots = 0;
      loadingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        setLoadingText(`Initializing Solana application${'.'.repeat(dots)}`);
      }, 500) as unknown as number;
    }
    
    // Delay wallet initialization to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 800);
    
    return () => {
      clearTimeout(timer);
      if (loadingInterval) clearInterval(loadingInterval);
    };
  }, [initialized]);
  
  if (!initialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white text-center">
          <div className="animate-pulse">
            {loadingText}
          </div>
        </div>
      </div>
    );
  }
  
  return <App />;
};

// Mount the application
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <AppWrapper />
    </StrictMode>
  );
}