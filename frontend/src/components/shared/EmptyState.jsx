import React from 'react';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-cz-nav-bg flex items-center justify-center mb-4 text-cz-text-secondary">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-cz-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-cz-accent-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
