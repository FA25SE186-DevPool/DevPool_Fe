import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import {
  talentApplicationService,
  type TalentApplicationDetailed,
} from "../../../services/TalentApplication";
import { jobRequestService } from "../../../services/JobRequest";
import {
  applyActivityService,
  type ApplyActivity,
  ApplyActivityStatus,
  ApplyActivityType,
} from "../../../services/ApplyActivity";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { locationService } from "../../../services/location";
import { WorkingMode as WorkingModeEnum } from "../../../constants/WORKING_MODE";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  User as UserIcon,
  Calendar,
  Mail,
  Phone,
  Building2,
  MapPin,
  History,
  AlertCircle,
  Eye,
  Target,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { projectService } from "../../../services/Project";
import { clientCompanyService } from "../../../services/ClientCompany";
import { jobRoleLevelService } from "../../../services/JobRoleLevel";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { clientCompanyCVTemplateService } from "../../../services/ClientCompanyTemplate";
import { jobRoleService } from "../../../services/JobRole";
import {
  clientContractPaymentService,
  type ClientContractPaymentModel,
} from "../../../services/ClientContractPayment";
import { Button } from "../../../components/ui/button";

interface SalesActivity extends ApplyActivity {
  processStepName?: string;
}

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    {
      label: string;
      badgeClass: string;
      textClass: string;
    }
  > = {
    Submitted: {
      label: "Đã nộp hồ sơ",
      badgeClass: "bg-sky-50 border border-sky-100",
      textClass: "text-sky-700",
    },
    Interviewing: {
      label: "Đang xem xét phỏng vấn",
      badgeClass: "bg-cyan-50 border border-cyan-100",
      textClass: "text-cyan-700",
    },
    Hired: {
      label: "Đã tuyển",
      badgeClass: "bg-purple-50 border border-purple-100",
      textClass: "text-purple-700",
    },
    Rejected: {
      label: "Đã từ chối",
      badgeClass: "bg-red-50 border border-red-100",
      textClass: "text-red-700",
    },
    Withdrawn: {
      label: "Đã rút",
      badgeClass: "bg-neutral-50 border border-neutral-200",
      textClass: "text-neutral-600",
    },
  };

  return (
    configs[status] ?? {
      label: status,
      badgeClass: "bg-neutral-50 border border-neutral-200",
      textClass: "text-neutral-700",
    }
  );
};

