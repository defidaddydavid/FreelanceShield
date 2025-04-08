import React from 'react';
import { ShieldCheckIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface InsuranceCardProps {
  title: string;
  description: string;
  premium: string;
  coverage: string;
  duration: string;
  status?: 'active' | 'pending' | 'expired';
  onClick?: () => void;
}

export const InsuranceCard: React.FC<InsuranceCardProps> = ({
  title,
  description,
  premium,
  coverage,
  duration,
  status = 'active',
  onClick,
}) => {
  const statusColors = {
    active: 'bg-shield-blue',
    pending: 'bg-silver',
    expired: 'bg-shield-purple',
  };

  const statusLabels = {
    active: 'Active',
    pending: 'Pending',
    expired: 'Expired',
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-shield-purple transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-brick font-semibold text-white">{title}</h3>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]} mr-2`}></div>
            <span className="text-sm text-gray-300">{statusLabels[status]}</span>
          </div>
        </div>
        
        <p className="text-gray-400 mb-6">{description}</p>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6 text-shield-blue mb-2" />
            <span className="text-xs text-gray-400">Premium</span>
            <span className="text-sm font-brick font-medium text-white">{premium}</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-shield-purple mb-2" />
            <span className="text-xs text-gray-400">Coverage</span>
            <span className="text-sm font-brick font-medium text-white">{coverage}</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg">
            <ClockIcon className="w-6 h-6 text-silver mb-2" />
            <span className="text-xs text-gray-400">Duration</span>
            <span className="text-sm font-brick font-medium text-white">{duration}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
        <button className="px-4 py-2 bg-shield-purple hover:bg-shield-purple/80 text-white rounded-md transition-colors font-brick">
          View Details
        </button>
        
        <button className="px-4 py-2 border border-shield-blue text-shield-blue hover:bg-shield-blue/10 rounded-md transition-colors font-brick">
          Renew
        </button>
      </div>
    </div>
  );
};

export default InsuranceCard;
