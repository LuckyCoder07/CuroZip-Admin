import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, delta, icon: Icon, color, loading }) => {
  if (loading) {
    return (
      <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-24 bg-cz-border rounded mb-3"></div>
            <div className="h-8 w-16 bg-cz-border rounded"></div>
          </div>
          <div className="h-12 w-12 rounded-full bg-cz-border"></div>
        </div>
      </div>
    );
  }

  const isPositive = delta && delta > 0;
  const isNegative = delta && delta < 0;

  return (
    <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-cz-text-secondary text-sm font-medium mb-1">{title}</p>
          <h3 className="text-cz-text-primary text-3xl font-bold">{value}</h3>
          
          {delta !== undefined && (
            <div className={`flex items-center mt-2 text-xs font-semibold ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-cz-text-secondary'}`}>
              {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : isNegative ? <ArrowDownRight size={14} className="mr-1" /> : null}
              <span>{Math.abs(delta)}% from last month</span>
            </div>
          )}
        </div>
        
        {Icon && color && (
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, color: color }}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
