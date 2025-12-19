import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, User, FileText, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/ta_staff';
import { partnerService, type Partner, type PartnerPayload, PartnerType } from '../../../services/Partner';
import { ROUTES } from '../../../router/routes';

export default function CreatePartner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PartnerPayload>({
    code: '',
    partnerType: PartnerType.Partner,
    companyName: '',
    taxCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "unique" | "duplicate">("idle");

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateTaxCode = (taxCode: string): boolean => {
    const cleanedTaxCode = taxCode.replace(/\D/g, '');
    return cleanedTaxCode.length === 10 || cleanedTaxCode.length === 13;
  };

  const checkDuplicateTaxCode = async (taxCode: string): Promise<boolean> => {
    try {
      const partnersData = await partnerService.getAll();
      // Ensure data is an array - handle PagedResult with Items/items or direct array
      let partnersArray: Partner[] = [];
      if (Array.isArray(partnersData)) {
        partnersArray = partnersData;
      } else if (partnersData && typeof partnersData === "object") {
        const obj = partnersData as { Items?: unknown; items?: unknown; data?: unknown };
        if (Array.isArray(obj.Items)) partnersArray = obj.Items as Partner[];
        else if (Array.isArray(obj.items)) partnersArray = obj.items as Partner[];
        else if (Array.isArray(obj.data)) partnersArray = obj.data as Partner[];
      }
      const cleanedTaxCode = taxCode.replace(/\D/g, '');
      return partnersArray.some((partner: Partner) => {
        const partnerTaxCode = partner.taxCode?.replace(/\D/g, '') || '';
        return partnerTaxCode === cleanedTaxCode;
      });
    } catch (error) {
      console.error('Error checking duplicate tax code:', error);
      return false;
    }
  };

  // Suggest code from company name using API
  const handleSuggestCode = async (companyName: string) => {
    if (!companyName.trim()) return;
    
    try {
      const result = await partnerService.suggestCode(companyName);
      if (result.success && result.suggestedCode) {
        setFormData((prev) => ({ ...prev, code: result.suggestedCode || '' }));
        setCodeStatus("idle");
        // Clear code error if exists
        if (errors.code) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.code;
            return newErrors;
          });
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi gợi ý code:", err);
    }
  };

  // Check if code is unique using API
  const handleCheckCodeUnique = async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      setCodeStatus("idle");
      return true;
    }

    try {
      setIsCheckingCode(true);
      setCodeStatus("checking");
      const result = await partnerService.checkCodeUnique(code);
      if (result.success) {
        const isUnique = result.isUnique ?? false;
        setCodeStatus(isUnique ? "unique" : "duplicate");
        if (!isUnique) {
          setErrors((prev) => ({ ...prev, code: "Mã đối tác đã tồn tại" }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.code;
            return newErrors;
          });
        }
        return isUnique;
      }
      return false;
    } catch (err) {
      console.error("❌ Lỗi khi kiểm tra code:", err);
      setCodeStatus("idle");
      return false;
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    // Validate companyName and auto-suggest code
    if (name === 'companyName') {
      if (value && value.trim() !== '') {
        delete newErrors.companyName;
        // Tự động suggest code khi nhập tên công ty
        handleSuggestCode(value);
      }
    }

    // Validate code
    if (name === 'code') {
      setCodeStatus("idle");
      if (value && value.trim() !== '') {
        if (value.length > 50) {
          newErrors.code = 'Mã đối tác không được vượt quá 50 ký tự';
        } else {
          delete newErrors.code;
        }
      } else {
        newErrors.code = 'Mã đối tác là bắt buộc';
      }
    }

    // Validate taxCode - chỉ cho phép nhập số
    if (name === 'taxCode') {
      // Chỉ lấy số, loại bỏ tất cả ký tự khác
      const numericValue = value.replace(/\D/g, '');
      if (numericValue !== value) {
        // Nếu có ký tự không phải số, cập nhật giá trị chỉ với số
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
        // Validate với giá trị đã lọc
        if (numericValue && numericValue.trim() !== '') {
          if (validateTaxCode(numericValue)) {
            delete newErrors.taxCode;
          } else {
            newErrors.taxCode = 'Mã số thuế phải có đúng 10 hoặc 13 chữ số';
          }
        }
        setErrors(newErrors);
        return;
      }
      // Nếu chỉ có số, validate bình thường
      if (value && value.trim() !== '') {
        if (validateTaxCode(value)) {
          delete newErrors.taxCode;
        } else {
          newErrors.taxCode = 'Mã số thuế phải có đúng 10 hoặc 13 chữ số';
        }
      }
    }

    // Validate contactPerson
    if (name === 'contactPerson') {
      if (value && value.trim() !== '') {
        delete newErrors.contactPerson;
      }
    }

    // Validate email
    if (name === 'email') {
      if (value && validateEmail(value)) {
        delete newErrors.email;
      } else if (value && !validateEmail(value)) {
        newErrors.email = 'Email không hợp lệ';
      }
    }

    // Validate phone
    if (name === 'phone') {
      if (value && validatePhone(value)) {
        delete newErrors.phone;
      } else if (value && !validatePhone(value)) {
        newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
      }
    }

    setErrors(newErrors);
    
    // Handle partnerType separately (it's a number)
    if (name === 'partnerType') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) as PartnerType }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const newErrors: Record<string, string> = {};

    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = 'Mã đối tác là bắt buộc';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Mã đối tác không được vượt quá 50 ký tự';
    } else {
      // Check code unique before submit
      const isCodeUnique = await handleCheckCodeUnique(formData.code);
      if (!isCodeUnique) {
        newErrors.code = "Mã đối tác đã tồn tại";
      }
    }

    if (!formData.companyName || formData.companyName.trim() === '') {
      newErrors.companyName = 'Tên công ty là bắt buộc';
    }

    if (!formData.taxCode || formData.taxCode.trim() === '') {
      newErrors.taxCode = 'Mã số thuế là bắt buộc';
    } else if (!validateTaxCode(formData.taxCode)) {
      newErrors.taxCode = 'Mã số thuế phải có đúng 10 hoặc 13 chữ số';
    }

    if (!formData.contactPerson || formData.contactPerson.trim() === '') {
      newErrors.contactPerson = 'Người đại diện là bắt buộc';
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
    }

    // Check duplicate tax code if tax code is valid
    if (!newErrors.taxCode && formData.taxCode) {
      const isDuplicate = await checkDuplicateTaxCode(formData.taxCode);
      if (isDuplicate) {
        newErrors.taxCode = 'Mã số thuế đã tồn tại trong hệ thống';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc');
      return;
    }
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo đối tác mới không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    try {
      await partnerService.create(formData);
      showSuccessOverlay('✅ Tạo đối tác thành công!');
      navigate(ROUTES.TA_STAFF.PARTNERS.LIST);
    } catch (error) {
      console.error(error);
      alert('❌ Lỗi khi tạo đối tác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl mb-4 shadow-glow-green animate-float">
              <Building2 className="text-white font-bold text-2xl" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Tạo Đối Tác Mới
            </h1>
            <p className="text-neutral-600 mt-2">Thêm công ty đối tác mới vào hệ thống DevPool</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-8 border border-neutral-200/50 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tên công ty */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.companyName ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}`}
                    placeholder="Tên công ty đối tác"
                  />
                </div>
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>

              {/* Grid: Mã đối tác + Loại đối tác */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Mã đối tác <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative group">
                      <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        onBlur={() => formData.code && handleCheckCodeUnique(formData.code)}
                        required
                        maxLength={50}
                        className={`w-full pl-12 pr-12 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${
                          errors.code || codeStatus === "duplicate"
                            ? 'border-red-500 focus:border-red-500'
                            : codeStatus === "unique"
                            ? 'border-green-500 focus:border-green-500'
                            : 'border-neutral-300 focus:border-primary-500'
                        }`}
                        placeholder="VD: KMS, FPT, VNG"
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
                      onClick={() => formData.companyName && handleSuggestCode(formData.companyName)}
                      disabled={!formData.companyName.trim() || isCheckingCode}
                      className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl border border-primary-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Gợi ý mã từ tên công ty"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Gợi ý</span>
                    </button>
                  </div>
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.code}
                    </p>
                  )}
                  {codeStatus === "unique" && !errors.code && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Mã đối tác hợp lệ
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    Mã duy nhất cho đối tác (tối đa 50 ký tự). Hệ thống tự động gợi ý từ tên công ty hoặc nhấn nút "Gợi ý" để tạo lại.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Loại đối tác <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500 pointer-events-none" />
                    <select
                      name="partnerType"
                      value={formData.partnerType}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all border-neutral-300 focus:border-primary-500 appearance-none"
                    >
                      <option value={PartnerType.OwnCompany}>Công ty mình</option>
                      <option value={PartnerType.Partner}>Đối tác</option>
                      <option value={PartnerType.Individual}>Cá nhân/Freelancer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid: Mã số thuế + Người đại diện */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Mã số thuế <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                    <input
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.taxCode ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}`}
                      placeholder="Nhập mã số thuế (10 hoặc 13 chữ số)"
                    />
                  </div>
                  {errors.taxCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.taxCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Người đại diện <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.contactPerson ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}`}
                      placeholder="Tên người đại diện"
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="mt-1 text-sm text-red-500">{errors.contactPerson}</p>
                  )}
                </div>
              </div>

              {/* Grid: Email + Số điện thoại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}`}
                      placeholder="example@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}`}
                      placeholder="0123456789"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Địa chỉ
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft border-neutral-300 focus:border-primary-500 transition-all"
                    placeholder="Số nhà, đường, quận, thành phố"
                  />
                </div>
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
                      <span>Đang tạo...</span>
                    </div>
                  ) : (
                    'Tạo đối tác'
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
