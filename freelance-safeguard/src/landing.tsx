import React from 'react'
import ReactDOM from 'react-dom/client'
import { SolanaThemeProvider } from './contexts/SolanaThemeProvider'
import ComingSoonPage from './pages/ComingSoonPage'
import { Toaster } from 'sonner'
import './index.css'

// Landing-specific version that only loads the Coming Soon page
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolanaThemeProvider>
      {/* Use SolanaThemeProvider to maintain the retro-futuristic styling */}
      <ComingSoonPage />
      <Toaster position="top-right" />
    </SolanaThemeProvider>
  </React.StrictMode>,
)
