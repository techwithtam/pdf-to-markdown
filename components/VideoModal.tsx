import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video embed */}
        <div className="aspect-video relative">
          <iframe
            src="https://www.tella.tv/video/vid_cmkoq2sjb004x04kv04irenhv/embed?b=0&title=0&a=1&loop=0&t=0&muted=0&wt=0"
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen
            allowTransparency
          />
        </div>
      </div>
    </div>
  );
};
