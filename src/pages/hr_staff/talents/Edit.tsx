import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/hr_staff/SidebarItems";
import { talentService, type TalentCreate, type TalentStatusUpdateModel } from "../../../services/Talent";
import { locationService, type Location } from "../../../services/location";
import { partnerService, type Partner } from "../../../services/Partner";
import { WorkingMode } from "../../../constants/WORKING_MODE";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Globe, 
  FileText, 
  AlertCircle,
  Briefcase,
  Github,
  ExternalLink,
  Building2
} from "lucide-react";

// Mapping WorkingMode values to Vietnamese names (for future use)
// const workingModeLabels: Record<number, string> = {
//   [WorkingMode.None]: "Không xác định",
//   [WorkingMode.Onsite]: "Tại văn phòng",
//   [WorkingMode.Remote]: "Làm việc từ xa",
//   [WorkingMode.Hybrid]: "Kết hợp",
//   [WorkingMode.Flexible]: "Linh hoạt",
// };

export default function TalentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [formData, setFormData] = useState<TalentCreate>({
    currentPartnerId: 1, // Default partner ID
    userId: null,
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    locationId: undefined,
    workingMode: WorkingMode.None,
    githubUrl: "",
    portfolioUrl: "",
    status: "Available",
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");
  const [originalStatus, setOriginalStatus] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [changingStatus, setChangingStatus] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateDateOfBirth = (date: string): boolean => {
    if (!date) return false;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18 && age - 1 <= 100;
    }
    return age >= 18 && age <= 100;
  };

  // 🧭 Load dữ liệu Talent
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentService.getById(Number(id));

        // Convert dateOfBirth from ISO string to YYYY-MM-DD format for date input
        let formattedDateOfBirth = "";
        if (data.dateOfBirth) {
          try {
            const date = new Date(data.dateOfBirth);
            if (!isNaN(date.getTime())) {
              // Format to YYYY-MM-DD
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDateOfBirth = `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error("Lỗi format ngày sinh:", e);
          }
        }

        const currentStatus = data.status || "Available";
        setFormData({
          currentPartnerId: data.currentPartnerId,
          userId: data.userId || null,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: formattedDateOfBirth,
          locationId: data.locationId,
          workingMode: data.workingMode,
          githubUrl: data.githubUrl || "",
          portfolioUrl: data.portfolioUrl || "",
          status: currentStatus,
        });
        setOriginalStatus(currentStatus);
        setSelectedStatus(currentStatus);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin nhân sự!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await locationService.getAll({ excludeDeleted: true });
        setLocations(locationsData);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách địa điểm:", err);
      }
    };
    fetchLocations();
  }, []);


  // 🧭 Load danh sách Partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const partnersData = await partnerService.getAll();
        setPartners(partnersData);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách công ty:", err);
      }
    };
    fetchPartners();
  }, []);

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };
    
    // Validate fullName
    if (name === 'fullName') {
      if (value && value.trim() !== '') {
        delete newErrors.fullName;
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
    
    // Validate date of birth
    if (name === 'dateOfBirth') {
      if (value && validateDateOfBirth(value)) {
        delete newErrors.dateOfBirth;
      } else if (value && !validateDateOfBirth(value)) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
      }
    }
    
    // Validate workingMode
    if (name === 'workingMode') {
      const numValue = Number(value);
      if (numValue && numValue !== 0 && numValue !== WorkingMode.None) {
        delete newErrors.workingMode;
      }
    }
    
    // Validate locationId
    if (name === 'locationId') {
      const numValue = Number(value);
      if (numValue && numValue > 0) {
        delete newErrors.locationId;
      }
    }
    
    // Validate currentPartnerId
    if (name === 'currentPartnerId') {
      const numValue = Number(value);
      if (numValue && numValue > 0) {
        delete newErrors.currentPartnerId;
      }
    }
    
    setErrors(newErrors);

    setFormData((prev) => ({
      ...prev,
      [name]: name === "workingMode" || name === "locationId" || name === "currentPartnerId"
        ? Number(value) || undefined
        : value,
    }));
  };

  // 🔄 Thay đổi trạng thái
  const handleStatusChange = async () => {
    if (!id) return;
    
    if (selectedStatus === originalStatus) {
      alert("Trạng thái không thay đổi!");
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc chắn muốn thay đổi trạng thái từ "${getStatusLabel(originalStatus)}" sang "${getStatusLabel(selectedStatus)}"?`);
    if (!confirmed) {
      setSelectedStatus(originalStatus);
      return;
    }

    try {
      setChangingStatus(true);
      const statusPayload: TalentStatusUpdateModel = {
        newStatus: selectedStatus,
      };
      await talentService.changeStatus(Number(id), statusPayload);
      
      // Cập nhật trạng thái trong formData và originalStatus
      setFormData(prev => ({ ...prev, status: selectedStatus }));
      setOriginalStatus(selectedStatus);
      
      alert("✅ Thay đổi trạng thái thành công!");
    } catch (statusErr: any) {
      console.error("❌ Lỗi khi thay đổi trạng thái:", statusErr);
      const statusErrorMsg = statusErr?.response?.data?.message || statusErr?.message || "Không thể thay đổi trạng thái";
      alert(`❌ ${statusErrorMsg}`);
      setSelectedStatus(originalStatus);
    } finally {
      setChangingStatus(false);
    }
  };

  // 📝 Lấy nhãn trạng thái
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      "Available": "Sẵn sàng",
      "Busy": "Đang bận",
      "Unavailable": "Tạm ngưng",
      "Working": "Đang làm việc",
      "Applying": "Đang ứng tuyển",
    };
    return statusLabels[status] || status;
  };

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    // Validate all required fields
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName || formData.fullName.trim() === '') {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }
    
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
    }
    
    if (!formData.dateOfBirth || !validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
    }
    
    if (formData.workingMode === undefined || (formData.workingMode as number) === 0) {
      newErrors.workingMode = 'Vui lòng chọn chế độ làm việc';
    }
    
    if (!formData.locationId) {
      newErrors.locationId = 'Vui lòng chọn khu vực làm việc';
    }
    
    if (!formData.currentPartnerId) {
      newErrors.currentPartnerId = 'Vui lòng chọn đối tác';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorMessages = Object.values(newErrors);
      alert('⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc\n\n' + errorMessages.join('\n'));
      return;
    }

    try {
      // Format dateOfBirth to UTC ISO string if it exists
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth 
          ? new Date(formData.dateOfBirth + 'T00:00:00.000Z').toISOString()
          : undefined
      };
      
      console.log("Payload gửi đi:", payload);
      await talentService.update(Number(id), payload);

      alert("✅ Cập nhật nhân sự thành công!");
      navigate(`/ta/developers/${id}`);
    } catch (err: any) {
      console.error("❌ Lỗi khi cập nhật:", err);
      const data = err?.response?.data;
      let combined = "";
      if (typeof data === "string") {
        combined = data;
      } else if (data && typeof data === "object") {
        try {
          const candidates: string[] = [];
          const tryPush = (v: unknown) => {
            if (typeof v === "string" && v) candidates.push(v);
          };
          tryPush((data as any).error);
          tryPush((data as any).message);
          tryPush((data as any).objecterror);
          tryPush((data as any).Objecterror);
          tryPush((data as any).detail);
          tryPush((data as any).title);
          const values = Object.values(data)
            .map((v) => (typeof v === "string" ? v : ""))
            .filter(Boolean);
          candidates.push(...values);
          combined = candidates.join(" ");
          if (!combined) combined = JSON.stringify(data);
        } catch {
          combined = JSON.stringify(data);
        }
      }
      const lower = (combined || err?.message || "").toLowerCase();
      if (lower.includes("email already exists") || (lower.includes("already exists") && lower.includes("email"))) {
        setErrors(prev => ({ ...prev, email: "Email đã tồn tại trong hệ thống" }));
        setFormError("Email đã tồn tại trong hệ thống");
        alert("❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.");
        return;
      }
      alert("Không thể cập nhật nhân sự!");
    }
  };

  if (loading)
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            {formError}
          </div>
        )}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/developers" },
              { label: formData?.fullName || "Chi tiết nhân sự", to: `/ta/developers/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin nhân sự trong hệ thống DevPool
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa thông tin nhân sự
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
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Công ty */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="currentPartnerId"
                      value={formData.currentPartnerId}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                        errors.currentPartnerId ? 'border-red-500' : 'border-neutral-200'
                      }`}
                    >
                      <option value="">-- Chọn công ty --</option>
                      {partners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.currentPartnerId && (
                    <p className="mt-1 text-sm text-red-500">{errors.currentPartnerId}</p>
                  )}
                </div>

                {/* Người dùng */}
                {/* <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Người dùng
                  </label>
                  <div className="relative">
                    <select
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    >
                      <option value="">-- Chọn người dùng --</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div> */}
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName || ""}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên..."
                  required
                  className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                    errors.fullName ? 'border-red-500' : ''
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="Nhập email..."
                    required
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại..."
                    required
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ngày sinh */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.dateOfBirth ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Khu vực */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Khu vực làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="locationId"
                      value={formData.locationId || ""}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                        errors.locationId ? 'border-red-500' : 'border-neutral-200'
                      }`}
                    >
                      <option value="">-- Chọn khu vực --</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.locationId && (
                    <p className="mt-1 text-sm text-red-500">{errors.locationId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-accent-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin nghề nghiệp</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chế độ làm việc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Chế độ làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="workingMode"
                      value={formData.workingMode}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                        errors.workingMode ? 'border-red-500' : 'border-neutral-200'
                      }`}
                    >
                      <option value={WorkingMode.None}>Không xác định</option>
                      <option value={WorkingMode.Onsite}>Tại văn phòng</option>
                      <option value={WorkingMode.Remote}>Từ xa</option>
                      <option value={WorkingMode.Hybrid}>Kết hợp</option>
                      <option value={WorkingMode.Flexible}>Linh hoạt</option>
                    </select>
                  </div>
                  {errors.workingMode && (
                    <p className="mt-1 text-sm text-red-500">{errors.workingMode}</p>
                  )}
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Trạng thái
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={changingStatus}
                        className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                          changingStatus ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="Available">Sẵn sàng</option>
                        <option value="Busy">Đang bận</option>
                        <option value="Unavailable">Tạm ngưng</option>
                        <option value="Working" disabled={originalStatus !== "Working"}>Đang làm việc</option>
                        <option value="Applying" disabled={originalStatus !== "Applying"}>Đang ứng tuyển</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleStatusChange}
                      disabled={changingStatus || selectedStatus === originalStatus}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        changingStatus || selectedStatus === originalStatus
                          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-soft hover:shadow-glow transform hover:scale-105"
                      }`}
                    >
                      {changingStatus ? "Đang xử lý..." : "Thay đổi"}
                    </Button>
                  </div>
                  {selectedStatus !== originalStatus && (
                    <p className="mt-1 text-xs text-yellow-600">
                      Trạng thái sẽ thay đổi từ "{getStatusLabel(originalStatus)}" sang "{getStatusLabel(selectedStatus)}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-warning-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Liên kết portfolio</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub URL
                  </label>
                  <Input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl || ""}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>

                {/* Portfolio */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Portfolio URL
                  </label>
                  <Input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl || ""}
                    onChange={handleChange}
                    placeholder="https://portfolio.example.com"
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/developers/${id}`}
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