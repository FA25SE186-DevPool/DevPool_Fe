import { useState } from 'react';
import { User, Mail, Phone, Shield } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/admin';
import { authService, type UserProvisionPayload } from '../../../services/Auth';
import { useNavigate } from 'react-router-dom';


export default function CreateAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success overlay state
  const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean; type: 'loading' | 'success'; message: string }>({
    show: false,
    type: 'loading',
    message: '',
  });

  const showSuccessOverlay = (message: string) => {
    setLoadingOverlay({
      show: true,
      type: 'success',
      message,
    });
    // Auto hide after 2 seconds
    setTimeout(() => {
      setLoadingOverlay({ show: false, type: 'loading', message: '' });
    }, 2000);
  };
  
  // Available roles for display (FE)
  const availableRoles = [
    { label: 'Manager', value: 'Manager' },
    { label: 'TA', value: 'TA' },
    { label: 'Sales', value: 'Sale' },
    { label: 'Accountant', value: 'Accountant' }
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'TA'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Xác nhận trước khi tạo tài khoản
      const confirmed = window.confirm(
        `Bạn có chắc muốn tạo tài khoản cho:\n\n- Họ tên: ${formData.fullName}\n- Email: ${formData.email}\n- Vai trò: ${formData.role}\n\nMật khẩu sẽ được tạo tự động và gửi qua email này.`
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }

      // Map role từ FE display name sang BE role string
      // Backend register API nhận role là string (ví dụ: "TA", "Manager", "Sale", "Accountant")
      const roleString = formData.role; // Giữ nguyên string từ form

      const payload: UserProvisionPayload = {
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || null, // Backend nhận string? (optional)
        role: roleString // Gửi role là string (ví dụ: "TA", "Manager", "Sale", "Accountant")
      };

      const response = await authService.adminProvision(payload);
      
      // Hiển thị thông báo thành công với password được generate
      showSuccessOverlay(`✅ Tạo tài khoản thành công!\n\nEmail: ${response.email}\nMật khẩu: ${response.password}\n\nMật khẩu đã được gửi qua email.`);
      
      // Success - redirect to user list
      navigate('/admin/users');
    } catch (err: unknown) {
      console.error("❌ Lỗi khi tạo người dùng:", err);
      // Hiển thị chi tiết lỗi từ backend nếu có
      let errorMessage = "Không thể tạo người dùng. Vui lòng thử lại.";
      if (err && typeof err === 'object') {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      
      <div className="flex-1 min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl mb-4 shadow-glow-green animate-float">
              <User className="text-white font-bold text-2xl" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Tạo Tài Khoản
            </h1>
            <p className="text-neutral-600 mt-2">Cung cấp tài khoản mới trong hệ thống</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-8 border border-neutral-200/50 animate-fade-in-up">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 text-red-600">⚠️</div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Họ và tên */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Họ và tên
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 border-neutral-300 focus:border-primary-500 hover:border-neutral-400"
                    placeholder="Nhập họ và tên"
                  />
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
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 border-neutral-300 focus:border-primary-500 hover:border-neutral-400"
                    placeholder="example@devpool.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 placeholder-neutral-500 border-neutral-300 focus:border-primary-500 hover:border-neutral-400"
                      placeholder="0123456789"
                    />
                  </div>
                </div>

                <p className="text-xs text-neutral-500 mt-2">
                  Mật khẩu sẽ được tự động tạo và gửi qua email
                </p>
              {/* Vai trò */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Vai trò
                </label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-primary-500" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:shadow-soft text-neutral-900 border-neutral-300 focus:border-primary-500 hover:border-neutral-400"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Vai trò sẽ xác định quyền truy cập và chức năng của người dùng trong hệ thống
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    'Tạo tài khoản'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Loading/Success Overlay ở giữa màn hình */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[350px] max-w-[500px]">
            {loadingOverlay.type === 'loading' ? (
              <>
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-700 mb-2">Đang xử lý...</p>
                  <p className="text-neutral-600">{loadingOverlay.message}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-success-200 border-t-success-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-success-700 mb-2">Thành công!</p>
                  <p className="text-neutral-600 whitespace-pre-line">{loadingOverlay.message}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}