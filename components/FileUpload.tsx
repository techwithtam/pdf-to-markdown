import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { FILE_CONFIG } from '../config';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docLink, setDocLink] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  }, [disabled]);

  const validateAndProcessFile = (file: File) => {
    if (!FILE_CONFIG.acceptedTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > FILE_CONFIG.maxSizeBytes) {
      setError(`File size must be less than ${FILE_CONFIG.maxSizeBytes / 1024 / 1024}MB.`);
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

  const handleGetDocx = () => {
    if (!docLink) return;

    const match = docLink.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);

    if (!match || !match[1]) {
      setError("Could not parse a valid Google Doc ID from that link.");
      return;
    }

    const docId = match[1];
    setError(null);

    // Trigger direct download
    window.location.href = `https://docs.google.com/document/d/${docId}/export?format=docx`;
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
          accept={FILE_CONFIG.acceptedExtensions}
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
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-orange-400" />
          Get DOCX from Google Doc
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Paste your Google Doc link to download as DOCX, then drop it above.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://docs.google.com/document/d/..."
            value={docLink}
            onChange={(e) => setDocLink(e.target.value)}
            disabled={disabled}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleGetDocx}
            disabled={!docLink || disabled}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all"
          >
            Get DOCX
          </button>
        </div>
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
