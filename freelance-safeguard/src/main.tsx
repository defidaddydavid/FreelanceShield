import './polyfills';

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
}, { capture: true });

// Create error handler for BackpackWalletAdapter errors
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('BackpackWalletAdapter')) {
    console.debug('Ignoring missing BackpackWalletAdapter');
    event.preventDefault();
    return true;
  }
}, true);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Handle wallet adapter promise rejections
  if (event.reason?.message?.includes('wallet') ||
      event.reason?.message?.includes('adapter')) {
    console.warn('Intercepted Solana wallet promise rejection:', event.reason.message);
    event.preventDefault();
    return true;
  }
});

// AppWrapper component to handle delayed initialization
const AppWrapper = () => {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Delay wallet initialization to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!initialized) {
    return <div className="loading">Initializing Solana application...</div>;
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