import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../router/routes';
import { UNAUTHORIZED_EVENT } from '../../constants/events';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

export default function UnauthorizedRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, sessionWarning, resetSession } = useAuth();
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown
  const isHandlingRef = useRef(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Handle session warning
  useEffect(() => {
    if (sessionWarning) {
      setShowSessionExpiredModal(true);
      setCountdown(30); // 30 seconds countdown in modal

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Auto logout when countdown reaches 0
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setShowSessionExpiredModal(false);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [sessionWarning]);

  const handleExtendSession = () => {
    resetSession();
    setShowSessionExpiredModal(false);
  };

  const handleLogout = async () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;

    try {
      setShowSessionExpiredModal(false);
      setShowUnauthorizedModal(false);
      await logout();
      if (location.pathname !== ROUTES.GUEST.LOGIN) {
        navigate(ROUTES.GUEST.LOGIN, { replace: true, state: { from: location.pathname } });
      }
    } finally {
      setTimeout(() => {
        isHandlingRef.current = false;
      }, 0);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setShowUnauthorizedModal(true);
      // Auto logout after 5 seconds
      setTimeout(() => {
        handleLogout();
      }, 5000);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Session Expired Warning Modal */}
      {showSessionExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phiên đăng nhập sắp hết hạn</h3>
                <p className="text-sm text-neutral-600">Phiên của bạn sẽ hết hạn trong {formatTime(countdown)}</p>
              </div>
            </div>
            <p className="text-neutral-700 mb-6">
              Bạn có muốn tiếp tục phiên đăng nhập không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExtendSession}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tiếp tục phiên
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unauthorized Modal */}
      {showUnauthorizedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phiên đăng nhập không hợp lệ</h3>
                <p className="text-sm text-neutral-600">Token của bạn đã hết hạn hoặc không hợp lệ</p>
              </div>
            </div>
            <p className="text-neutral-700 mb-6">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây...
            </p>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Đăng nhập lại ngay
            </button>
          </div>
        </div>
      )}
    </>
  );
}

