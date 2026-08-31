import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  const { theme } = useApp();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in-fast"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxW} animate-scale-in overflow-hidden rounded-2xl shadow-2xl transition-colors duration-300 ${
          theme === 'dark'
            ? 'liquid-glass bg-slate-900/90 text-white border border-white/10 shadow-2xl backdrop-blur-2xl'
            : 'bg-white text-slate-900 border border-slate-200/90 shadow-xl'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className={`flex items-start justify-between gap-4 border-b p-5 ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-200/80'
          }`}>
            <div>
              {title && <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>}
              {description && <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>}
            </div>
            <button
              onClick={onClose}
              className={`rounded-lg p-1.5 transition ${
                theme === 'dark' ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-5 sm:p-6">{children}</div>
        {footer && <div className={`border-t p-4 ${theme === 'dark' ? 'border-white/10 bg-slate-950/80' : 'border-slate-200/80 bg-slate-50/60'}`}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
