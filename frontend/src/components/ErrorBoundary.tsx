/**
 * Error Boundary component for the TSDNE application.
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ThemeType } from '../types';

interface Props {
  children: ReactNode;
  theme?: ThemeType;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log error to external service if needed
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    console.group('🚨 Error Boundary Report');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or the provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          theme={this.props.theme}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Error Fallback Component
// =============================================================================

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
  onReload: () => void;
  theme?: ThemeType;
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  onRetry, 
  onReload, 
  theme = 'dark' 
}: ErrorFallbackProps) {
  const isDark = theme === 'dark';
  
  const containerClasses = isDark
    ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-white'
    : 'bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900';
    
  const cardClasses = isDark
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';
    
  const buttonClasses = isDark
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-red-500 hover:bg-red-600 text-white';
    
  const secondaryButtonClasses = isDark
    ? 'bg-gray-600 hover:bg-gray-700 text-white'
    : 'bg-gray-500 hover:bg-gray-600 text-white';

  const isProduction = import.meta.env.PROD;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${containerClasses}`}>
      <div className={`max-w-md w-full ${cardClasses} rounded-lg shadow-lg border p-6`}>
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="text-lg font-medium mb-2">
            Oops! Something went wrong
          </h2>

          {/* Error Description */}
          <p className="text-sm opacity-75 mb-6">
            The story engine encountered an unexpected error. Don't worry - your progress is safe.
          </p>

          {/* Error Details (Development Only) */}
          {!isProduction && error && (
            <details className="text-left mb-6">
              <summary className="cursor-pointer text-sm font-medium opacity-75 hover:opacity-100">
                Error Details (Dev Mode)
              </summary>
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border text-xs font-mono">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1 opacity-75">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1 opacity-75">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${buttonClasses}`}
            >
              Try Again
            </button>
            
            <button
              onClick={onReload}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${secondaryButtonClasses}`}
            >
              Reload Page
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs opacity-50 mt-4">
            If this problem persists, try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;