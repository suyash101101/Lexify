import React from 'react';
import { Scale } from 'lucide-react';

export const Loading = () => {
  return (
    <div className="fixed inset-0 bg-accent-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer rotating circle */}
          <div className="absolute inset-0 rounded-full border-2 border-primary-main/20 animate-[spin_2s_linear_infinite]" />
          
          {/* Inner rotating circle */}
          <div className="absolute inset-0 rounded-full border-2 border-t-primary-main border-r-transparent border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite]" />
          
          {/* Icon container */}
          <div className="w-16 h-16 bg-primary-main rounded-full flex items-center justify-center relative">
            <Scale className="w-8 h-8 text-accent-white" />
          </div>
        </div>
        <p className="text-primary-main/60 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}; 