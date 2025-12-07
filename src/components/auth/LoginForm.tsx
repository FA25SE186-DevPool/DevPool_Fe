import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService, getRoleFromToken, authenticateWithFirebase } from '../../services/Auth';
import { startNotificationConnection, onReceiveNotification, onUnreadCountUpdated, getUnreadCount } from '../../services/notificationHub';
import { useNotification } from '../../contexts/NotificationContext';
import { setTokens, setUser, getUser, getAccessToken } from '../../utils/storage';
import logoDevPool from '../../assets/logo-DevPool.jpg';


export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isLoading } = useAuth();
  const { setUnread, pushItem } = useNotification();
  const navigate = useNavigate();

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoggingIn(true);

    // Validate input
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setIsLoggingIn(false);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng email');
      setIsLoggingIn(false);
      return;
    }

    try {
      // Kiểm tra nếu đã có tài khoản khác đang đăng nhập
      const existingUser = getUser();
      const existingToken = getAccessToken();
      
      if (existingUser && existingToken && existingUser.email !== email) {
        // Có tài khoản khác đang đăng nhập, cảnh báo nhưng vẫn cho phép đăng nhập
        // Token cũ sẽ bị ghi đè, tài khoản cũ sẽ bị logout
        console.warn(`Đang đăng nhập tài khoản mới (${email}). Tài khoản cũ (${existingUser.email}) sẽ bị đăng xuất.`);
      }
      
      // Gọi API login
      const response = await authService.login({ email, password });
      
      // Lấy role từ JWT token
      const frontendRole = getRoleFromToken(response.accessToken);
      
      if (!frontendRole) {
        setError('Không thể xác định quyền người dùng');
        setIsLoggingIn(false);
        return;
      }
      
      // Lưu tokens vào storage dựa trên rememberMe
      // Lưu ý: Token cũ sẽ bị ghi đè, tài khoản cũ sẽ bị logout
      setTokens(response.accessToken, response.refreshToken, rememberMe);
      
      // Phát sự kiện để các tab khác biết token đã thay đổi
      window.dispatchEvent(new Event('storage'));
      
      // Authenticate với Firebase để có quyền truy cập Firestore/Storage
      // Cần role để sync vào Firestore
      await authenticateWithFirebase(response, email, password, frontendRole);
      
      // Lưu thông tin user vào storage dựa trên rememberMe
      const userData = {
        id: response.userID,
        email: response.email,
        name: response.fullName,
        role: frontendRole,
        avatar: undefined
      };
      setUser(userData, rememberMe);
      
      // Khởi tạo kết nối SignalR sau khi đã có token
      try {
        await startNotificationConnection();
        // Lấy badge ban đầu
        try {
          const count = await getUnreadCount();
          if (typeof count === 'number') setUnread(count);
        } catch {}
        // Lắng nghe realtime
        onReceiveNotification((n: any) => {
          pushItem(n);
          // Nếu BE không gửi UnreadCountUpdated, có thể tự +1 (tùy chọn)
          // setUnread(prev => prev + 1);
          console.log('ReceiveNotification', n);
        });
        onUnreadCountUpdated((count: number) => {
          if (typeof count === 'number') setUnread(count);
        });
      } catch (e) {
        // Không chặn flow đăng nhập nếu WS lỗi
        console.warn('Không thể khởi tạo kết nối thông báo realtime:', e);
      }
      
      // Gọi login từ AuthContext để lưu thông tin user
      await login(
        response.email,
        '', // Không cần password nữa vì đã có token
        frontendRole as 'Staff TA' | 'Staff Accountant' | 'Staff Sales' | 'Developer' | 'Manager' | 'Admin'
      );

      // Hiển thị thông báo thành công
      setSuccess(true);
      setIsLoggingIn(false);

      // Đợi 1.5 giây để người dùng thấy thông báo thành công trước khi redirect
      setTimeout(() => {
        // Redirect based on role
        switch (frontendRole) {
          case 'Staff TA':
            navigate('/ta/dashboard');
            break;
          case 'Staff Accountant':
            navigate('/accountant/dashboard');
            break;
          case 'Staff Sales':
            navigate('/sales/dashboard');
            break;
          case 'Developer':
            navigate('/developer/dashboard');
            break;
          case 'Manager':
            navigate('/manager/dashboard');
            break;
          case 'Admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }, 1500);
    } catch (error: any) {
      setIsLoggingIn(false);
      // Xử lý lỗi từ API
      let errorMessage = 'Email hoặc mật khẩu không chính xác';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 shadow-glow animate-float border border-white/20 p-2">
          <img 
            src={logoDevPool} 
            alt="DevPool Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-3xl font-bold leading-normal bg-gradient-to-r from-neutral-900 via-primary-700 to-indigo-700 bg-clip-text text-transparent">
          Đăng Nhập
        </h2>
        <p className="text-neutral-600 mt-2">Chào mừng bạn quay lại DevPool</p>
      </div>

      {error && !isLoggingIn && (
        <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 animate-pulse" />
          <span className="text-error-700 text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700 text-sm font-medium">✅ Đăng nhập thành công! Đang chuyển hướng...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(''); // Clear error when user types
              }}
              className="w-full pl-12 pr-4 py-3.5 border border-neutral-300 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft text-neutral-900 placeholder-neutral-500"
              placeholder="Nhập email của bạn"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 border border-neutral-300 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft text-neutral-900 placeholder-neutral-500"
              placeholder="Nhập mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-300 p-1 rounded-lg hover:bg-primary-50"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 transition-all duration-300"
            />
            <label htmlFor="remember" className="ml-3 text-sm text-neutral-600 font-medium">
              Ghi nhớ đăng nhập
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="relative z-10 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors duration-300 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoggingIn || isLoading}
          className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none"
        >
          {(isLoggingIn || isLoading) ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Đang xử lý...</span>
            </div>
          ) : (
            'Đăng Nhập'
          )}
        </button>

        {/* Divider */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-neutral-500 font-medium">hoặc</span>
          </div>
        </div> */}

        {/* Social Login */}
        {/* <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-3.5 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft transform hover:scale-102 active:scale-98 group"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-neutral-700 font-semibold">Đăng nhập với Google</span>
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-3.5 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft transform hover:scale-102 active:scale-98 group"
          >
            <div className="w-5 h-5 bg-blue-600 rounded mr-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <span className="text-white text-xs font-bold">f</span>
            </div>
            <span className="text-neutral-700 font-semibold">Đăng nhập với Facebook</span>
          </button>
        </div> */}
      </form>

      {/* Switch to Register */}
      {/* <div className="mt-8 text-center">
        <span className="text-neutral-600">Chưa có tài khoản? </span>
        <button
          onClick={onToggleForm}
          className="relative z-10 text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-300 hover:underline"
        >
          Đăng ký ngay
        </button>
      </div> */}

      {/* Demo Accounts */}
      {/* <div className="relative z-10 mt-8 p-6 bg-gradient-to-br from-neutral-50 to-primary-50 rounded-2xl border border-neutral-200 shadow-soft">
        <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
          <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
          Tài khoản demo:
        </h4>
        <div className="text-sm text-neutral-600 space-y-2 font-medium">
          <div><span className="font-semibold">TA</span>: hr@example.com / string</div>
          <div><span className="font-semibold">Sales</span>: sale@example.com / string</div>
          <div><span className="font-semibold">Accountant</span>: accountant@example.com / string</div>
          <div><span className="font-semibold">Manager</span>: manager@example.com / string</div>
          <div><span className="font-semibold">Admin</span>: admin@example.com / string</div>
        </div>
      </div> */}
    </div>
  );
}