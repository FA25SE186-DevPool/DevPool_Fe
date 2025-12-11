import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { NavigateOptions, To } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/Auth';
import logoDevPool from '../../assets/images/logo-DevPool.jpg';

type Step = 'email' | 'reset';

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Validation errors for individual fields
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const navigateFn = useNavigate();
  const location = useLocation();
  const hasFormDataRef = useRef(false);
  const isNavigatingRef = useRef(false);
  
  // Custom navigate function that checks for confirmation
  const navigate = React.useCallback((to: To, options?: NavigateOptions) => {
    if (step === 'reset' && hasFormDataRef.current && !isSuccess && !isNavigatingRef.current) {
      const toStr = typeof to === 'string' ? to : (typeof to === 'number' ? String(to) : to.pathname || '');
      if (toStr && toStr !== '/forgot-password' && !toStr.includes('/forgot-password')) {
        const confirmed = showConfirmDialog(
          'Bạn đang trong quá trình đặt lại mật khẩu. Bạn có chắc muốn rời khỏi trang này? Dữ liệu đã nhập (OTP, mật khẩu) sẽ bị mất.'
        );
        if (!confirmed) {
          return;
        }
        isNavigatingRef.current = true;
      }
    }
    navigateFn(to, options);
  }, [step, isSuccess, navigateFn]);

  // Track if user has entered data in step 2
  useEffect(() => {
    if (step === 'reset' && (otp || newPassword || confirmPassword)) {
      hasFormDataRef.current = true;
    }
  }, [step, otp, newPassword, confirmPassword]);

  // Reset flag when step changes to email
  useEffect(() => {
    if (step === 'email') {
      hasFormDataRef.current = false;
    }
  }, [step]);

  // Handle browser navigation warning (close tab, back button, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 'reset' && hasFormDataRef.current && !isSuccess) {
        e.preventDefault();
        e.returnValue = 'Bạn có chắc muốn rời khỏi trang? Dữ liệu đã nhập có thể bị mất.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, isSuccess]);

  // Track location changes to intercept navigation
  const prevLocationRef = useRef(location.pathname);
  
  useEffect(() => {
    if (step === 'reset' && hasFormDataRef.current && !isSuccess) {
      // Check if location changed (navigation occurred)
      if (location.pathname !== prevLocationRef.current && location.pathname !== '/forgot-password') {
        if (!isNavigatingRef.current) {
          // Navigation happened without confirmation, prevent it
          const confirmed = showConfirmDialog(
            'Bạn đang trong quá trình đặt lại mật khẩu. Bạn có chắc muốn rời khỏi trang này? Dữ liệu đã nhập (OTP, mật khẩu) sẽ bị mất.'
          );
          
          if (!confirmed) {
            // Navigate back to forgot-password page
            navigate('/forgot-password', { replace: true });
            return;
          } else {
            isNavigatingRef.current = true;
          }
        }
      }
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname, step, isSuccess, navigate]);

  // Intercept React Router navigation and other link clicks when in step 2
  useEffect(() => {
    if (step === 'reset' && hasFormDataRef.current && !isSuccess) {
      const handleClick = (e: MouseEvent) => {
        if (isNavigatingRef.current) {
          return; // Allow navigation if we've already confirmed
        }

        const target = e.target as HTMLElement;
        
        // Check all possible link selectors
        const link = (target.closest('a') || target.closest('[role="link"]')) as HTMLElement | null;
        
        if (link) {
          let href: string | null = null;
          
          // Try to get href from different sources
          if (link instanceof HTMLAnchorElement) {
            href = link.href || link.getAttribute('href');
          } else {
            href = link.getAttribute('href') || link.getAttribute('data-href');
          }
          
          if (!href) {
            // For React Router Links, check if there's a to attribute via data
            const reactRouterLink = target.closest('[data-react-router-link]') as HTMLElement | null;
            if (reactRouterLink) {
              href = reactRouterLink.getAttribute('data-to');
            }
          }
          
          if (!href) return;
          
          // Remove origin if present
          if (href.startsWith(window.location.origin)) {
            href = href.replace(window.location.origin, '');
          }
          
          const currentPath = location.pathname;
          
          // Skip if clicking on the same page or fragments
          if (href === '#' || href === currentPath || href.startsWith('#')) {
            return;
          }

          // Intercept navigation to different pages (including login)
          if (href.startsWith('/')) {
            // Don't intercept if it's the current forgot-password page
            if (href.includes('/forgot-password')) {
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const confirmed = showConfirmDialog(
              'Bạn đang trong quá trình đặt lại mật khẩu. Bạn có chắc muốn rời khỏi trang này? Dữ liệu đã nhập (OTP, mật khẩu) sẽ bị mất.'
            );
            
            if (confirmed) {
              isNavigatingRef.current = true;
              navigate(href);
            }
          }
        }
      };

      // Use capture phase to catch before React Router handles it
      document.addEventListener('click', handleClick, true);
      
      // Also listen to popstate (back/forward button)
      const handlePopState = () => {
        if (hasFormDataRef.current && !isSuccess && !isNavigatingRef.current) {
          const confirmed = showConfirmDialog(
            'Bạn đang trong quá trình đặt lại mật khẩu. Bạn có chắc muốn quay lại? Dữ liệu đã nhập (OTP, mật khẩu) sẽ bị mất.'
          );
          if (!confirmed) {
            // Push current state back to prevent navigation
            window.history.pushState(null, '', location.pathname);
            window.history.pushState(null, '', location.pathname);
          } else {
            isNavigatingRef.current = true;
          }
        }
      };

      // Add a state to prevent immediate back navigation
      window.history.pushState(null, '', location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        document.removeEventListener('click', handleClick, true);
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // Reset navigation flag when leaving step 2 or when successful
      isNavigatingRef.current = false;
      prevLocationRef.current = location.pathname;
    }
  }, [step, isSuccess, location.pathname, navigate]);

  // Function to show confirmation dialog
  const showConfirmDialog = (message: string): boolean => {
    return window.confirm(message);
  };

  // Validate email format - cải thiện regex
  const validateEmail = (email: string): string => {
    if (!email || email.trim() === '') {
      return 'Vui lòng nhập email';
    }
    // Regex cải thiện cho email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@email.com)';
    }
    return '';
  };

  // Validate password strength
  const validatePassword = (password: string): string => {
    if (!password || password.trim() === '') {
      return 'Vui lòng nhập mật khẩu';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (password.length > 100) {
      return 'Mật khẩu không được vượt quá 100 ký tự';
    }
    
    // Check if password is too simple or common
    const passwordLower = password.toLowerCase();
    
    // Check if password contains email (if email is available)
    if (email) {
      const emailLocalPart = email.split('@')[0].toLowerCase();
      if (passwordLower.includes(emailLocalPart) && emailLocalPart.length > 3) {
        return 'Mật khẩu không nên chứa tên email của bạn';
      }
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(passwordLower)) {
      return 'Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác';
    }
    
    // Check if password is all the same character
    if (password.split('').every(char => char === password[0])) {
      return 'Mật khẩu không được chứa toàn bộ ký tự giống nhau';
    }
    
    return '';
  };

  // Validate confirm password
  const validateConfirmPassword = (confirm: string, password: string): string => {
    if (!confirm || confirm.trim() === '') {
      return 'Vui lòng xác nhận mật khẩu';
    }
    if (confirm !== password) {
      return 'Mật khẩu xác nhận không khớp với mật khẩu mới';
    }
    return '';
  };

  // Handle step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setSuccess('');
    setIsLoading(true);

    // Validate email
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setIsLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(email.trim());
      setSuccess('OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
      setTimeout(() => {
        setStep('reset');
        setSuccess('');
        setEmailError('');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể gửi OTP. Vui lòng thử lại sau.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step 2: Reset password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSuccess('');
    setIsLoading(true);

    // Validate OTP
    if (!otp || otp.trim() === '' || otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      setIsLoading(false);
      return;
    }

    // Validate password
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      setIsLoading(false);
      return;
    }

    // Validate confirm password
    const confirmPasswordValidationError = validateConfirmPassword(confirmPassword, newPassword);
    if (confirmPasswordValidationError) {
      setConfirmPasswordError(confirmPasswordValidationError);
      setIsLoading(false);
      return;
    }

    try {
      await authService.resetPasswordByOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      setIsSuccess(true);
      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      // Handle different error messages from backend
      let errorMessage = error?.message || 'OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.';
      
      // Check if error indicates password is same as old password
      const errorLower = errorMessage.toLowerCase();
      if (
        errorLower.includes('mật khẩu cũ') ||
        errorLower.includes('old password') ||
        errorLower.includes('same password') ||
        errorLower.includes('trùng với mật khẩu') ||
        errorLower.includes('giống mật khẩu cũ')
      ) {
        setPasswordError('Mật khẩu mới không được trùng với mật khẩu cũ. Vui lòng chọn mật khẩu khác.');
        errorMessage = 'Mật khẩu mới không được trùng với mật khẩu cũ';
      } else if (errorLower.includes('otp') || errorLower.includes('mã')) {
        // OTP related errors - show in general error
        setError(errorMessage);
      } else {
        // Other errors
        setError(errorMessage);
        // Also check if it's a password validation error
        if (errorLower.includes('password') || errorLower.includes('mật khẩu')) {
          setPasswordError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
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
          {step === 'email' ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
        </h2>
        <p className="text-neutral-600 mt-2">
          {step === 'email'
            ? 'Nhập email để nhận mã OTP'
            : 'Nhập mã OTP và mật khẩu mới'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              step === 'email'
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-green-500 text-white'
            }`}
          >
            {step === 'reset' ? <CheckCircle className="w-6 h-6" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium text-neutral-600">Email</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-300"></div>
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              step === 'reset'
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-neutral-200 text-neutral-500'
            }`}
          >
            2
          </div>
          <span className="ml-2 text-sm font-medium text-neutral-600">Đặt lại</span>
        </div>
      </div>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 animate-pulse" />
          <span className="text-error-700 text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700 text-sm font-medium">{success}</span>
        </div>
      )}

      {step === 'email' ? (
        <>
          <form onSubmit={handleSendOtp} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email <span className="text-error-500">*</span>
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  emailError ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (error) setError('');
                  }}
                  onBlur={() => {
                    if (email) {
                      const emailValidationError = validateEmail(email);
                      setEmailError(emailValidationError);
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${
                    emailError 
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
                      : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                  }`}
                  placeholder="Nhập email của bạn (ví dụ: example@email.com)"
                  required
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang gửi OTP...</span>
                </div>
              ) : (
                'Gửi Mã OTP'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:border-primary-500 hover:bg-primary-50 rounded-xl font-semibold transition-all duration-300 hover:shadow-soft transform hover:scale-102 active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </>
      ) : (
        <>
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Đặt lại mật khẩu thành công!</h3>
              <p className="text-neutral-600 mb-6">Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 hover:from-primary-700 hover:to-indigo-700 shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98"
              >
                Đi đến trang đăng nhập
              </Link>
            </div>
          ) : (
            <>
            <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Email Display (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-12 pr-4 py-3.5 border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Mã OTP
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 border border-neutral-300 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft text-neutral-900 placeholder-neutral-500 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Nhập 6 chữ số OTP đã được gửi đến email của bạn
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Mật khẩu mới <span className="text-error-500">*</span>
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  passwordError ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (error) setError('');
                    // Real-time check confirm password if it's already filled
                    if (confirmPassword) {
                      const confirmError = validateConfirmPassword(confirmPassword, e.target.value);
                      setConfirmPasswordError(confirmError);
                    }
                  }}
                  onBlur={() => {
                    if (newPassword) {
                      const passwordValidationError = validatePassword(newPassword);
                      setPasswordError(passwordValidationError);
                    }
                  }}
                  className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${
                    passwordError 
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
                      : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                  }`}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-300 p-1 rounded-lg hover:bg-primary-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {passwordError}
                </p>
              )}
              {!passwordError && newPassword && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  Mật khẩu hợp lệ
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Xác nhận mật khẩu mới <span className="text-error-500">*</span>
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  confirmPasswordError ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) {
                      const confirmError = validateConfirmPassword(e.target.value, newPassword);
                      setConfirmPasswordError(confirmError);
                    }
                    if (error) setError('');
                  }}
                  onBlur={() => {
                    if (confirmPassword) {
                      const confirmError = validateConfirmPassword(confirmPassword, newPassword);
                      setConfirmPasswordError(confirmError);
                    }
                  }}
                  className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${
                    confirmPasswordError 
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
                      : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                  }`}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-300 p-1 rounded-lg hover:bg-primary-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {confirmPasswordError}
                </p>
              )}
              {!confirmPasswordError && confirmPassword && newPassword && confirmPassword === newPassword && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  Mật khẩu xác nhận khớp
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                'Đặt Lại Mật Khẩu'
              )}
            </button>
          </form>

          {/* Back to Step 1 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Always show confirmation if user has entered any data
                if (otp || newPassword || confirmPassword) {
                  const confirmed = showConfirmDialog(
                    'Bạn có chắc muốn quay lại bước trước? Dữ liệu đã nhập (OTP, mật khẩu) sẽ bị xóa và bạn sẽ phải nhập lại.'
                  );
                  if (!confirmed) {
                    return; // User cancelled, don't proceed
                  }
                }

                isNavigatingRef.current = true;
                setStep('email');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
                setEmailError('');
                setPasswordError('');
                setConfirmPasswordError('');
                hasFormDataRef.current = false;
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:border-primary-500 hover:bg-primary-50 rounded-xl font-semibold transition-all duration-300 hover:shadow-soft transform hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading || isSuccess}
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại bước trước
            </button>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
