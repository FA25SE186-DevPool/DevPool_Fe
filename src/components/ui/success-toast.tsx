import { useEffect } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

interface SuccessToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  autoHideDelay?: number; // milliseconds, default 3000
}

export function SuccessToast({
  isOpen,
  onClose,
  title,
  message,
  autoHideDelay = 3000
}: SuccessToastProps) {
  useEffect(() => {
    if (isOpen && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoHideDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] animate-slide-in">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">
              {title}
            </p>
            {message && (
              <p className="text-xs text-green-600 mt-1">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  autoHideDelay?: number; // milliseconds, default 5000
}

export function ErrorToast({
  isOpen,
  onClose,
  title,
  message,
  autoHideDelay = 5000
}: ErrorToastProps) {
  useEffect(() => {
    if (isOpen && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoHideDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] animate-slide-in">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">
              {title}
            </p>
            {message && (
              <p className="text-xs text-red-600 mt-1">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Legacy export for backward compatibility
export default SuccessToast;
