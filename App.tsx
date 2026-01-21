import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsView } from './components/ResultsView';
import { AppState, ProcessedTab } from './types';
import { fileToBase64, convertDocxToHtml } from './utils/fileHelpers';
import { processDocument } from './services/geminiService';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [tabs, setTabs] = useState<ProcessedTab[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setErrorMessage(null);

    try {
      let result;
      
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const htmlContent = await convertDocxToHtml(file);
        result = await processDocument({
          type: 'html',
          data: htmlContent,
          mimeType: 'text/html'
        });
      } else {
        const base64Data = await fileToBase64(file);
        result = await processDocument({
          type: 'pdf',
          data: base64Data,
          mimeType: file.type
        });
      }
      
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 w-full px-6 py-12">
        {appState === AppState.IDLE && (
          <div className="max-w-4xl mx-auto flex flex-col gap-12 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Convert Google Docs Tabs <br/>
                <span className="text-blue-600">to Markdown</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload your multi-tab Google Document (exported as PDF or DOCX). We'll intelligently split the tabs and give you clean, ready-to-use Markdown files.
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} />

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
              {[
                { title: "Get Your File", desc: "Download your Google Doc as PDF or DOCX, or use the link helper." },
                { title: "Smart Splitting", desc: "AI detects page breaks, sections, and headers to separate tabs." },
                { title: "Markdown Ready", desc: "Get properly named .md files for each tab instantly." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                   <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                     {i + 1}
                   </div>
                   <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                   <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="max-w-2xl mx-auto animate-in fade-in">
            <ProcessingStatus />
          </div>
        )}

        {appState === AppState.SUCCESS && (
          <div className="animate-in fade-in slide-in-from-bottom-8">
            <ResultsView tabs={tabs} onReset={handleReset} />
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto text-center space-y-6 animate-in fade-in">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 inline-block">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Processing Failed</h3>
              <p className="text-slate-500 mt-2">{errorMessage}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
      
      <footer className="py-6 text-center text-sm text-slate-400 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} DocTab Splitter. Built with React & Gemini.
      </footer>
    </div>
  );
};

export default App;
