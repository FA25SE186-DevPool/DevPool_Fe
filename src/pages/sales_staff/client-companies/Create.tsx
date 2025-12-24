import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  Save,
  AlertCircle,
  CheckCircle,
  Sparkles
} from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { clientCompanyService, type ClientCompanyPayload } from "../../../services/ClientCompany";

export default function ClientCompanyCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    code?: string;
    taxCode?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  }>({});
  const [form, setForm] = useState<ClientCompanyPayload>({
    code: "",
    name: "",
    taxCode: "",
    contactPerson: "",
    position: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "unique" | "duplicate">("idle");

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Chỉ cho phép số cho phone và taxCode
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setForm((prev) => ({ ...prev, [name]: digitsOnly }));
        // Clear error khi user đang nhập
        if (formErrors.phone) {
          setFormErrors((prev) => ({ ...prev, phone: undefined }));
        }
      }
      return;
    }

    if (name === "taxCode") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 13) {
        setForm((prev) => ({ ...prev, [name]: digitsOnly }));
        // Clear error khi user đang nhập
        if (formErrors.taxCode) {
          setFormErrors((prev) => ({ ...prev, taxCode: undefined }));
        }
      }
      return;
    }
    
    // Khi thay đổi tên công ty, tự động suggest code
    if (name === "name" && value.trim()) {
      handleSuggestCode(value);
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error khi user đang nhập
    if (name === "name" && formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: undefined }));
    }
    if (name === "code") {
      setCodeStatus("idle");
      if (formErrors.code) {
        setFormErrors((prev) => ({ ...prev, code: undefined }));
      }
    }
    if (name === "taxCode" && formErrors.taxCode) {
      setFormErrors((prev) => ({ ...prev, taxCode: undefined }));
    }
    if (name === "contactPerson" && formErrors.contactPerson) {
      setFormErrors((prev) => ({ ...prev, contactPerson: undefined }));
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
        setForm((prev) => ({ ...prev, code: result.suggestedCode }));
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

    try {
      setIsCheckingCode(true);
      setCodeStatus("checking");
      const result = await clientCompanyService.checkCodeUnique(code);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: { name?: string; code?: string; taxCode?: string; contactPerson?: string; email?: string; phone?: string } = {};
    
    // Validate tên công ty (bắt buộc)
    if (!form.name || form.name.trim() === "") {
      errors.name = "Tên công ty là bắt buộc";
    }
    
    // Validate code (bắt buộc)
    if (!form.code || form.code.trim() === "") {
      errors.code = "Mã công ty là bắt buộc";
    } else {
      // Kiểm tra code unique trước khi submit
      await handleCheckCodeUnique(form.code);
      if (codeStatus === "duplicate") {
        errors.code = "Mã công ty đã tồn tại";
      }
    }
    
    // Validate mã số thuế (bắt buộc)
    if (!form.taxCode || form.taxCode.trim() === "") {
      errors.taxCode = "Mã số thuế là bắt buộc";
    } else {
      // Validate độ dài mã số thuế (10 số hoặc 13 số)
      const taxCode = form.taxCode.trim();
      if (!/^\d+$/.test(taxCode)) {
        errors.taxCode = "Mã số thuế chỉ được chứa số";
      } else if (taxCode.length !== 10 && taxCode.length !== 13) {
        errors.taxCode = "Mã số thuế phải có 10 số hoặc 13 số";
      }
    }
    
    // Validate người đại diện (bắt buộc)
    if (!form.contactPerson || form.contactPerson.trim() === "") {
      errors.contactPerson = "Người đại diện là bắt buộc";
    }
    
    // Validate email (bắt buộc)
    if (!form.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!validateEmail(form.email)) {
      errors.email = "Email không hợp lệ";
    }
    
    // Validate phone (không bắt buộc nhưng nếu có thì phải đúng format)
    if (form.phone && !validatePhone(form.phone)) {
      errors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo công ty mới không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const createdCompany = await clientCompanyService.create(form);
      setSuccess(true);
      
      // Tự động gán template mặc định "Default Professional"
      try {
        // Lấy ID từ response (có thể là object hoặc có data wrapper)
        const companyId = createdCompany?.id || createdCompany?.data?.id || (createdCompany as any)?.data?.id;
        
        if (companyId) {
        } else {
          console.warn("⚠️ Không lấy được ID công ty vừa tạo");
        }
      } catch (templateErr) {
        console.error("❌ Lỗi khi gán template mặc định:", templateErr);
        // Không throw error để không ảnh hưởng đến việc tạo công ty
      }
      
      setTimeout(() => navigate("/sales/clients"), 1500);
    } catch (err) {
      console.error("❌ Lỗi tạo công ty:", err);
      setError("Không thể tạo công ty. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Công ty", to: "/sales/clients" },
              { label: "Tạo mới" }
            ]}
          />
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo công ty khách hàng mới</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm công ty khách hàng vào hệ thống
              </p>
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
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản <span className="text-red-500">*</span></h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tên công ty */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tên công ty
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên công ty..."
                  required
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
                    formErrors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-neutral-200 focus:border-primary-500"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Mã công ty */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Mã công ty
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      onBlur={() => form.code && handleCheckCodeUnique(form.code)}
                      placeholder="Nhập mã công ty..."
                      required
                      className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
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
                    onClick={() => form.name && handleSuggestCode(form.name)}
                    disabled={!form.name.trim() || isCheckingCode}
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
                  <input
                    name="taxCode"
                    value={form.taxCode}
                    onChange={handleChange}
                    placeholder="Nhập mã số thuế..."
                    maxLength={13}
                    required
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
                      formErrors.taxCode
                        ? "border-red-500 focus:border-red-500"
                        : "border-neutral-200 focus:border-primary-500"
                    }`}
                  />
                  {formErrors.taxCode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.taxCode}
                    </p>
                  )}
                </div>

                {/* Người liên hệ */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Người đại diện
                  </label>
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    placeholder="Nhập người đại diện..."
                    required
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
                      formErrors.contactPerson
                        ? "border-red-500 focus:border-red-500"
                        : "border-neutral-200 focus:border-primary-500"
                    }`}
                  />
                  {formErrors.contactPerson && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.contactPerson}
                    </p>
                  )}
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
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="Nhập chức vụ..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Nhập email..."
                    required
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
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
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại (10 chữ số)..."
                    maxLength={10}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white ${
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
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {(error || success) && (
            <div className="animate-fade-in">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    Tạo công ty thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo công ty
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}