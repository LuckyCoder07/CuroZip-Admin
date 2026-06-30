import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cz-dark-bg flex items-center justify-center">
        <Loader2 size={48} className="text-cz-accent-orange animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-cz-dark-bg flex items-center justify-center text-white flex-col">
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-cz-text-secondary mb-4">You do not have permission to view this page.</p>
        <button onClick={() => window.location.href = '/login'} className="bg-cz-accent-orange px-4 py-2 rounded">Return to Login</button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
