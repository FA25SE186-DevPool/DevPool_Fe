import { useState } from 'react';
import { Camera, CheckCircle, Trash2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import FaceIDEnroll from '../auth/FaceIDEnroll';
import { userService } from '../../services/User';
import { decodeJWT, authService } from '../../services/Auth';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../services/User';

interface FaceIDSectionProps {
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export default function FaceIDSection({ user, onUserUpdate }: FaceIDSectionProps) {
  const [showFaceIDEnroll, setShowFaceIDEnroll] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const handleFaceIDEnrollSuccess = async () => {
    // Refresh user data to get updated hasFaceId status
    if (!authUser) return;

    try {
      const token = localStorage.getItem('accessToken');
      let userId: string | null = null;

      if (token) {
        const decoded = decodeJWT(token);
        userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
      } else {
        userId = authUser.id;
      }

      if (userId) {
        const updatedUser = await userService.getById(userId);
        onUserUpdate?.(updatedUser);
        setShowFaceIDEnroll(false);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const handleRemoveFaceID = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      await authService.removeFaceID();

      // Refresh user data
      if (authUser) {
        const token = localStorage.getItem('accessToken');
        let userId: string | null = null;

        if (token) {
          const decoded = decodeJWT(token);
          userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
        } else {
          userId = authUser.id;
        }

        if (userId) {
          const updatedUser = await userService.getById(userId);
          onUserUpdate?.(updatedUser);
        }
      }

      setShowRemoveConfirm(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Không thể xóa FaceID');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${user?.hasFaceId ? 'bg-green-100' : 'bg-primary-100'}`}>
              {user?.hasFaceId ? (
                <ShieldCheck className="w-6 h-6 text-green-600" />
              ) : (
                <Camera className="w-6 h-6 text-primary-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">FaceID</h2>
                {user?.hasFaceId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Đã kích hoạt
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600">
                {user?.hasFaceId
                  ? 'Đăng nhập nhanh chóng và bảo mật bằng khuôn mặt'
                  : 'Đăng ký FaceID để đăng nhập nhanh hơn'}
              </p>
            </div>
          </div>
          {!user?.hasFaceId && !showFaceIDEnroll && (
            <button
              onClick={() => setShowFaceIDEnroll(true)}
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
            >
              Đăng Ký FaceID
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Enroll Form */}
      {showFaceIDEnroll && (
        <div className="p-5">
          <FaceIDEnroll
            email={user?.email || authUser?.email || ''}
            onSuccess={handleFaceIDEnrollSuccess}
            onCancel={() => setShowFaceIDEnroll(false)}
          />
        </div>
      )}

      {/* FaceID Active State */}
      {!showFaceIDEnroll && user?.hasFaceId && (
        <div className="p-5">
          {/* Success Status */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-green-800 font-semibold text-lg">FaceID đã được kích hoạt</p>
              <p className="text-green-600 text-sm mt-0.5">
                Bạn có thể sử dụng khuôn mặt để đăng nhập nhanh chóng và an toàn
              </p>
            </div>
          </div>

          {/* Remove FaceID Section */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            {!showRemoveConfirm ? (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa FaceID
              </button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Xác nhận xóa FaceID?</p>
                    <p className="text-red-600 text-sm mt-1">
                      Sau khi xóa, bạn sẽ không thể đăng nhập bằng khuôn mặt cho đến khi đăng ký lại.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={handleRemoveFaceID}
                        disabled={isRemoving}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xóa...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Xác nhận xóa
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowRemoveConfirm(false)}
                        disabled={isRemoving}
                        className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No FaceID State */}
      {!showFaceIDEnroll && !user?.hasFaceId && (
        <div className="p-5">
          <div className="flex items-center gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="p-3 bg-neutral-200 rounded-full">
              <Camera className="w-8 h-8 text-neutral-500" />
            </div>
            <div className="flex-1">
              <p className="text-neutral-700 font-medium">Chưa đăng ký FaceID</p>
              <p className="text-neutral-500 text-sm mt-0.5">
                Đăng ký FaceID để đăng nhập nhanh chóng chỉ với khuôn mặt của bạn
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
