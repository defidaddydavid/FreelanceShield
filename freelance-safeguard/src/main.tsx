// Import compatibility script first
import './ethereum-compat.js';

// Import polyfills early
import './polyfills';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import global styles
import './index.css';

// Create a clean error handler
window.addEventListener('error', (event) => {
  // Prevent ethereum property errors from crashing the app
  if (event.error?.message?.includes('ethereum') || 
      event.error?.message?.includes('property') ||
      event.error?.message?.includes('redefine')) {
    console.warn('Intercepted property error:', event.error.message);
    event.preventDefault();
    event.stopPropagation();
  }
}, { capture: true });

// Mount the application
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