interface JobDisplayInfo {
  title: string;
  jobRoleName?: string;
  projectName?: string;
  clientCompany?: {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  jobRoleLevelName?: string;
  locationName?: string;
  clientCompanyCVTemplateName?: string;
  applyProcessTemplateName?: string;
  quantity?: number;
  budgetPerMonth?: number | null;
  workingMode?: number;
}

const workingModeLabels: Record<number, string> = {
  [WorkingModeEnum.Onsite]: "Tại văn phòng",
  [WorkingModeEnum.Remote]: "Làm từ xa",
  [WorkingModeEnum.Hybrid]: "Kết hợp",
  [WorkingModeEnum.Flexible]: "Linh hoạt",
  [WorkingModeEnum.None]: "—",
};

const talentStatusLabels: Record<string, string> = {
  Available: "Sẵn sàng làm việc",
  Working: "Đang làm việc",
  Applying: "Đang ứng tuyển",
  Unavailable: "Tạm ngưng",
  Busy: "Đang bận",
  Interviewing: "Đang phỏng vấn",
  OfferPending: "Đang chờ offer",
  Hired: "Đã tuyển",
  Inactive: "Không hoạt động",
  OnProject: "Đang tham gia dự án",
};

const talentStatusStyles: Record<
  string,
  {
    badgeClass: string;
    textClass: string;
  }
> = {
  Available: { badgeClass: "bg-emerald-50 border border-emerald-100", textClass: "text-emerald-700" },
  Working: { badgeClass: "bg-blue-50 border border-blue-100", textClass: "text-blue-700" },
  Applying: { badgeClass: "bg-sky-50 border border-sky-100", textClass: "text-sky-700" },
  Unavailable: { badgeClass: "bg-neutral-50 border border-neutral-200", textClass: "text-neutral-600" },
  Busy: { badgeClass: "bg-orange-50 border border-orange-100", textClass: "text-orange-700" },
  Interviewing: { badgeClass: "bg-cyan-50 border border-cyan-100", textClass: "text-cyan-700" },
  OfferPending: { badgeClass: "bg-teal-50 border border-teal-100", textClass: "text-teal-700" },
  Hired: { badgeClass: "bg-purple-50 border border-purple-100", textClass: "text-purple-700" },
  Inactive: { badgeClass: "bg-neutral-50 border border-neutral-200", textClass: "text-neutral-600" },
  OnProject: { badgeClass: "bg-indigo-50 border border-indigo-100", textClass: "text-indigo-700" },
};

// (no-op) kept for potential future use

const activityTypeLabels: Record<number, string> = {
  [ApplyActivityType.Online]: "Trực tuyến",
  [ApplyActivityType.Offline]: "Trực tiếp",
};

const activityStatusLabels: Record<number, string> = {
  [ApplyActivityStatus.Scheduled]: "Đã lên lịch",
  [ApplyActivityStatus.Completed]: "Hoàn thành",
  [ApplyActivityStatus.Passed]: "Đạt",
  [ApplyActivityStatus.Failed]: "Không đạt",
  [ApplyActivityStatus.NoShow]: "Không có mặt",
};

export default function SalesApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<TalentApplicationDetailed | null>(null);
  const [jobInfo, setJobInfo] = useState<JobDisplayInfo | null>(null);
  const [jobRequest] = useState<any>(null);
  const [talentLocationName, setTalentLocationName] = useState<string>("—");
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [showDob, setShowDob] = useState(false);
  const [showFullCVSummary, setShowFullCVSummary] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [existingContract, setExistingContract] = useState<ClientContractPaymentModel | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const applicationData = await talentApplicationService.getDetailedById(Number(id));
        setApplication(applicationData);

        if (applicationData.talent?.locationId) {
          try {
            const location = await locationService.getById(applicationData.talent.locationId);
            setTalentLocationName(location.name);
          } catch {
            setTalentLocationName("—");
          }
        } else {
          setTalentLocationName("—");
        }

        try {
          const jobReqRaw = await jobRequestService.getById(applicationData.jobRequestId);
          const display: JobDisplayInfo = {
            title: jobReqRaw.title,
            quantity: jobReqRaw.quantity,
            budgetPerMonth: jobReqRaw.budgetPerMonth ?? null,
            workingMode: jobReqRaw.workingMode,
          };

          if (jobReqRaw.projectId) {
            try {
              const project = await projectService.getById(jobReqRaw.projectId);
              display.projectName = project?.name ?? "—";

              if (project?.clientCompanyId) {
                try {
                  const company = await clientCompanyService.getById(project.clientCompanyId);
                  display.clientCompany = {
                    name: company?.name ?? "—",
                    contactPerson: company?.contactPerson ?? "—",
                    email: company?.email ?? "—",
                    phone: company?.phone ?? "—",
                    address: company?.address ?? "—",
                  };

                  try {
                    const templates =
                      await clientCompanyCVTemplateService.listEffectiveTemplates(project.clientCompanyId);
                    const matched = templates.find(
                      (tpl) => tpl.templateId === jobReqRaw.clientCompanyCVTemplateId,
                    );
                    display.clientCompanyCVTemplateName = matched?.templateName ?? "—";
                  } catch {
                    display.clientCompanyCVTemplateName = "—";
                  }
                } catch {
                  display.clientCompany = { name: "—" };
                  display.clientCompanyCVTemplateName = "—";
                }
              }
            } catch {
              display.projectName = "—";
              display.clientCompany = { name: "—" };
              display.clientCompanyCVTemplateName = "—";
            }
          } else {
            display.projectName = "—";
            display.clientCompany = { name: "—" };
            display.clientCompanyCVTemplateName = "—";
          }

          if (jobReqRaw.jobRoleLevelId) {
            try {
              const level = await jobRoleLevelService.getById(jobReqRaw.jobRoleLevelId);
              display.jobRoleLevelName = level?.name ?? "—";

              if (level?.jobRoleId) {
                try {
                  const role = await jobRoleService.getById(level.jobRoleId);
                  display.jobRoleName = role?.name ?? "—";
                } catch {
                  display.jobRoleName = "—";
                }
              } else {
                display.jobRoleName = "—";
              }
            } catch {
              display.jobRoleLevelName = "—";
              display.jobRoleName = "—";
            }
          } else {
            display.jobRoleLevelName = "—";
            display.jobRoleName = "—";
          }

          if (jobReqRaw.locationId) {
            try {
              const loc = await locationService.getById(jobReqRaw.locationId);
              display.locationName = loc?.name ?? display.clientCompany?.address ?? "—";
            } catch {
              display.locationName = display.clientCompany?.address ?? "—";
            }
          } else {
            display.locationName = display.clientCompany?.address ?? "—";
          }

          if (jobReqRaw.applyProcessTemplateId) {
            try {
              const template = await applyProcessTemplateService.getById(
                jobReqRaw.applyProcessTemplateId,
              );
              display.applyProcessTemplateName = template?.name ?? "—";
            } catch {
              display.applyProcessTemplateName = "—";
            }
          } else {
            display.applyProcessTemplateName = "—";
          }

          setJobInfo(display);
        } catch (err) {
          console.error("❌ Lỗi tải thông tin job request:", err);
          setJobInfo(null);
        }

