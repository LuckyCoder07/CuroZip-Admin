import React from 'react';

const PageHeader = ({ title, subtitle, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-cz-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-cz-accent-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
