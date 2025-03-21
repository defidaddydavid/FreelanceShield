import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './lib/solana/WalletProvider';
import './index.css';
import { Buffer } from 'buffer';

// Polyfill Buffer and process.env
window.Buffer = Buffer;
window.global = window;

// No attempt to modify ethereum property - simplify the approach
console.log('FreelanceShield - Solana Integration Mode');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
