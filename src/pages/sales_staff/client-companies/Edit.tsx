import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { clientCompanyService, type ClientCompany, type ClientCompanyPayload } from "../../../services/ClientCompany";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft, 
  Save, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Briefcase, 
  AlertCircle,
  Sparkles,
  CheckCircle,
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
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "unique" | "duplicate">("idle");

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
    
    // Khi thay đổi tên công ty, tự động suggest code
    if (name === "name" && value.trim()) {
      handleSuggestCode(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error khi user đang nhập
    if (name === "code") {
      setCodeStatus("idle");
      if (formErrors.code) {
        setFormErrors((prev) => ({ ...prev, code: undefined }));
      }
    }
    if (name === "email" && formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSuggestCode = async (companyName: string) => {
    if (!companyName.trim()) return;
    
    try {
      const result = await clientCompanyService.suggestCode(companyName);
      if (result.success && result.suggestedCode) {
        setFormData((prev) => ({ ...prev, code: result.suggestedCode }));
        setCodeStatus("idle");
      }
    } catch (err) {
      console.error("❌ Lỗi khi gợi ý code:", err);
    }
  };

  const handleCheckCodeUnique = async (code: string) => {
    if (!code.trim()) {
      setCodeStatus("idle");
      return;
    }

    if (!id) return;

    try {
      setIsCheckingCode(true);
      setCodeStatus("checking");
      const result = await clientCompanyService.checkCodeUnique(code, Number(id));
      if (result.success) {
        setCodeStatus(result.isUnique ? "unique" : "duplicate");
        if (!result.isUnique) {
          setFormErrors((prev) => ({ ...prev, code: "Mã công ty đã tồn tại" }));
        } else {
          setFormErrors((prev) => ({ ...prev, code: undefined }));
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi kiểm tra code:", err);
      setCodeStatus("idle");
    } finally {
      setIsCheckingCode(false);
    }
  };

  // 💾 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validate form
    const errors: { code?: string; email?: string; phone?: string } = {};
    
    // Validate code (bắt buộc)
    if (!formData.code || formData.code.trim() === "") {
      errors.code = "Mã công ty là bắt buộc";
    } else {
      // Kiểm tra code unique trước khi submit
      await handleCheckCodeUnique(formData.code);
      if (codeStatus === "duplicate") {
        errors.code = "Mã công ty đã tồn tại";
      }
    }
    
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
      alert("✅ Cập nhật công ty thành công!");
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
              { label: "Công ty khách hàng", to: "/sales/clients" },
              { label: company.name, to: `/sales/clients/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to={`/sales/clients/${id}`}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại chi tiết</span>
            </Link>
          </div>

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
                  Mã công ty <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      onBlur={() => formData.code && handleCheckCodeUnique(formData.code)}
                      placeholder="Nhập mã công ty..."
                      required
                      className={`w-full rounded-xl ${
                        formErrors.code || codeStatus === "duplicate"
                          ? "border-red-500 focus:border-red-500"
                          : codeStatus === "unique"
                          ? "border-green-500 focus:border-green-500"
                          : "border-neutral-200 focus:border-primary-500"
                      }`}
                    />
                    {codeStatus === "checking" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {codeStatus === "unique" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {codeStatus === "duplicate" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => formData.name && handleSuggestCode(formData.name)}
                    disabled={!formData.name.trim() || isCheckingCode}
                    className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl border border-primary-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Gợi ý mã từ tên công ty"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Gợi ý</span>
                  </button>
                </div>
                {formErrors.code && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.code}
                  </p>
                )}
                {codeStatus === "unique" && !formErrors.code && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Mã công ty hợp lệ
                  </p>
                )}
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
                    onChange={handleChange}
                    placeholder="Nhập mã số thuế..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
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
    </div>
  );
}
