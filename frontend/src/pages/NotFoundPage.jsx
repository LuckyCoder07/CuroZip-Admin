import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#1f2937] rounded-2xl flex items-center justify-center mb-6 border border-[#374151]">
        <AlertCircle size={40} className="text-[#9ca3af]" />
      </div>
      
      <h1 className="text-7xl font-bold text-white mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-[#9ca3af] mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
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

export default NotFoundPage;