        try {
          const acts = await applyActivityService.getAll({ applyId: applicationData.id });
          const steps = await applyProcessStepService.getAll();
          const stepMap: Record<number, ApplyProcessStep> = {};
          steps.forEach((step: ApplyProcessStep) => {
            stepMap[step.id] = step;
          });
          const enhanced = acts.map<SalesActivity>((activity) => ({
            ...activity,
            processStepName: stepMap[activity.processStepId]?.stepName,
          }));
          setActivities(enhanced);
        } catch (err) {
          console.error("❌ Lỗi tải hoạt động:", err);
          setActivities([]);
        }

        // Fetch existing contract for this talent (if application is Hired)
        try {
          if (applicationData.status === 'Hired' && applicationData.talent?.id) {
            const contractsData = await clientContractPaymentService.getAll({
              talentId: applicationData.talent.id,
              excludeDeleted: true,
            });
            // Lấy hợp đồng mới nhất (nếu có nhiều hợp đồng) - sắp xếp theo contractStartDate
            const sortedContracts = (contractsData as ClientContractPaymentModel[]).sort((a, b) => {
              const dateA = new Date(a.contractStartDate).getTime();
              const dateB = new Date(b.contractStartDate).getTime();
              return dateB - dateA;
            });
            setExistingContract(sortedContracts.length > 0 ? sortedContracts[0] : null);
          } else {
            setExistingContract(null);
          }
        } catch (err) {
          console.error("❌ Lỗi tải thông tin hợp đồng:", err);
          setExistingContract(null);
        }
      } catch (err) {
        console.error("❌ Lỗi tải hồ sơ:", err);
        navigate("/sales/applications");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, location.key]);

  const timeline = useMemo(() => {
    if (!application) return [];

    const events: Array<{ date: Date; title: string; description: string }> = [
      {
        date: new Date(application.createdAt),
        title: "Hồ sơ được tạo",
        description: `${application.submitterName ?? application.submittedBy} đã tạo hồ sơ.`,
      },
    ];

    activities
      .filter((activity) => activity.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .forEach((activity) => {
        events.push({
          date: new Date(activity.scheduledDate!),
          title: `${activityTypeLabels[activity.activityType] ?? "Hoạt động"} - ${
            activityStatusLabels[activity.status] ?? "Trạng thái"
          }`,
          description: activity.processStepName
            ? `Bước quy trình: ${activity.processStepName}`
            : `Hoạt động ID #${activity.id}`,
        });
      });

    return events;
  }, [activities, application]);

  // Hàm lấy nhãn trạng thái hợp đồng
  const getContractStatusLabel = (status: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'active':
        return 'Đang hiệu lực';
      case 'pending':
        return 'Chờ duyệt';
      case 'draft':
        return 'Bản nháp';
      case 'expired':
        return 'Đã hết hạn';
      case 'terminated':
        return 'Đã chấm dứt';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return status || '—';
    }
  };

  // Hàm lấy màu trạng thái hợp đồng
  const getContractStatusColor = (status: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-neutral-500">Đang tải dữ liệu hồ sơ...</div>
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
            <p className="text-neutral-600">Không tìm thấy hồ sơ ứng tuyển.</p>
            <Link
              to="/sales/applications"
              className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const workingModeText =
    jobInfo && jobInfo.workingMode !== undefined
      ? workingModeLabels[jobInfo.workingMode] ?? "—"
      : "—";
  const statusConfig = getStatusConfig(application.status);

  // Tính toán last updated time và kiểm tra idle 7 ngày
  const getLastUpdatedTime = () => {
    // Ưu tiên: updatedAt > last activity scheduledDate > createdAt
    let lastUpdated: Date | null = null;

    if (application?.updatedAt) {
      lastUpdated = new Date(application.updatedAt);
    } else if (activities.length > 0) {
      // Lấy activity có scheduledDate gần nhất
      const sortedActivities = [...activities]
        .filter((a) => a.scheduledDate)
        .sort((a, b) => {
          const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
          const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
          return dateB - dateA;
        });

      if (sortedActivities.length > 0 && sortedActivities[0].scheduledDate) {
        lastUpdated = new Date(sortedActivities[0].scheduledDate);
      }
    }

    if (!lastUpdated && application?.createdAt) {
      lastUpdated = new Date(application.createdAt);
    }

    return lastUpdated;
  };

  const lastUpdatedTime = getLastUpdatedTime();

  const isIdle7Days = (() => {
    if (!lastUpdatedTime) return false;
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - lastUpdatedTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate >= 7;
  })();

  const formatLastUpdatedTime = () => {
    if (!lastUpdatedTime) return "—";
    try {
      return lastUpdatedTime.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getDaysSinceUpdate = () => {
    if (!lastUpdatedTime) return 0;
    return Math.floor(
      (new Date().getTime() - lastUpdatedTime.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <Breadcrumb
            items={[
              ...(jobRequest ? [
                { label: "Yêu cầu tuyển dụng", to: "/sales/job-requests" },
                { label: jobRequest.title || "Chi tiết yêu cầu", to: `/sales/job-requests/${jobRequest.id}` }
              ] : []),
              { label: "Hồ sơ ứng tuyển", to: "/sales/applications" },
              { label: application ? `Hồ sơ #${application.id}` : "Chi tiết hồ sơ" }
            ]}
          />

          {/* Banner cảnh báo khi idle 7 ngày */}
          {isIdle7Days && (
            <div className="mt-4 mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  ⚠️ Cảnh báo: Ứng viên này đã không được cập nhật {getDaysSinceUpdate()} ngày
                </h3>
                <p className="text-sm text-amber-800">
                  Vui lòng cập nhật trạng thái để theo dõi tiến độ ứng viên.
                </p>
              </div>
            </div>
          )}

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
                {/* Last updated time */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
                  isIdle7Days 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-neutral-50 border-neutral-200"
                }`}>
                  <Clock className={`w-4 h-4 ${isIdle7Days ? "text-amber-600" : "text-neutral-500"}`} />
                  <span className={`text-sm font-medium ${
                    isIdle7Days ? "text-amber-900" : "text-neutral-700"
                  }`}>
                    Cập nhật lần cuối: {formatLastUpdatedTime()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {application?.status === 'Hired' && existingContract && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Đã có hợp đồng:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getContractStatusColor(existingContract.contractStatus)}`}>
                    {getContractStatusLabel(existingContract.contractStatus)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin hồ sơ</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow label="Mã hồ sơ" value={`#${application.id}`} icon={<FileText className="w-4 h-4" />} />
                <InfoRow
                  label="Người nộp"
                  value={application.submitterName ?? application.submittedBy}
                  icon={<UserIcon className="w-4 h-4" />}
                />
                <InfoRow
                  label="Thời gian nộp hồ sơ"
                  value={new Date(application.createdAt).toLocaleString("vi-VN")}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <InfoRow
                  label="Cập nhật gần nhất"
                  value={
                    application.updatedAt ? new Date(application.updatedAt).toLocaleString("vi-VN") : "—"
                  }
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Job info - sync fields and collapsed like TA */}
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
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
                  value={jobInfo?.clientCompany?.name ?? "—"}
                  icon={<Building2 className="w-4 h-4" />}
                />
                <InfoRow
                  label="Loại vị trí tuyển dụng"
                  value={jobInfo?.jobRoleName ?? "—"}
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <InfoRow
                  label="Vị trí tuyển dụng"
                  value={jobInfo?.jobRoleLevelName ?? "—"}
                  icon={<FileText className="w-4 h-4" />}
                />
                <InfoRow
                  label="Chế độ làm việc"
                  value={workingModeText}
                  icon={<Target className="w-4 h-4" />}
                />
                <InfoRow
                  label="Số lượng tuyển dụng"
                  value={jobInfo?.quantity !== undefined ? String(jobInfo.quantity) : "—"}
                  icon={<FileText className="w-4 h-4" />}
                />
                <InfoRow
                  label="Quy trình ứng tuyển"
                  value={jobInfo?.applyProcessTemplateName ?? "—"}
                  icon={<FileText className="w-4 h-4" />}
                />
                {showJobDetails && (
                  <>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-neutral-500 text-sm font-medium">Mô tả công việc</p>
                      </div>
                      {application.jobRequest?.description ? (
                        <div
                          className="prose prose-sm text-gray-700 leading-relaxed max-w-none"
                          dangerouslySetInnerHTML={{ __html: application.jobRequest.description }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">Chưa có mô tả</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-neutral-500 text-sm font-medium">Yêu cầu ứng viên</p>
                      </div>
                      {application.jobRequest?.requirements ? (
                        <div
                          className="prose prose-sm text-gray-700 leading-relaxed max-w-none"
                          dangerouslySetInnerHTML={{ __html: application.jobRequest.requirements }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">Chưa có yêu cầu cụ thể cho ứng viên</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Hoạt động gần đây (moved from right column) */}
            {/* Lịch sử hoạt động (moved from left column) */}
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-100 rounded-lg">
                    <History className="w-5 h-5 text-accent-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Lịch sử hoạt động</h2>
                </div>
              </div>
              <div className="p-6">
                {timeline.length === 0 ? (
                  <p className="text-sm text-neutral-500">Chưa có hoạt động nào được ghi nhận.</p>
                ) : (
                  <ol className="relative border-l border-neutral-200 ml-3 space-y-6">
                    {timeline.map((event, idx) => (
                      <li key={`${event.title}-${idx}`} className="ml-6">
                        <div className="absolute -left-1.5 w-3 h-3 bg-primary-500 rounded-full border border-white" />
                        <p className="text-xs text-neutral-400">
                          {event.date.toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-neutral-600">{event.description}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Candidate info - order + badge + DOB collapsed like TA */}
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <UserIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin ứng viên</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <InfoRow label="Tên ứng viên" value={application.talent?.fullName ?? "—"} icon={<UserIcon className="w-4 h-4" />} />
                <InfoRow label="Email" value={application.talent?.email ?? "—"} icon={<Mail className="w-4 h-4" />} />
                <InfoRow label="Phone" value={application.talent?.phone ?? "—"} icon={<Phone className="w-4 h-4" />} />
                <InfoRow label="Working Mode" value={getTalentWorkingModeDisplay(application.talent?.workingMode)} icon={<Briefcase className="w-4 h-4" />} />
                <InfoRow label="Desired Location" value={talentLocationName} icon={<MapPin className="w-4 h-4" />} />
                <div className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-neutral-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium">Current Status</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold ${talentStatusStyles[application.talent?.status ?? ""]?.badgeClass || "bg-neutral-50 border border-neutral-200"}`}>
                    <span className={talentStatusStyles[application.talent?.status ?? ""]?.textClass || "text-neutral-700"}>
                      {getTalentStatusLabel(application.talent?.status)}
                    </span>
                  </span>
                </div>
                <div className="space-y-2">
                  <button type="button" onClick={() => setShowDob(!showDob)} className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition">
                    {showDob ? "Ẩn ngày sinh" : "Hiện ngày sinh"}
                  </button>
                  {showDob && (
                    <InfoRow label="Date of Birth" value={application.talent?.dateOfBirth ? new Date(application.talent.dateOfBirth).toLocaleDateString("vi-VN") : "—"} icon={<Calendar className="w-4 h-4" />} />
                  )}
                </div>
              </div>
            </div>

            {/* CV info - summary card and updated date behavior */}
            {application.cv && (
              <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
                <div className="p-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <FileText className="w-5 h-5 text-secondary-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Thông tin CV</h2>
                  </div>
                  {application.cv.cvFileUrl && (
                    <Button
                      onClick={() => window.open(application.cv!.cvFileUrl, "_blank")}
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transform hover:scale-105"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Xem CV
                    </Button>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow
                      label="Phiên bản CV"
                      value={application.cv.version ? `v${application.cv.version}` : "—"}
                      icon={<FileText className="w-4 h-4" />}
                    />
                    <InfoRow
                      label="Ngày cập nhật CV"
                      value={(() => {
                        const cvWithUpdatedAt = application.cv as { updatedAt?: string | null };
                        return cvWithUpdatedAt?.updatedAt ? new Date(cvWithUpdatedAt.updatedAt).toLocaleString("vi-VN") : "Chưa cập nhật";
                      })()}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                  {application.cv.summary && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <p className="text-neutral-500 text-sm font-medium">Tóm tắt</p>
                        </div>
                        {application.cv.summary.length > 240 && (
                          <button
                            type="button"
                            onClick={() => setShowFullCVSummary(!showFullCVSummary)}
                            className="text-xs px-2 py-1 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition"
                          >
                            {showFullCVSummary ? "Thu gọn" : "Xem thêm"}
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {showFullCVSummary
                          ? application.cv.summary
                          : (application.cv.summary.length > 240
                            ? application.cv.summary.slice(0, 240) + "…"
                            : application.cv.summary)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-neutral-500">Chưa có hoạt động nào.</p>
                ) : (
                  activities
                    .slice()
                    .sort((a, b) => a.id - b.id)
                    .map((activity) => (
                      <div key={activity.id} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-900">
                            {activityTypeLabels[activity.activityType] ?? "Hoạt động"} #{activity.id}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {activity.scheduledDate
                              ? new Date(activity.scheduledDate).toLocaleString("vi-VN")
                              : "—"}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Trạng thái: {activityStatusLabels[activity.status] ?? activity.status}
                        </p>
                        {activity.processStepName && (
                          <p className="text-sm text-neutral-600">Bước quy trình: {activity.processStepName}</p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
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
  value: string;
  icon?: ReactNode;
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

function getTalentWorkingModeDisplay(workingMode?: number | null) {
  if (!workingMode) return "—";
  const options = [
    { value: WorkingModeEnum.Onsite, label: "Tại văn phòng" },
    { value: WorkingModeEnum.Remote, label: "Làm từ xa" },
    { value: WorkingModeEnum.Hybrid, label: "Kết hợp" },
    { value: WorkingModeEnum.Flexible, label: "Linh hoạt" },
  ];

  const matched = options
    .filter((item) => (workingMode & item.value) === item.value)
    .map((item) => item.label);

  return matched.length > 0 ? matched.join(", ") : "—";
}

function getTalentStatusLabel(status?: string | null) {
  if (!status) return "—";
  return talentStatusLabels[status] ?? status;
}

