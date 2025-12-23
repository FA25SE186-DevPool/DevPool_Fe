import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { partnerService, type Partner, type PartnerPayload, PartnerType } from "../../../services/Partner";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  FileText,
  AlertCircle,
} from "lucide-react";
import { ROUTES } from "../../../router/routes";

export default function PartnerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState<PartnerPayload>({
    code: "",
    partnerType: PartnerType.Partner,
    companyName: "",
    taxCode: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  // 🧭 Load dữ liệu đối tác
  useEffect(() => {
    const fetchPartner = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await partnerService.getAll();
        const partnersArray = ensureArray<Partner>(data);
        const foundPartner = partnersArray.find((p: Partner) => p.id === Number(id));
        if (foundPartner) {
          setPartner(foundPartner);
          setFormData({
            code: foundPartner.code ?? "",
            partnerType: foundPartner.partnerType ?? PartnerType.Partner,
            companyName: foundPartner.companyName,
            taxCode: foundPartner.taxCode ?? "",
            contactPerson: foundPartner.contactPerson ?? "",
            email: foundPartner.email ?? "",
            phone: foundPartner.phone ?? "",
            address: foundPartner.address ?? "",
          });
        }
      } catch (err) {
        console.error("❌ Lỗi tải đối tác:", err);
        alert("Không thể tải thông tin đối tác!");
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [id]);

  // Validate tax code format
  const validateTaxCode = (taxCode: string): boolean => {
    const cleanedTaxCode = taxCode.replace(/\D/g, '');
    return cleanedTaxCode.length === 10 || cleanedTaxCode.length === 13;
  };

  // Check duplicate tax code (excluding current partner)
  const checkDuplicateTaxCode = async (taxCode: string): Promise<boolean> => {
    try {
      const data = await partnerService.getAll();
      const partners = ensureArray<Partner>(data);
      const cleanedTaxCode = taxCode.replace(/\D/g, '');
      return partners.some((p: Partner) => {
        // Exclude current partner
        if (id && p.id === Number(id)) return false;
        const partnerTaxCode = p.taxCode?.replace(/\D/g, '') || '';
        return partnerTaxCode === cleanedTaxCode;
      });
    } catch (error) {
      console.error('Error checking duplicate tax code:', error);
      return false;
    }
  };

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    // Validate code
    if (name === 'code') {
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
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        // Validate với giá trị đã lọc
        if (numericValue && numericValue.trim() !== '') {
          if (validateTaxCode(numericValue)) {
            delete newErrors.taxCode;
          } else {
            newErrors.taxCode = 'Mã số thuế phải có đúng 10 hoặc 13 chữ số';
          }
        } else {
          delete newErrors.taxCode;
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
      } else {
        delete newErrors.taxCode;
      }
    }

    setErrors(newErrors);
    
    // Handle partnerType separately (it's a number)
    if (name === 'partnerType') {
      setFormData(prev => ({ ...prev, [name]: Number(value) as PartnerType }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 💾 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = "Mã đối tác là bắt buộc";
    } else if (formData.code.length > 50) {
      newErrors.code = "Mã đối tác không được vượt quá 50 ký tự";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Tên công ty là bắt buộc";
    }

    // Validate tax code if provided
    if (formData.taxCode && formData.taxCode.trim() !== '') {
      if (!validateTaxCode(formData.taxCode)) {
        newErrors.taxCode = 'Mã số thuế phải có đúng 10 hoặc 13 chữ số';
      } else {
        // Check duplicate
        const isDuplicate = await checkDuplicateTaxCode(formData.taxCode);
        if (isDuplicate) {
          newErrors.taxCode = 'Mã số thuế đã tồn tại trong hệ thống';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc");
      return;
    }

    try {
      await partnerService.update(Number(id), formData);
      showSuccessOverlay("Cập nhật đối tác thành công!");
      navigate(`${ROUTES.TA_STAFF.PARTNERS.LIST}/${id}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật đối tác:", err);
      alert("Không thể cập nhật đối tác!");
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy đối tác</p>
            <Link 
              to={ROUTES.TA_STAFF.PARTNERS.LIST}
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Đối tác", to: ROUTES.TA_STAFF.PARTNERS.LIST },
              { label: partner ? partner.companyName || "Chi tiết đối tác" : "Chi tiết đối tác", to: `${ROUTES.TA_STAFF.PARTNERS.LIST}/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa đối tác</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin đối tác trong hệ thống DevPool
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa thông tin đối tác
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
              {/* Grid: Mã đối tác + Loại đối tác */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mã đối tác <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="VD: KMS, FPT, VNG"
                    required
                    disabled={isEditMode}
                    title={isEditMode ? "Mã đối tác bị khóa, không thể chỉnh sửa khi đang ở chế độ cập nhật." : undefined}
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${errors.code ? 'border-red-500 focus:border-red-500' : ''} ${isEditMode ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : ''}`}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-500">{errors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Loại đối tác <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="partnerType"
                    value={formData.partnerType}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value={PartnerType.OwnCompany}>Công ty mình</option>
                    <option value={PartnerType.Partner}>Đối tác</option>
                    <option value={PartnerType.Individual}>Cá nhân/Freelancer</option>
                  </select>
                </div>
              </div>

              {/* Tên công ty */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <Input
            name="companyName"
                  value={formData.companyName}
            onChange={handleChange}
                  placeholder="Nhập tên công ty..."
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
          />
        </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mã số thuế */}
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mã số thuế
                  </label>
                  <Input
            name="taxCode"
                    value={formData.taxCode}
            onChange={handleChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Nhập mã số thuế (10 hoặc 13 chữ số)..."
                    disabled={isEditMode}
                    title={isEditMode ? "Mã số thuế bị khóa, không thể chỉnh sửa khi đang ở chế độ cập nhật." : undefined}
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${errors.taxCode ? 'border-red-500 focus:border-red-500' : ''} ${isEditMode ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : ''}`}
          />
                  {errors.taxCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.taxCode}</p>
                  )}
        </div>

                {/* Người đại diện */}
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Người đại diện
                  </label>
                  <Input
            name="contactPerson"
                    value={formData.contactPerson}
            onChange={handleChange}
                    placeholder="Nhập người đại diện..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
          />
        </div>

                {/* Email */}
        <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <Input
            name="email"
            type="email"
                    value={formData.email}
            onChange={handleChange}
                    placeholder="Nhập email..."
                    disabled={isEditMode}
                    title={isEditMode ? "Email bị khóa, không thể chỉnh sửa khi đang ở chế độ cập nhật." : undefined}
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${isEditMode ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : ''}`}
          />
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
                    placeholder="Nhập số điện thoại..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
          />
                </div>
        </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Địa chỉ
                </label>
          <textarea
            name="address"
                  value={formData.address}
            onChange={handleChange}
            rows={3}
                  placeholder="Nhập địa chỉ..."
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 resize-none"
          />
              </div>
        </div>
      </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              to={`${ROUTES.TA_STAFF.PARTNERS.LIST}/${id}`}
              className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 font-medium transition-all duration-300"
            >
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
