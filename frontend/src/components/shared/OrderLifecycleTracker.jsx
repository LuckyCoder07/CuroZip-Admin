import React from 'react';
import { Check } from 'lucide-react';

const STATUS_ORDER = [
  'Booked',
  'Pickup Assigned',
  'Picked Up',
  'In Transit',
  'At Destination Hub',
  'Out for Delivery',
  'Delivered'
];

const OrderLifecycleTracker = ({ currentStatus }) => {
  const isFailed = currentStatus === 'Failed / Returned';
  
  // Find index of current status
  const currentIndex = isFailed 
    ? STATUS_ORDER.length // treat as end of line for UI purposes
    : STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="min-w-[800px] flex items-center relative px-4">
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = isFailed ? index < STATUS_ORDER.length - 1 : index < currentIndex;
          const isCurrent = isFailed ? false : index === currentIndex;
          
          return (
            <React.Fragment key={status}>
              {/* Step */}
              <div className="flex flex-col items-center relative z-10 w-32 shrink-0">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-cz-dark-bg
                    ${isCompleted ? 'border-green-500 text-green-500' : 
                      isCurrent ? 'border-cz-accent-orange text-cz-accent-orange' : 
                      'border-cz-border text-cz-text-secondary'}
                  `}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : (index + 1)}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full border-2 border-cz-accent-orange animate-ping opacity-75"></div>
                  )}
                </div>
                <div className={`text-xs mt-2 font-medium text-center transition-colors duration-300
                  ${isCompleted ? 'text-green-500' : isCurrent ? 'text-cz-accent-orange' : 'text-cz-text-secondary'}
                `}>
                  {status}
                </div>
              </div>

              {/* Connecting Line */}
              {index < STATUS_ORDER.length - 1 && (
                <div className="flex-1 h-1 bg-cz-border mx-[-20px] relative z-0">
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isCompleted ? 'bg-green-500 w-full' : 'w-0'}`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {isFailed && (
        <div className="mt-8 text-center text-red-500 font-bold bg-red-500/10 border border-red-500/20 py-3 rounded-lg mx-4">
          Status: Failed / Returned
        </div>
      )}
    </div>
  );
};

export default OrderLifecycleTracker;
