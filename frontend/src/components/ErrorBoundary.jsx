import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-cz-dark-bg flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-cz-card-bg border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <img
            src="https://finixia.in/logo's/curozip.png?v=1.4"
            alt="Curozip"
            className="h-10 mx-auto mb-6 object-contain"
          />
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-cz-text-primary font-bold text-2xl mb-2">Something went wrong</h1>
          <p className="text-cz-text-secondary text-sm mb-6">
            An unexpected error occurred. Please reload the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cz-accent-orange text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#ea6c0a] transition-colors"
          >
            Reload Page
          </button>
          {this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-cz-text-secondary text-xs cursor-pointer hover:text-white transition-colors">
                Show error details
              </summary>
              <pre className="mt-2 text-red-400 text-xs bg-cz-dark-bg rounded-lg p-3 overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
