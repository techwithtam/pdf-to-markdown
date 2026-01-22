import React from 'react';
import { Zap, Sparkles, HelpCircle } from 'lucide-react';
import { ProcessingMode } from '../types';

interface ModeSelectorProps {
  mode: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 flex gap-1">
        {/* Quick Convert Option */}
        <button
          onClick={() => onChange(ProcessingMode.QUICK)}
          className={`
            flex-1 relative group rounded-xl p-4 transition-all duration-200
            ${mode === ProcessingMode.QUICK
              ? 'bg-slate-900 shadow-lg'
              : 'hover:bg-white/80'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              p-2 rounded-lg transition-colors
              ${mode === ProcessingMode.QUICK
                ? 'bg-orange-500'
                : 'bg-slate-200 group-hover:bg-slate-300'
              }
            `}>
              <Zap className={`w-5 h-5 ${mode === ProcessingMode.QUICK ? 'text-white' : 'text-slate-600'}`} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${mode === ProcessingMode.QUICK ? 'text-white' : 'text-slate-900'}`}>
                  Quick Convert
                </h3>
                <div className="group/tooltip relative">
                  <HelpCircle className={`w-4 h-4 ${mode === ProcessingMode.QUICK ? 'text-slate-400' : 'text-slate-400'}`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    AI detects sections, then direct conversion
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
              <p className={`text-sm mt-1 ${mode === ProcessingMode.QUICK ? 'text-slate-400' : 'text-slate-500'}`}>
                Best for well-formatted documents. Fastest option.
              </p>
            </div>
          </div>
        </button>

        {/* AI Enhanced Option */}
        <button
          onClick={() => onChange(ProcessingMode.AI_ENHANCED)}
          className={`
            flex-1 relative group rounded-xl p-4 transition-all duration-200
            ${mode === ProcessingMode.AI_ENHANCED
              ? 'bg-slate-900 shadow-lg'
              : 'hover:bg-white/80'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              p-2 rounded-lg transition-colors
              ${mode === ProcessingMode.AI_ENHANCED
                ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                : 'bg-slate-200 group-hover:bg-slate-300'
              }
            `}>
              <Sparkles className={`w-5 h-5 ${mode === ProcessingMode.AI_ENHANCED ? 'text-white' : 'text-slate-600'}`} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${mode === ProcessingMode.AI_ENHANCED ? 'text-white' : 'text-slate-900'}`}>
                  AI Enhanced
                </h3>
                <div className="group/tooltip relative">
                  <HelpCircle className={`w-4 h-4 ${mode === ProcessingMode.AI_ENHANCED ? 'text-slate-400' : 'text-slate-400'}`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    AI cleans and optimizes all content
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
              <p className={`text-sm mt-1 ${mode === ProcessingMode.AI_ENHANCED ? 'text-slate-400' : 'text-slate-500'}`}>
                Best for raw text or messy exports. Cleans everything.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
