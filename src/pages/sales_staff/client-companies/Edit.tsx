import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { clientCompanyService, type ClientCompany, type ClientCompanyPayload } from "../../../services/ClientCompany";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Briefcase, 
  AlertCircle,
} from "lucide-react";

export default function ClientCompanyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<ClientCompany | null>(null);
  const [formData, setFormData] = useState<ClientCompanyPayload>({
    code: "",
    name: "",
    taxCode: "",
    contactPerson: "",
    position: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<{
    code?: string;
    email?: string;
    phone?: string;
  }>({});

  // Success overlay state
  const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean; type: 'loading' | 'success'; message: string }>({
    show: false,
    type: 'loading',
    message: '',
  });

  // Helper functions for overlay

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


  // 🧭 Load dữ liệu công ty
  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await clientCompanyService.getById(Number(id));
        setCompany(data);
        setFormData({
          code: data.code,
          name: data.name,
          taxCode: data.taxCode ?? "",
          contactPerson: data.contactPerson,
          position: data.position ?? "",
          email: data.email,
          phone: data.phone ?? "",
          address: data.address ?? "",
        });
      } catch (err) {
        console.error("❌ Lỗi tải công ty:", err);
        alert("Không thể tải thông tin công ty!");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneDigits = phone.replace(/\D/g, ""); // Remove non-digits
    return phoneDigits.length === 10;
  };

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Chỉ cho phép số cho phone
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
        // Clear error khi user đang nhập
        if (formErrors.phone) {
          setFormErrors((prev) => ({ ...prev, phone: undefined }));
        }
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error khi user đang nhập
    if (name === "email" && formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // 💾 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validate form
    const errors: { code?: string; email?: string; phone?: string } = {};
    
    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Email không hợp lệ";
    }
    
    // Validate phone
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!formData.name.trim()) {
      alert("⚠️ Vui lòng nhập tên công ty!");
      return;
    }
    if (!formData.contactPerson.trim()) {
      alert("⚠️ Vui lòng nhập người đại diện!");
      return;
    }

    try {
      await clientCompanyService.update(Number(id), formData);
      showSuccessOverlay("Cập nhật công ty thành công!");
      navigate(`/sales/clients/${id}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật công ty:", err);
      alert("Không thể cập nhật công ty!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );

  if (!company)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy công ty</p>
            <Link 
              to="/sales/clients"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Công ty", to: "/sales/clients" },
              { label: company.name, to: `/sales/clients/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa công ty khách hàng</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin công ty khách hàng
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa thông tin công ty
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tên công ty */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên công ty..."
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                />
              </div>

              {/* Mã công ty */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Mã công ty
                </label>
                <Input
                  name="code"
                  value={formData.code}
                  disabled
                  readOnly
                  className="w-full rounded-xl bg-neutral-50 border-neutral-200 text-neutral-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mã số thuế */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Mã số thuế
                  </label>
                  <Input
                    name="taxCode"
                    value={formData.taxCode}
                    disabled
                    readOnly
                    className="w-full rounded-xl bg-neutral-50 border-neutral-200 text-neutral-600 cursor-not-allowed"
                  />
                </div>

                {/* Người liên hệ */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Người đại diện <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Nhập người đại diện..."
                    required
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Mail className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin liên hệ</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chức vụ */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Chức vụ
                  </label>
                  <Input
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Nhập chức vụ..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Nhập email..."
                    required
                    className={`w-full focus:ring-primary-500 rounded-xl ${
                      formErrors.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-neutral-200 focus:border-primary-500"
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Số điện thoại
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại (10 chữ số)..."
                    maxLength={10}
                    className={`w-full focus:ring-primary-500 rounded-xl ${
                      formErrors.phone
                        ? "border-red-500 focus:border-red-500"
                        : "border-neutral-200 focus:border-primary-500"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Địa chỉ
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/sales/clients/${id}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
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
