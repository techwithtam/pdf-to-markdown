import React from 'react';
import { ProcessedTab } from '../types';
import { FileDown, FileJson, Copy, Check } from 'lucide-react';
import { downloadFile, downloadAllAsZip } from '../utils/fileHelpers';

interface ResultsViewProps {
  tabs: ProcessedTab[];
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ tabs, onReset }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Conversion Complete</h2>
          <p className="text-slate-500">Found {tabs.length} distinct tabs in your document.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={() => downloadAllAsZip(tabs)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            Download All (.zip)
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {tabs.map((tab, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <FileJson className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate" title={tab.fileName}>
                    {tab.fileName}
                  </h3>
                  {tab.originalTitle && (
                    <p className="text-xs text-slate-500 truncate">From: {tab.originalTitle}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(tab.markdownContent, index)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy content"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => downloadFile(tab.fileName, tab.markdownContent)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-64 overflow-y-auto bg-white custom-scrollbar">
              <pre className="text-sm text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                {tab.markdownContent}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
