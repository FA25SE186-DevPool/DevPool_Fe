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
  AlertCircle,
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
    selectedStatus,
    setSelectedStatus,
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
              { label: "Chỉnh sửa" },
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
                      value={formData.currentPartnerId || ""}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                        errors.currentPartnerId ? "border-red-500" : "border-neutral-200"
                      }`}
                    >
                      <option value="">-- Chọn công ty --</option>
                      {partners.map((partner) => (
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
                    errors.fullName ? "border-red-500" : ""
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
                      errors.email ? "border-red-500" : ""
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
                      errors.phone ? "border-red-500" : ""
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
                      errors.dateOfBirth ? "border-red-500" : ""
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
                        errors.workingMode ? "border-red-500" : "border-neutral-200"
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
                          changingStatus ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="Available">Sẵn sàng</option>
                        <option value="Busy">Đang bận</option>
                        <option value="Unavailable">Tạm ngưng</option>
                        <option value="Working" disabled={originalStatus !== "Working"}>
                          Đang làm việc
                        </option>
                        <option value="Applying" disabled={originalStatus !== "Applying"}>
                          Đang ứng tuyển
                        </option>
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
                      Trạng thái sẽ thay đổi từ "{getStatusLabel(originalStatus)}" sang "
                      {getStatusLabel(selectedStatus)}"
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
