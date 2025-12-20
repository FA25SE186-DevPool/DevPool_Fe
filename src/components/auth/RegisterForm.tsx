import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export default function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    role: 'Developer' as 'Staff TA' | 'Staff Accountant' | 'Staff Sales' | 'Developer' | 'Manager' | 'Admin',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };
    return requirements;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else {
      const requirements = validatePassword(formData.password);
      if (!requirements.length) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register(formData.email, formData.password, formData.role);

      // Redirect based on role
      switch (formData.role) {
        case 'Staff TA':
          navigate('/staff_hr/setup');
          break;
        case 'Admin':
          navigate('/admin/setup');
          break;
        default:
          navigate('/');
      }
    } catch {
      setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
    }
  };

  const passwordRequirements = validatePassword(formData.password);

  return (
    <div className="w-full max-w-md mx-auto p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl mb-4 shadow-glow-green animate-float">
          <span className="text-white font-bold text-2xl">D</span>
        </div>
        <h2 className="text-3xl font-bold leading-normal bg-gradient-to-r from-neutral-900 via-secondary-700 to-primary-700 bg-clip-text text-transparent">
          Đăng Ký
        </h2>
        <p className="text-neutral-600 mt-2">Tạo tài khoản DevPool của bạn</p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 animate-pulse" />
          <span className="text-error-700 text-sm font-medium">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-4">
            Loại tài khoản
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setFormData(prev => ({ ...prev, role: 'Developer' }))}
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-103 ${formData.role === 'Developer'
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-indigo-50 shadow-glow-sm'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-soft'
                }`}
            >
              <User className={`w-8 h-8 mb-3 mx-auto transition-colors duration-300 ${formData.role === 'Developer' ? 'text-primary-600' : 'text-neutral-500'
                }`} />
              <div className="text-center">
                <h3 className="font-semibold text-neutral-900 mb-1">Nhân sự DevPool</h3>
                <p className="text-sm text-neutral-600">Tìm dự án phù hợp</p>
              </div>
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, role: 'Staff TA' }))}
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-103 ${formData.role === 'Staff TA'
                  ? 'border-secondary-500 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-glow-green'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-soft'
                }`}
            >
              <Building className={`w-8 h-8 mb-3 mx-auto transition-colors duration-300 ${formData.role === 'Staff TA' ? 'text-secondary-600' : 'text-neutral-500'
                }`} />
              <div className="text-center">
                <h3 className="font-semibold text-neutral-900 mb-1">Nhân Sự</h3>
                <p className="text-sm text-neutral-600">Quản lý nhân sự</p>
              </div>
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, role: 'Staff Accountant' }))}
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-103 ${formData.role === 'Staff Accountant'
                  ? 'border-secondary-500 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-glow-green'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-soft'
                }`}
            >
              <Building className={`w-8 h-8 mb-3 mx-auto transition-colors duration-300 ${formData.role === 'Staff Accountant' ? 'text-secondary-600' : 'text-neutral-500'
                }`} />
              <div className="text-center">
                <h3 className="font-semibold text-neutral-900 mb-1">Doanh Nghiệp</h3>
                <p className="text-sm text-neutral-600">Tuyển nhân sự DevPool</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${errors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                }`}
              placeholder="Nhập email của bạn"
              required
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-error-600 font-medium animate-slide-down">{errors.email}</p>
          )}
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
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${errors.password ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                }`}
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs space-x-2 animate-fade-in">
                <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordRequirements.length ? 'text-success-500' : 'text-neutral-300'}`} />
                <span className={`font-medium transition-colors duration-300 ${passwordRequirements.length ? 'text-success-600' : 'text-neutral-500'}`}>
                  Ít nhất 8 ký tự
                </span>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-2 text-sm text-error-600 font-medium animate-slide-down">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 ${errors.confirmPassword ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-neutral-300 focus:border-primary-500 hover:border-neutral-400'
                }`}
              placeholder="Nhập lại mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-300 p-1 rounded-lg hover:bg-primary-50"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-error-600 font-medium animate-slide-down">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div>
          <div className="relative z-10 flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 transition-all duration-300 mt-1"
            />
            <label htmlFor="terms" className="ml-3 text-sm text-neutral-600 font-medium">
              Tôi đồng ý với{' '}
              <a href="#" className="text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-300 hover:underline">
                Điều Khoản Sử Dụng
              </a>{' '}
              và{' '}
              <a href="#" className="text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-300 hover:underline">
                Chính Sách Bảo Mật
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="mt-2 text-sm text-error-600 font-medium animate-slide-down">{errors.terms}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-secondary-600 to-primary-600 text-white py-3.5 px-6 rounded-xl hover:from-secondary-700 hover:to-primary-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-green hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Đang xử lý...</span>
            </div>
          ) : (
            'Đăng Ký'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="relative z-10 mt-8 text-center">
        <span className="text-neutral-600">Đã có tài khoản? </span>
        <button
          onClick={onToggleForm}
          className="text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-300 hover:underline"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
}