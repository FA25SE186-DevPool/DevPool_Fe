import { useState } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import FaceIDEnroll from '../auth/FaceIDEnroll';
import { userService } from '../../services/User';
import { decodeJWT } from '../../services/Auth';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../services/User';

interface FaceIDSectionProps {
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export default function FaceIDSection({ user, onUserUpdate }: FaceIDSectionProps) {
  const [showFaceIDEnroll, setShowFaceIDEnroll] = useState(false);
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

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Camera className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">FaceID</h2>
              <p className="text-sm text-neutral-600">
                {user?.hasFaceId 
                  ? 'Bạn đã đăng ký FaceID' 
                  : 'Đăng ký FaceID để đăng nhập nhanh hơn'}
              </p>
            </div>
          </div>
          {!user?.hasFaceId && (
            <button
              onClick={() => setShowFaceIDEnroll(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 font-medium"
            >
              Đăng Ký
            </button>
          )}
        </div>
      </div>

      {showFaceIDEnroll && (
        <div className="p-6">
          <FaceIDEnroll
            email={user?.email || authUser?.email || ''}
            onSuccess={handleFaceIDEnrollSuccess}
            onCancel={() => setShowFaceIDEnroll(false)}
          />
        </div>
      )}

      {!showFaceIDEnroll && user?.hasFaceId && (
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">FaceID đã được kích hoạt</p>
              <p className="text-green-600 text-sm">Bạn có thể sử dụng FaceID để đăng nhập</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

