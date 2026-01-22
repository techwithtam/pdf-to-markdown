import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsView } from './components/ResultsView';
import { VideoModal } from './components/VideoModal';
import { AppState, ProcessedTab, ProcessingStep } from './types';
import { fileToBase64, convertDocxToHtml } from './utils/fileHelpers';
import { processDocument } from './services/geminiService';
import { AlertTriangle, Play } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [tabs, setTabs] = useState<ProcessedTab[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(ProcessingStep.READING);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setProcessingStep(ProcessingStep.READING);
    setErrorMessage(null);

    try {
      let result;

      setProcessingStep(ProcessingStep.CONVERTING);

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const htmlContent = await convertDocxToHtml(file);

        setProcessingStep(ProcessingStep.ANALYZING);
        result = await processDocument({
          type: 'html',
          data: htmlContent,
          mimeType: 'text/html'
        });
      } else {
        const base64Data = await fileToBase64(file);

        setProcessingStep(ProcessingStep.ANALYZING);
        result = await processDocument({
          type: 'pdf',
          data: base64Data,
          mimeType: file.type
        });
      }

      setProcessingStep(ProcessingStep.GENERATING);
      setTabs(result.tabs);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred while processing the document."
      );
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setTabs([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-300/30 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-full px-6 py-8">
          {appState === AppState.IDLE && (
            <div className="max-w-4xl mx-auto flex flex-col gap-10 animate-in fade-in zoom-in duration-500">
              {/* Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-slate-900/90 text-white text-sm px-4 py-2 rounded-full">
                  <span className="bg-white text-slate-900 text-xs font-bold px-2 py-0.5 rounded">New</span>
                  <span className="text-slate-200">Powered by Gemini 2.5 Flash</span>
                </div>
              </div>

              {/* Hero */}
              <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                  Split Google Docs
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                    into Markdown
                  </span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Upload your multi-tab Google Document and get clean,
                  <br className="hidden sm:block" />
                  ready-to-use Markdown files instantly.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex justify-center gap-4">
                <label className="cursor-pointer px-8 py-3 bg-white text-slate-900 rounded-full text-base font-semibold hover:bg-slate-50 transition-all shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/50 hover:-translate-y-0.5">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  Upload document
                </label>
                <button
                  onClick={() => setIsVideoOpen(true)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-full text-base font-semibold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch demo
                </button>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full mt-8">
                {[
                  { title: "Smart Detection", desc: "AI automatically finds where each section starts and ends in your document." },
                  { title: "Clean Output", desc: "Removes messy formatting, page numbers, and conversion errors automatically." },
                  { title: "AI Ready", desc: "Perfect for uploading to ChatGPT, Claude, or any AI tool as a knowledge base." }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl text-left group hover:bg-slate-900 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold">{i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 px-4 text-slate-500 font-medium">Or drag & drop below</span>
                </div>
              </div>

              {/* File Upload */}
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          )}

          {appState === AppState.PROCESSING && (
            <div className="max-w-2xl mx-auto animate-in fade-in">
              <ProcessingStatus currentStep={processingStep} />
            </div>
          )}

          {appState === AppState.SUCCESS && (
            <div className="animate-in fade-in slide-in-from-bottom-8">
              <ResultsView tabs={tabs} onReset={handleReset} />
            </div>
          )}

          {appState === AppState.ERROR && (
            <div className="max-w-md mx-auto text-center space-y-6 animate-in fade-in">
              <div className="bg-slate-900 p-6 rounded-2xl inline-block">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Processing Failed</h3>
                <p className="text-slate-600 mt-2">{errorMessage}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-50 transition-all shadow-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </main>

        <footer className="relative z-10 py-6 text-center text-sm text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Brought to you by the{' '}
            <a
              href="https://www.skool.com/bewarethedefault/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Cadence Team
            </a>
          </p>
        </footer>
      </div>

      {/* Video Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </div>
  );
};

export default App;
