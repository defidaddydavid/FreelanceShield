import React from 'react'
import ReactDOM from 'react-dom/client'
import { SolanaThemeProvider } from './contexts/SolanaThemeProvider'
import LandingPage from './pages/LandingPage'
import { Toaster } from 'sonner'
import './index.css'

// Create an error boundary component directly in the landing file
// This prevents the need to use App.tsx which has dependencies on wallet providers
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Landing page error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
          <div className="max-w-md w-full p-6 bg-gray-900 border border-[#9945FF]/50 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-[#9945FF]">Something went wrong</h2>
            <p className="mb-4">We're experiencing some technical difficulties. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#9945FF] text-white px-4 py-2 rounded hover:bg-[#8752F3]"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Landing-specific version that only loads the Landing page
// Using the simplified LandingPage component without wallet connections
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SolanaThemeProvider>
        <LandingPage />
        <Toaster position="top-right" />
      </SolanaThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
