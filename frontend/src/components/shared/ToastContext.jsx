import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIconAndColor = (type) => {
    switch (type) {
      case 'success': return { Icon: CheckCircle, colorClass: 'border-green-500 text-green-500' };
      case 'error': return { Icon: XCircle, colorClass: 'border-red-500 text-red-500' };
      case 'warning': return { Icon: AlertTriangle, colorClass: 'border-yellow-500 text-yellow-500' };
      case 'info':
      default: return { Icon: Info, colorClass: 'border-blue-500 text-blue-500' };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const { Icon, colorClass } = getIconAndColor(toast.type);
          
          return (
            <div 
              key={toast.id}
              className={`bg-cz-card-bg text-white shadow-xl rounded-lg border-l-4 p-4 min-w-[300px] max-w-md flex items-start pointer-events-auto animate-in slide-in-from-right-full duration-300 ${colorClass}`}
            >
              <Icon size={20} className="mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1 mr-2 text-sm text-cz-text-primary">{toast.message}</div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-cz-text-secondary hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
