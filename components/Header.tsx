import React from 'react';
import { FileText, Github } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-6 border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">DocTab Splitter</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              Powered by <span className="text-blue-600 font-bold">Gemini Flash 2.0</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
            How it works
          </a>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};
