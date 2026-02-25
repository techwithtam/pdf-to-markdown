import React from 'react';
import { X, Zap, Sparkles, FileText, Download, AlertCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">How it works</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Start */}
          <section>
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Quick Start</h3>
            <ol className="space-y-3">
              {[
                { icon: <FileText className="w-4 h-4" />, text: "Upload a PDF or DOCX file (max 20MB) by dragging and dropping or clicking to browse." },
                { icon: <Zap className="w-4 h-4" />, text: "Choose Quick Convert for well-formatted DOCX files, or AI Enhanced for messy exports or PDFs." },
                { icon: <Sparkles className="w-4 h-4" />, text: "AI detects each section automatically and converts them to clean Markdown files." },
                { icon: <Download className="w-4 h-4" />, text: "Download individual files or all as a ZIP in .md or .txt format." },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">{step.icon}</span>
                    {step.text}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Processing Modes */}
          <section>
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Processing Modes</h3>
            <div className="space-y-3">
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-white text-sm">Quick Convert</span>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">DOCX only</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI detects sections, then converts HTML directly to Markdown — no per-section AI calls. Fastest option. Best for clean, well-structured documents.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-white text-sm">AI Enhanced</span>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">PDF + DOCX</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each section is individually processed by AI to remove noise, fix formatting, and clean up OCR artifacts. Required for PDFs. Slower but produces the cleanest output.
                </p>
              </div>
            </div>
          </section>

          {/* Document Setup */}
          <section>
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Setting Up Your Document</h3>
            <div className="text-sm text-slate-300 space-y-2">
              <p>Your document needs <strong className="text-white">separator pages</strong> — short standalone titles that mark where each section begins. Examples:</p>
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>• <code className="text-orange-300 bg-slate-800 px-1 rounded">Overview</code></li>
                <li>• <code className="text-orange-300 bg-slate-800 px-1 rounded">Chapter 1</code></li>
                <li>• <code className="text-orange-300 bg-slate-800 px-1 rounded">system-prompt</code></li>
                <li>• <code className="text-orange-300 bg-slate-800 px-1 rounded">00-intro</code></li>
              </ul>
              <p className="text-slate-400">In Google Docs, use <strong className="text-white">bookmarks</strong> on separator lines for the most reliable detection.</p>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Troubleshooting</h3>
            <div className="space-y-2">
              {[
                { problem: "Only 1 tab detected", fix: "Make sure your document has clear separator lines. Try AI Enhanced mode." },
                { problem: "Processing fails", fix: "Try a smaller file or split your document into parts under 20MB." },
                { problem: "Content is messy", fix: "Switch to AI Enhanced mode for better cleaning." },
                { problem: "Google Doc download fails", fix: "Make sure the doc is shared ('Anyone with link can view') before pasting the URL." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-800 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.problem}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
