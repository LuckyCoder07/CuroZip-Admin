import React from 'react';

const statusConfig = {
  'Booked': '#3b82f6',
  'Pickup Assigned': '#8b5cf6',
  'Picked Up': '#6366f1',
  'In Transit': '#eab308',
  'At Destination Hub': '#f97316',
  'Out for Delivery': '#06b6d4',
  'Delivered': '#22c55e',
  'Failed / Returned': '#ef4444'
};

const StatusBadge = ({ status }) => {
  const color = statusConfig[status] || '#9ca3af';

  return (
    <span 
      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block"
      style={{
        backgroundColor: `${color}26`,
        color: color
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
