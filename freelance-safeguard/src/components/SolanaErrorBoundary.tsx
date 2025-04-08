import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useSolanaTheme } from '@/contexts/SolanaProviders';
import { cn } from '@/lib/utils';
import { formatSolanaErrorMessage, getSolanaErrorType, SolanaErrorType } from '@/utils/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SolanaErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log the error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Solana Error Boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.resetError);
      }
      
      // If no fallback is provided, use the DefaultErrorFallback
      return <DefaultErrorFallback error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Default error fallback that uses the theme system
const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, resetError }) => {
  const { isDark } = useSolanaTheme();
  const formattedMessage = formatSolanaErrorMessage(error);
  const errorType = getSolanaErrorType(error);
  
  // Different styling based on error type
  const getErrorTypeClasses = () => {
    switch (errorType) {
      case SolanaErrorType.WALLET_CONNECTION:
        return isDark 
          ? 'border-amber-500/30 bg-amber-500/10' 
          : 'border-amber-500/20 bg-amber-50';
      case SolanaErrorType.USER_ACTION:
        return isDark 
          ? 'border-blue-500/30 bg-blue-500/10' 
          : 'border-blue-500/20 bg-blue-50';
      case SolanaErrorType.TRANSACTION:
        return isDark 
          ? 'border-red-500/30 bg-red-500/10' 
          : 'border-red-500/20 bg-red-50';
      default:
        return isDark 
          ? 'border-gray-600 bg-gray-800' 
          : 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-4 shadow-sm',
      getErrorTypeClasses()
    )}>
      <div className="flex flex-col space-y-3">
        <h3 className={cn(
          'text-lg font-heading font-bold',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          Something went wrong
        </h3>
        
        <p className={cn(
          'text-sm',
          isDark ? 'text-gray-300' : 'text-gray-600'
        )}>
          {formattedMessage}
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={resetError}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              isDark 
                ? 'bg-shield-blue text-white hover:bg-shield-blue/90' 
                : 'bg-shield-purple text-white hover:bg-shield-purple/90'
            )}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

// This wrapper is necessary to make the useSolanaTheme hook work in the fallback
export const SolanaErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <SolanaErrorBoundaryClass {...props} />;
};
