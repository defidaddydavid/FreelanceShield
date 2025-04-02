import React, { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import wallet connection components
import { WalletConnectionProvider } from './utils/wallet-adapter';

// Import components
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';

// Import styles
import './styles/main.css';

/**
 * FreelanceShield main application component
 * Uses Phantom Wallet for authentication as per development guidelines
 */
const App: FC = () => {
  return (
    <BrowserRouter>
      <WalletConnectionProvider>
        <Routes>
          <Route path="/" element={<WalletConnect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </WalletConnectionProvider>
    </BrowserRouter>
  );
};

export default App;
