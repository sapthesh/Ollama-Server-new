import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative transform overflow-hidden rounded-3xl glass-card
          text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-white/10 animate-in fade-in zoom-in duration-300">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="px-6 py-6 border-b border-white/0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}