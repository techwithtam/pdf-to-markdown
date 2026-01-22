import React from 'react';
import { FileText, Github } from 'lucide-react';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="w-full py-4 px-6 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="bg-white rounded-full px-4 py-2 shadow-sm flex items-center gap-2 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-1.5 rounded-lg">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Doc to Markdown</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/techwithtam/pdf-to-markdown"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-full p-3 shadow-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};
