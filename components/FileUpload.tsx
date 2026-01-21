import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, AlertCircle, Link as LinkIcon, Download, ArrowRight, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docLink, setDocLink] = useState('');
  const [downloadReadyUrl, setDownloadReadyUrl] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  }, [disabled]);

  const validateAndProcessFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB.');
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleLinkProcess = () => {
    if (!docLink) return;
    
    const match = docLink.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    
    if (match && match[1]) {
      const docId = match[1];
      // Default to PDF export, but user can choose.
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
      setDownloadReadyUrl(exportUrl);
      setError(null);
    } else {
      setError("Could not parse a valid Google Doc ID from that link.");
      setDownloadReadyUrl(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-200' : 'bg-slate-100'}`}>
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">
              {isDragging ? 'Drop your file here' : 'Upload PDF or DOCX'}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Drag & drop your file here
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <FileType className="w-3 h-3" />
            <span>Up to 20MB</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-slate-500">Or from Drive</span>
        </div>
      </div>

      {/* Link Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Paste Google Doc Link
        </h3>
        
        {!downloadReadyUrl ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://docs.google.com/document/d/..."
              value={docLink}
              onChange={(e) => setDocLink(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLinkProcess}
              disabled={!docLink || disabled}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Get PDF
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">Ready to Download</h4>
                <p className="text-xs text-slate-600 mt-1 mb-3">
                  Click the button below to download the PDF from Google, then drag the file into the box above.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={downloadReadyUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Download PDF
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => {
                      setDownloadReadyUrl(null);
                      setDocLink('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
