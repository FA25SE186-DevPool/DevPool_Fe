import { useParams, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { WorkingMode } from "../../../constants/WORKING_MODE";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useTalentEdit } from "../../../hooks/useTalentEdit";
import PageLoader from "../../../components/common/PageLoader";
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
  Briefcase,
  Github,
  ExternalLink,
  Building2,
} from "lucide-react";

export default function TalentEditPage() {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    formData,
    errors,
    formError,
    locations,
    partners,
    originalStatus,
    originalPartnerId,
    selectedStatus,
    changingStatus,
    updateField,
    handleStatusChange,
    handleSubmit,
    getStatusLabel,
  } = useTalentEdit();

  // Handle change for select/input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numValue = name === "workingMode" || name === "locationId" || name === "currentPartnerId"
      ? Number(value) || undefined
      : value;
    updateField(name as keyof typeof formData, numValue);
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1">
          <PageLoader />
        </div>
      </div>
    );
  }

  const statusBadge = (() => {
    const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium";
    switch (originalStatus) {
      case "Available":
        return { className: `${base} bg-green-100 border-green-200 text-green-700`, label: "Sẵn sàng" };
      case "Unavailable":
        return { className: `${base} bg-gray-100 border-gray-200 text-gray-600`, label: "Tạm ngưng" };
      case "Busy":
        return { className: `${base} bg-yellow-100 border-yellow-200 text-yellow-800`, label: "Đang bận" };
      default:
        return { className: `${base} bg-neutral-100 border-neutral-200 text-neutral-700`, label: getStatusLabel(originalStatus) };
    }
  })();

  const isLockedByApplyingOrWorking = originalStatus === "Applying" || originalStatus === "Working";

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-6">
        {/* Header */}
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            {formError}
          </div>
        )}
        <div className="mb-6 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/talents" },
              { label: formData?.fullName || "Chi tiết nhân sự", to: `/ta/talents/${id}` },
              { label: "Chỉnh sửa" },
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Chỉnh sửa nhân sự</h1>
              <p className="text-neutral-600">
                Cập nhật thông tin nhân sự.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          {/* Block 1: Thông tin cơ bản */}
          <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
            <div className="p-5 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currentPartnerId"
                    value={formData.currentPartnerId || ""}
                    onChange={handleChange}
                    disabled={isLockedByApplyingOrWorking}
                    className={`w-full h-10 border rounded-xl px-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                      errors.currentPartnerId ? "border-red-500" : "border-neutral-200"
                    }`}
                    title={
                      isLockedByApplyingOrWorking
                        ? "Không thể đổi công ty khi nhân sự đang ở trạng thái Đang ứng tuyển/Đang làm việc."
                        : ""
                    }
                  >
                    <option value="">-- Chọn công ty --</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.currentPartnerId && <p className="mt-1 text-sm text-red-500">{errors.currentPartnerId}</p>}
                  {isLockedByApplyingOrWorking && typeof originalPartnerId === "number" ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      Nhân sự đang ở trạng thái <b>{getStatusLabel(originalStatus)}</b> nên không thể đổi công ty.
                    </p>
                  ) : null}
                </div>

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
                    className={`w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.fullName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                </div>

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
                    className={`w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.email ? "border-red-500" : ""
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Số điện thoại
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại..."
                    className={`w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.phone ? "border-red-500" : ""
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Thông tin cá nhân & nghề nghiệp */}
          <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
            <div className="p-5 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân & nghề nghiệp</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày sinh
                  </label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    className={`w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                      errors.dateOfBirth ? "border-red-500" : ""
                    }`}
                  />
                  {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Khu vực làm việc
                  </label>
                  <select
                    name="locationId"
                    value={formData.locationId || ""}
                    onChange={handleChange}
                    className={`w-full h-10 border rounded-xl px-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                      errors.locationId ? "border-red-500" : "border-neutral-200"
                    }`}
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {errors.locationId && <p className="mt-1 text-sm text-red-500">{errors.locationId}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Chế độ làm việc <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="workingMode"
                    value={formData.workingMode}
                    onChange={handleChange}
                    className={`w-full h-10 border rounded-xl px-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                      errors.workingMode ? "border-red-500" : "border-neutral-200"
                    }`}
                  >
                    <option value={WorkingMode.None}>Không xác định</option>
                    <option value={WorkingMode.Onsite}>Tại văn phòng</option>
                    <option value={WorkingMode.Remote}>Từ xa</option>
                    <option value={WorkingMode.Hybrid}>Kết hợp</option>
                    <option value={WorkingMode.Flexible}>Linh hoạt</option>
                  </select>
                  {errors.workingMode && <p className="mt-1 text-sm text-red-500">{errors.workingMode}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-gray-700 font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Trạng thái
                    </label>
                    <span className={statusBadge.className}>{statusBadge.label}</span>
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={changingStatus || isLockedByApplyingOrWorking}
                    className={`w-full h-10 border border-neutral-200 rounded-xl px-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                      changingStatus || isLockedByApplyingOrWorking ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title={
                      isLockedByApplyingOrWorking
                        ? "Không thể đổi trạng thái khi nhân sự đang ở trạng thái Đang ứng tuyển/Đang làm việc."
                        : ""
                    }
                  >
                    <option value="Available">Sẵn sàng</option>
                    <option value="Busy">Đang bận</option>
                    <option value="Unavailable">Tạm ngưng</option>
                  </select>
                  <p className="mt-1 text-xs text-neutral-500">
                    Trạng thái Working/Applying không chỉnh thủ công trên form này.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Liên kết */}
          <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
            <div className="p-5 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-warning-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Liên kết</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub URL
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      name="githubUrl"
                      value={formData.githubUrl || ""}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    />
                    {formData.githubUrl ? (
                      <a
                        href={formData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Xem
                      </a>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Portfolio URL
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl || ""}
                      onChange={handleChange}
                      placeholder="https://portfolio.example.com"
                      className="w-full h-10 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    />
                    {formData.portfolioUrl ? (
                      <a
                        href={formData.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Xem
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${id}`}
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
