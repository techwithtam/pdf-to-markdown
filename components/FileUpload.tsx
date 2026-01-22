import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, AlertCircle, Link as LinkIcon, Download, ArrowRight } from 'lucide-react';

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
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
      setDownloadReadyUrl(exportUrl);
      setError(null);
    } else {
      setError("Could not parse a valid Google Doc ID from that link.");
      setDownloadReadyUrl(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-out
          ${isDragging
            ? 'border-orange-500 bg-orange-50/80 scale-[1.02]'
            : 'border-slate-300/70 hover:border-orange-400 bg-white/60 backdrop-blur-sm hover:bg-white/80'
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
          <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragging ? 'bg-orange-200' : 'bg-slate-900'}`}>
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-orange-600' : 'text-white'}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {isDragging ? 'Drop your file here' : 'Drop PDF or DOCX here'}
            </h3>
            <p className="text-slate-500 text-sm">
              or click to browse
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <FileType className="w-3 h-3" />
            <span>Max 20MB</span>
          </div>
        </div>
      </div>

      {/* Link Input Section */}
      <div className="bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-orange-400" />
          Paste Google Doc Link
        </h3>

        {!downloadReadyUrl ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://docs.google.com/document/d/..."
              value={docLink}
              onChange={(e) => setDocLink(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={handleLinkProcess}
              disabled={!docLink || disabled}
              className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all"
            >
              Get PDF
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Ready to Download</h4>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  Click below to download, then drag the file into the drop zone.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={downloadReadyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
                  >
                    Download PDF
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {
                      setDownloadReadyUrl(null);
                      setDocLink('');
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
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
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
