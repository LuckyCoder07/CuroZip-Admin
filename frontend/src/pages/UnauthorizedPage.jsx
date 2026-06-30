import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
        <ShieldAlert size={40} className="text-red-500" />
      </div>
      
      <h1 className="text-7xl font-bold text-white mb-4">403</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
      <p className="text-[#9ca3af] mb-8 max-w-md">
        You do not have permission to view this page. This area is restricted to Super Admins.
      </p>
      
      <Link 
        to="/dashboard" 
        className="px-6 py-3 bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
