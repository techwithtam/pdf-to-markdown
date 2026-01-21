import React from 'react';
import { Loader2, Zap } from 'lucide-react';

export const ProcessingStatus: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-slate-100">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          Rapid Processing
        </h3>
        <p className="text-slate-500">
          Gemini Flash is splitting your document. This should only take a few seconds...
        </p>
      </div>

      <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 animate-progress-fast rounded-full"></div>
      </div>
    </div>
  );
};
