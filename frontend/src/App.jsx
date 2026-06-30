import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppRouter from './router/index';
import ErrorBoundary from './components/ErrorBoundary';

// ─── App-start loading screen ────────────────────────────────────────────────
const AppLoadingScreen = () => (
  <div className="min-h-screen bg-cz-dark-bg flex items-center justify-center flex-col gap-6">
    <img
      src="https://finixia.in/logo's/curozip.png?v=1.4"
      alt="Curozip"
      className="h-12 object-contain"
    />
    <div className="relative w-14 h-14">
      <div className="w-14 h-14 rounded-full border-4 border-cz-border border-t-cz-accent-orange animate-spin" />
    </div>
    <p className="text-cz-text-secondary text-sm">Loading admin panel…</p>
  </div>
);

// ─── Guard: show loading screen while verifying JWT ──────────────────────────
const AuthGate = () => {
  const { isLoading } = useAuth();
  if (isLoading) return <AppLoadingScreen />;
  return <AppRouter />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
