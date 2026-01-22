import React from 'react';
import { ProcessedTab } from '../types';
import { FileDown, FileText, Copy, Check, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import { downloadFile, downloadAllAsZip, ExportFormat } from '../utils/fileHelpers';

interface ResultsViewProps {
  tabs: ProcessedTab[];
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ tabs, onReset }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const downloadMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadAll = (format: ExportFormat) => {
    downloadAllAsZip(tabs, format);
    setShowDownloadMenu(false);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-700 text-sm px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span>Conversion complete</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          Found {tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}
        </h2>
        <p className="text-slate-600">Your markdown files are ready to download</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white rounded-full hover:bg-slate-50 transition-all shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Process another
        </button>
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-full hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-200/50"
          >
            <FileDown className="w-4 h-4" />
            Download all (.zip)
            <ChevronDown className={`w-4 h-4 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
          </button>
          {showDownloadMenu && (
            <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-10 min-w-[180px]">
              <button
                onClick={() => handleDownloadAll('md')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4 text-orange-500" />
                Markdown (.md)
              </button>
              <button
                onClick={() => handleDownloadAll('txt')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-100"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Plain Text (.txt)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className="bg-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden group"
          >
            {/* Card Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate" title={tab.fileName}>
                    {tab.fileName}
                  </h3>
                  {tab.originalTitle && (
                    <p className="text-xs text-slate-400 truncate">From: {tab.originalTitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(tab.markdownContent, index)}
                  className={`p-2 rounded-lg transition-all ${
                    copiedIndex === index
                      ? 'text-green-400 bg-green-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Copy content"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => downloadFile(tab.fileName, tab.markdownContent)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 max-h-64 overflow-y-auto custom-scrollbar">
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {tab.markdownContent}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
