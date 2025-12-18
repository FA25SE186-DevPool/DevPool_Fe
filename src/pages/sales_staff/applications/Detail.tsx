import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { type TalentApplicationDetailed } from "../../../services/TalentApplication";
import {
  FileText,
  User as UserIcon,
  Calendar,
  Briefcase,
  Building2,
  MapPin,
  Target,
  Users,
  FileCheck,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

export default function SalesApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<TalentApplicationDetailed | null>(null);
  const [jobRequest, setJobRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "job" | "activities">("profile");
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [isTalentPopupOpen, setIsTalentPopupOpen] = useState(false);
  const [isProcessStepsPopupOpen, setIsProcessStepsPopupOpen] = useState(false);

  const openTalentPopup = () => setIsTalentPopupOpen(true);
  const closeTalentPopup = () => setIsTalentPopupOpen(false);
  const openProcessStepsPopup = () => setIsProcessStepsPopupOpen(true);
  const closeProcessStepsPopup = () => setIsProcessStepsPopupOpen(false);

  const display = useMemo(() => {
    if (!application || !jobRequest) return null;
    return {
      jobRoleLevelName: "Developer",
      budgetPerMonth: 15000000,
      workingMode: 1,
      location: "Hà Nội",
      applyProcessTemplateName: "Standard Process",
      quantity: 2,
      clientCompany: { name: "ABC Corp" },
      project: { name: "Project X" },
    };
  }, [application, jobRequest]);

  // Mock talent data for popup
  const mockTalent = {
    fullName: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0987654321",
    dateOfBirth: "1995-03-15",
    workingMode: 1,
    status: "Available"
  };

  // Mock process steps for popup
  const mockProcessSteps = [
    { stepOrder: 1, stepName: "Ứng tuyển hồ sơ" },
    { stepOrder: 2, stepName: "Phỏng vấn sơ loại" },
    { stepOrder: 3, stepName: "Bài test kỹ năng" },
    { stepOrder: 4, stepName: "Phỏng vấn kỹ thuật" },
    { stepOrder: 5, stepName: "Đàm phán lương" },
    { stepOrder: 6, stepName: "Chào đón nhân viên mới" }
  ];

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setApplication({
        id: parseInt(id || "1"),
        status: "Submitted",
        submittedBy: "user123",
        submitterName: "Nguyễn Văn A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
      setJobRequest({
        description: "Job description here",
        requirements: "Requirements here",
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Đang tải dữ liệu hồ sơ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
            <p className="text-neutral-600 mb-4">Hồ sơ ứng tuyển không tồn tại hoặc đã bị xóa.</p>
            <button onClick={() => navigate("/sales/applications")}>
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    label: "Đã nộp hồ sơ",
    badgeClass: "bg-sky-50 border border-sky-100",
    textClass: "text-sky-700",
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <Breadcrumb
            items={[
                { label: "Yêu cầu tuyển dụng", to: "/sales/job-requests" },
              { label: jobRequest?.title || "Chi tiết yêu cầu", to: `/sales/job-requests/${jobRequest?.id}` },
              { label: "Hồ sơ ứng tuyển", to: "/sales/applications" },
              { label: `Hồ sơ #${application.id}` }
            ]}
          />

          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ #{application.id}</h1>
              <p className="text-neutral-600 mb-4">Thông tin chi tiết hồ sơ ứng viên</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.badgeClass}`}>
                  <span className={`text-sm font-medium ${statusConfig.textClass}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200`}>
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">
                    Cập nhật: {new Date(application.updatedAt || "").toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
                </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft mb-6">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-primary-600 text-white shadow-soft"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Thông tin hồ sơ
              </button>
              <button
                type="button"
                onClick={() => jobRequest && setActiveTab("job")}
                disabled={!jobRequest}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  !jobRequest
                    ? "bg-neutral-50 text-neutral-400 cursor-not-allowed"
                    : activeTab === "job"
                    ? "bg-primary-600 text-white shadow-soft"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Thông tin công việc
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activities")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "activities"
                    ? "bg-primary-600 text-white shadow-soft"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Hoạt động tuyển dụng
              </button>
            </div>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "profile" && (
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft mb-8">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin hồ sơ</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow label="TA phụ trách" value="Nguyễn Thị Linh" icon={<UserIcon className="w-4 h-4" />} />
                <InfoRow label="Vị trí tuyển dụng" value="Frontend Developer (React)" icon={<Users className="w-4 h-4" />} />
                <InfoRow
                  label="Tên ứng viên"
                  value={
                    <button
                      type="button"
                      onClick={openTalentPopup}
                      className="text-left font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                      title="Xem thông tin ứng viên"
                    >
                      {mockTalent.fullName}
                    </button>
                  }
                  icon={<UserIcon className="w-4 h-4" />}
                />
                <InfoRow
                  label="Thời gian nộp hồ sơ"
                  value={new Date(application.createdAt).toLocaleString("vi-VN")}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>
        )}

        {activeTab === "job" && jobRequest && display && (
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft mb-8">
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin tuyển dụng</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJobDetails(!showJobDetails)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
                >
                  {showJobDetails ? "Thu gọn" : "Xem chi tiết"}
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow
                  label="Công ty khách hàng"
                value={display.clientCompany?.name ?? "—"}
                  icon={<Building2 className="w-4 h-4" />}
                />
                <InfoRow
                label="Dự án"
                value={display.project?.name ?? "—"}
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <InfoRow
                  label="Vị trí tuyển dụng"
                value={display.jobRoleLevelName ?? "—"}
                icon={<Target className="w-4 h-4" />}
              />
                <InfoRow
                  label="Chế độ làm việc"
                value="Tại văn phòng"
                icon={<Briefcase className="w-4 h-4" />}
                />
                <InfoRow
                label="Khu vực làm việc"
                value={display.location ?? "—"}
                icon={<MapPin className="w-4 h-4" />}
                />
                <InfoRow
                  label="Quy trình ứng tuyển"
                  value={
                    <button
                      type="button"
                      onClick={openProcessStepsPopup}
                      className="text-left font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                      title="Xem các bước quy trình"
                    >
                      {display.applyProcessTemplateName ?? "—"}
                    </button>
                  }
                  icon={<FileCheck className="w-4 h-4" />}
                />
                {showJobDetails && (
                  <>
                  <InfoRow
                    label="Mô tả công việc"
                    value={
                      <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                        <div
                          className="prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: jobRequest?.description || "Chưa có mô tả",
                          }}
                        />
                      </div>
                    }
                  />
                  <InfoRow
                    label="Yêu cầu ứng viên"
                    value={
                      <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                        <div
                          className="prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: jobRequest?.requirements || "Chưa có yêu cầu",
                          }}
                        />
                    </div>
                    }
                  />
                  </>
                )}
              </div>
            </div>
        )}

        {activeTab === "activities" && (
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft mb-8">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Hoạt động tuyển dụng</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="block p-5 border border-neutral-200 rounded-xl hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 hover:shadow-medium">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">1</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">Trực tuyến</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800">Đã hoàn thành</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Phỏng vấn sơ loại</h4>
                    <p className="text-sm text-neutral-600">Buổi phỏng vấn đầu tiên để đánh giá năng lực cơ bản</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>📅 {new Date(Date.now() - 86400000).toLocaleString("vi-VN")}</span>
                      <span>👤 Nguyễn Văn HR</span>
          </div>
                  </div>
                </div>

                <div className="block p-5 border border-neutral-200 rounded-xl hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 hover:shadow-medium">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">2</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">Trực tuyến</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800">Đang thực hiện</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Bài test kỹ năng</h4>
                    <p className="text-sm text-neutral-600">Đánh giá kỹ năng lập trình và giải quyết vấn đề</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>📅 {new Date(Date.now() - 3600000).toLocaleString("vi-VN")}</span>
                      <span>👤 Trần Thị Tester</span>
                </div>
              </div>
            </div>

                <div className="block p-5 border border-neutral-200 rounded-xl hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 hover:shadow-medium">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">3</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800">Trực tiếp</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">Chưa bắt đầu</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Phỏng vấn kỹ thuật</h4>
                    <p className="text-sm text-neutral-600">Buổi phỏng vấn chuyên sâu về kỹ năng và kinh nghiệm</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>📅 Chưa lên lịch</span>
                      <span>👤 Lê Văn Tech Lead</span>
                </div>
                  </div>
                </div>
              </div>
                </div>
              </div>
            )}

        {/* Talent Popup */}
        {isTalentPopupOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeTalentPopup();
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden border border-neutral-200">
              <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900">Tên ứng viên</h3>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {mockTalent.fullName}
                  </p>
                  </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeTalentPopup}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                    aria-label="Đóng"
                    title="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Cột 1 */}
                <div className="space-y-4">
                  <InfoRow label="Chế độ làm việc" value="Toàn thời gian" icon={<Briefcase className="w-4 h-4" />} />
                  <InfoRow label="Địa điểm mong muốn" value="Hà Nội" icon={<MapPin className="w-4 h-4" />} />
                </div>

                {/* Cột 2 */}
                <div className="space-y-4">
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-neutral-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <p className="text-neutral-500 text-sm font-medium">Trạng thái hiện tại</p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700">Sẵn sàng làm việc</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process Steps Popup */}
        {isProcessStepsPopupOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeProcessStepsPopup();
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden border border-neutral-200">
              <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-neutral-900">Các bước quy trình</h3>
                <p className="text-sm text-neutral-700 mt-1 truncate">{display?.applyProcessTemplateName ?? "Standard Process"}</p>
              </div>
              <button
                type="button"
                onClick={closeProcessStepsPopup}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                aria-label="Đóng"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {mockProcessSteps.length === 0 ? (
                <p className="text-sm text-neutral-600">Chưa có bước quy trình.</p>
              ) : (
                <div className="space-y-3">
                  {mockProcessSteps.map((step) => (
                    <div
                      key={step.stepOrder}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                          {step.stepOrder}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">{step.stepName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}
