import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { talentApplicationService, type TalentApplicationDetailed } from "../../../services/TalentApplication";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { applyService, type Apply } from "../../../services/Apply";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { projectService } from "../../../services/Project";
import { clientCompanyService } from "../../../services/ClientCompany";
import { jobRoleLevelService } from "../../../services/JobRoleLevel";
import { locationService } from "../../../services/location";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { applyActivityService, type ApplyActivity } from "../../../services/ApplyActivity";
import { WorkingMode as WorkingModeEnum } from "../../../constants/WORKING_MODE";
import { TalentLevel } from "../../../services/JobRoleLevel";
import {
  FileText,
  User as UserIcon,
  Calendar,
  Briefcase,
  Building2,
  MapPin,
  Users,
  FileCheck,
  Clock,
  AlertCircle,
  X,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Layers,
} from "lucide-react";

// Helper function to get level text
const getLevelText = (level: number): string => {
  const levelMap: Record<number, string> = {
    [TalentLevel.Junior]: 'Junior',
    [TalentLevel.Middle]: 'Middle',
    [TalentLevel.Senior]: 'Senior',
    [TalentLevel.Lead]: 'Lead',
  };
  return levelMap[level] || 'Unknown';
};

function InfoRow({
  label,
  value,
  icon,
  onClick,
  showEyeIcon = true,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  showEyeIcon?: boolean;
}) {
  const isReactElement = React.isValidElement(value);
  const isClickable = !!onClick;

  return (
    <div className={`group ${isClickable ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
        {isClickable && showEyeIcon && (
          <div className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3" />
          </div>
        )}
      </div>
      {isReactElement ? (
        <div className={`font-semibold transition-colors duration-300 ${isClickable ? 'text-primary-700 group-hover:text-primary-800' : 'text-gray-900'}`}>
          {value}
        </div>
      ) : (
        <p className={`font-semibold transition-colors duration-300 ${isClickable ? 'text-primary-700 group-hover:text-primary-800' : 'text-gray-900'}`}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

export default function SalesApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Apply | null>(null);
  const [detailedApplication, setDetailedApplication] = useState<TalentApplicationDetailed | null>(null);
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
  const [talentCV, setTalentCV] = useState<TalentCV | null>(null);
  const [cvJobRoleLevelName, setCvJobRoleLevelName] = useState<string>("—");
  const [cvJobRoleLevelDisplay, setCvJobRoleLevelDisplay] = useState<string>("—");
  const [applyProcessTemplateName, setApplyProcessTemplateName] = useState<string>("—");
  const [clientCompanyName, setClientCompanyName] = useState<string>("—");
  const [projectName, setProjectName] = useState<string>("—");
  const [jobRequestLocationName, setJobRequestLocationName] = useState<string>("—");
  const [talentLocationName, setTalentLocationName] = useState<string>("—");
  const [templateSteps, setTemplateSteps] = useState<ApplyProcessStep[]>([]);
  const [activities, setActivities] = useState<ApplyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "activities">("profile");
  const [showJobSection, setShowJobSection] = useState(false);
  const [isTalentPopupOpen, setIsTalentPopupOpen] = useState(false);
  const [isProcessStepsPopupOpen, setIsProcessStepsPopupOpen] = useState(false);

  // Client company popup states
  const [isClientCompanyPopupOpen, setIsClientCompanyPopupOpen] = useState(false);
  const [clientCompanyDetail, setClientCompanyDetail] = useState<any>(null);
  const [clientCompanyDetailLoading, setClientCompanyDetailLoading] = useState(false);

  // Project popup states
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);

  // Project status labels and colors (matching /sales/projects)
  const projectStatusLabels: Record<string, string> = {
    Planned: "Đã lên kế hoạch",
    Ongoing: "Đang thực hiện",
    OnHold: "Tạm dừng",
    Completed: "Đã hoàn thành"
  };

  const getProjectStatusStyle = (status: string) => {
    switch (status) {
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'Planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'OnHold':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getWorkingModeDisplay = (workingMode?: number) => {
    if (!workingMode) return "—";
    const labels: { value: number; label: string }[] = [
      { value: WorkingModeEnum.Onsite, label: "Tại văn phòng" },
      { value: WorkingModeEnum.Remote, label: "Làm từ xa" },
      { value: WorkingModeEnum.Hybrid, label: "Kết hợp" },
    ];
    const found = labels.find(item => item.value === workingMode);
    return found?.label || "—";
  };

  // Activity helpers
  const getActivityTypeLabel = (type: number): string => {
    const labels: Record<number, string> = {
      0: "Trực tuyến",
      1: "Trực tiếp"
    };
    return labels[type] || `Loại ${type}`;
  };

  const getActivityStatusLabel = (status: number): string => {
    const labels: Record<number, string> = {
      0: "Đã lên lịch",
      1: "Đã hoàn thành",
      2: "Đã đạt",
      3: "Không đạt",
      4: "Không có mặt"
    };
    return labels[status] || `Trạng thái ${status}`;
  };

  const getActivityStatusColor = (status: number): string => {
    switch (status) {
      case 0: return "bg-blue-100 text-blue-800"; // Đã lên lịch
      case 1: return "bg-green-100 text-green-800"; // Đã hoàn thành
      case 2: return "bg-green-100 text-green-800"; // Đã đạt
      case 3: return "bg-red-100 text-red-800"; // Không đạt
      case 4: return "bg-orange-100 text-orange-800"; // Không có mặt
      default: return "bg-neutral-100 text-neutral-800";
    }
  };


  const openTalentPopup = () => setIsTalentPopupOpen(true);
  const closeTalentPopup = () => setIsTalentPopupOpen(false);
  const openProcessStepsPopup = () => setIsProcessStepsPopupOpen(true);
  const closeProcessStepsPopup = () => setIsProcessStepsPopupOpen(false);

  const openClientCompanyPopup = async () => {
    if (!detailedApplication || !detailedApplication.clientCompany?.id) return;

    setIsClientCompanyPopupOpen(true);
    setClientCompanyDetailLoading(true);

    try {
      const detail = await clientCompanyService.getById(detailedApplication.clientCompany.id);
      setClientCompanyDetail(detail);
    } catch (error) {
      console.error("Failed to load client company detail:", error);
    } finally {
      setClientCompanyDetailLoading(false);
    }
  };

  const closeClientCompanyPopup = () => {
    setIsClientCompanyPopupOpen(false);
    setClientCompanyDetail(null);
  };

  const openProjectPopup = async () => {
    if (!detailedApplication || !detailedApplication.project?.id) return;

    setIsProjectPopupOpen(true);
    setProjectDetailLoading(true);

    try {
      const detail = await projectService.getById(detailedApplication.project.id);
      setProjectDetail(detail);
    } catch (error) {
      console.error("Failed to load project detail:", error);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const closeProjectPopup = () => {
    setIsProjectPopupOpen(false);
    setProjectDetail(null);
  };


  const display = useMemo(() => {
    if (!application || !jobRequest) return null;
    const result = {
      jobRoleLevelName: cvJobRoleLevelName,
      budgetPerMonth: jobRequest.budgetPerMonth || 0,
      workingMode: jobRequest.workingMode || 1,
      location: "Hà Nội", // TODO: Add location logic if needed
      applyProcessTemplateName: applyProcessTemplateName,
      quantity: jobRequest.quantity || 0,
      clientCompany: { name: clientCompanyName },
      project: { name: projectName },
      templateStepsCount: templateSteps.length,
    };
    console.log("📊 Display data:", result);
    return result;
  }, [application, jobRequest, cvJobRoleLevelName, applyProcessTemplateName, clientCompanyName, projectName, templateSteps]);

  // Talent data for popup
  const talentData = useMemo(() => {
    if (detailedApplication?.talent) {
      console.log("Talent data from API:", detailedApplication.talent);
      console.log("Talent CV data:", talentCV);
      return {
        fullName: detailedApplication.talent.fullName || "—",
        email: detailedApplication.talent.email || "—",
        phone: detailedApplication.talent.phone || "—",
        dateOfBirth: detailedApplication.talent.dateOfBirth || "—",
        workingMode: detailedApplication.talent.workingMode || 1,
        preferredLocation: talentLocationName,
        status: "Available" // TODO: Add real status logic if needed
      };
    }
    return {
      fullName: "—",
      email: "—",
      phone: "—",
      dateOfBirth: "—",
      workingMode: 1,
      preferredLocation: talentLocationName,
      status: "—"
    };
  }, [detailedApplication, talentCV, talentLocationName]);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch application
      const appData = await applyService.getById(Number(id));
      setApplication(appData);
      console.log("✅ Application loaded:", appData);

      // Fetch detailed application data
      let foundDetailedApplication: TalentApplicationDetailed | null = null;
      try {
        console.log("🔍 Fetching detailed application for ID:", appData.id);
        try {
          foundDetailedApplication = await talentApplicationService.getDetailedById(appData.id);
          console.log("✅ Found detailed application via getDetailedById:", foundDetailedApplication);
          setDetailedApplication(foundDetailedApplication);
        } catch (detailedError) {
          console.warn("⚠️ getDetailedById failed, trying getByJobRequest:", detailedError);
          // Fallback: dùng getByJobRequest nếu getDetailedById không có
          const detailedResponse = await talentApplicationService.getByJobRequest(appData.jobRequestId);
          console.log("🔍 getByJobRequest response:", detailedResponse);
          foundDetailedApplication = detailedResponse?.data?.applications?.find(app => app.id === appData.id) ?? null;
          console.log("✅ Found detailed application via getByJobRequest:", foundDetailedApplication);
          setDetailedApplication(foundDetailedApplication);
        }
      } catch (err) {
        console.error("❌ Lỗi tải thông tin chi tiết ứng viên:", err);
        console.error("❌ Detailed application error details:", err);
        setDetailedApplication(null);
        setTalentLocationName("—");
      }
      console.log("✅ Detailed application loaded:", foundDetailedApplication);

      // Load talent location if available
      if (foundDetailedApplication?.talent?.locationId) {
        try {
          const location = await locationService.getById(foundDetailedApplication.talent.locationId);
          setTalentLocationName(location.name);
          console.log("✅ Talent location loaded:", location.name);
        } catch (locationErr) {
          console.error("❌ Lỗi tải địa điểm của ứng viên:", locationErr);
          setTalentLocationName("—");
        }
      } else {
        setTalentLocationName("—");
      }

      // Fetch related data in parallel
      const [jobReqData, cvData] = await Promise.all([
        jobRequestService.getById(appData.jobRequestId),
        talentCVService.getById(appData.cvId)
      ]);

      console.log("✅ Job request loaded:", jobReqData);
      console.log("✅ Talent CV loaded:", cvData);

      setApplication(appData);
      setJobRequest(jobReqData);
      setTalentCV(cvData);

      // Vị trí tuyển dụng theo TalentCV (JobRoleLevelId)
      try {
        if (cvData?.jobRoleLevelId) {
          const cvLevel = await jobRoleLevelService.getById(cvData.jobRoleLevelId);
          setCvJobRoleLevelName(cvLevel?.name ?? "—");
          const levelText = cvLevel ? getLevelText(cvLevel.level) : "—";
          setCvJobRoleLevelDisplay(cvLevel ? `${cvLevel.name} - ${levelText}` : "—");
        } else {
          setCvJobRoleLevelName("—");
          setCvJobRoleLevelDisplay("—");
        }
      } catch {
        setCvJobRoleLevelName("—");
        setCvJobRoleLevelDisplay("—");
      }

      // Enrich JobRequest: client company, job role level/name
      try {
        // Client company via project
        if (jobReqData.projectId) {
          try {
            const proj = await projectService.getById(jobReqData.projectId);
            setProjectName(proj?.name ?? "—");

            if (proj?.clientCompanyId) {
              try {
                const company = await clientCompanyService.getById(proj.clientCompanyId);
                setClientCompanyName(company?.name ?? "—");
              } catch {
                setClientCompanyName("—");
              }
            } else {
              setClientCompanyName("—");
            }
          } catch {
            setProjectName("—");
            setClientCompanyName("—");
          }
        } else {
          setProjectName("—");
          setClientCompanyName("—");
        }

        // Job role level
        if (jobReqData.jobRoleLevelId) {
          try {
            const level = await jobRoleLevelService.getById(jobReqData.jobRoleLevelId);
            setCvJobRoleLevelName(level?.name ?? "—");
          } catch {
            setCvJobRoleLevelName("—");
          }
        } else {
          setCvJobRoleLevelName("—");
        }

        // Job request location
        try {
          if (jobReqData.locationId) {
            const location = await locationService.getById(jobReqData.locationId);
            setJobRequestLocationName(location?.name ?? "—");
          } else {
            setJobRequestLocationName("—");
          }
        } catch {
          setJobRequestLocationName("—");
        }

        // Apply process template name and steps
        let fetchedTemplateSteps: ApplyProcessStep[] = [];
        try {
          if (jobReqData.applyProcessTemplateId) {
            const tpl = await applyProcessTemplateService.getById(jobReqData.applyProcessTemplateId);
            setApplyProcessTemplateName(tpl?.name ?? "—");
            console.log("✅ Apply process template loaded:", tpl);

            // Load template steps
            try {
              const stepsResponse = await applyProcessStepService.getAll({
                templateId: jobReqData.applyProcessTemplateId,
                excludeDeleted: true
              });
              if (Array.isArray(stepsResponse)) {
                fetchedTemplateSteps = stepsResponse as ApplyProcessStep[];
              } else if (stepsResponse?.data && Array.isArray(stepsResponse.data)) {
                fetchedTemplateSteps = stepsResponse.data as ApplyProcessStep[];
              }
              console.log("✅ Template steps loaded:", fetchedTemplateSteps);
            } catch (stepsErr) {
              console.error("❌ Lỗi tải bước quy trình ứng tuyển:", stepsErr);
            }
          } else {
            setApplyProcessTemplateName("—");
          }
        } catch {
          setApplyProcessTemplateName("—");
        }
        setTemplateSteps(fetchedTemplateSteps);

        // Load activities
        try {
          const activitiesData = await applyActivityService.getAll({ applyId: appData.id });
          setActivities(Array.isArray(activitiesData) ? activitiesData : []);
          console.log("✅ Activities loaded:", activitiesData);
        } catch (activitiesErr) {
          console.error("❌ Lỗi tải hoạt động:", activitiesErr);
          setActivities([]);
        }

      console.log("✅ All data loaded successfully");
      console.log("📊 Final state:", {
        application: appData,
        detailedApplication: foundDetailedApplication,
        jobRequest: jobReqData,
        talentCV: cvData,
        templateSteps: fetchedTemplateSteps,
        activities,
        cvJobRoleLevelName,
        projectName,
        clientCompanyName,
        jobRequestLocationName,
        applyProcessTemplateName
      });

      // Check if we have the expected data
      if (!foundDetailedApplication) {
        console.warn("⚠️ No detailedApplication found - popup data may be missing");
      }
      if (!cvData) {
        console.warn("⚠️ No talentCV found - job role level data may be missing");
      }

      } catch (error) {
        console.error("❌ Lỗi enrich data:", error);
        setProjectName("—");
        setClientCompanyName("—");
        setCvJobRoleLevelName("—");
        setApplyProcessTemplateName("—");
      }

    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Set empty data when API fails
      setApplication(null);
      setDetailedApplication(null);
      setJobRequest(null);
      setTalentCV(null);
      setTemplateSteps([]);
      setActivities([]);
      setCvJobRoleLevelName("—");
      setApplyProcessTemplateName("—");
      setProjectName("—");
      setClientCompanyName("—");
      setCvJobRoleLevelName("—");
      setJobRequestLocationName("—");
      setTalentLocationName("—");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Helper functions
  interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
  }

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      "Interviewing": {
        label: "Đang xem xét phỏng vấn",
        color: "bg-cyan-100 text-cyan-800",
        bgColor: "bg-cyan-50"
      },
      "Submitted": {
        label: "Đã nộp hồ sơ",
        color: "bg-sky-100 text-sky-800",
        bgColor: "bg-sky-50"
      },
      "Hired": {
        label: "Đã tuyển",
        color: "bg-purple-100 text-purple-800",
        bgColor: "bg-purple-50"
      },
      "Rejected": {
        label: "Từ chối",
        color: "bg-red-100 text-red-800",
        bgColor: "bg-red-50"
      },
      "Withdrawn": {
        label: "Đã rút hồ sơ",
        color: "bg-orange-100 text-orange-800",
        bgColor: "bg-orange-50"
      },
      "Expired": {
        label: "Đã hết hạn",
        color: "bg-gray-100 text-gray-800",
        bgColor: "bg-gray-50"
      },
      "ClosedBySystem": {
        label: "Đã đóng",
        color: "bg-gray-100 text-gray-800",
        bgColor: "bg-gray-50"
      },
      "OfferPending": {
        label: "Đang chờ offer",
        color: "bg-teal-100 text-teal-800",
        bgColor: "bg-teal-50"
      },
      "OnProject": {
        label: "Đang làm việc",
        color: "bg-indigo-100 text-indigo-800",
        bgColor: "bg-indigo-50"
      },
      "Inactive": {
        label: "Không hoạt động",
        color: "bg-neutral-100 text-neutral-800",
        bgColor: "bg-neutral-50"
      }
    };
    return configs[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
      bgColor: "bg-gray-50"
    };
  };

  const statusConfig = getStatusConfig(application.status);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        <div className="mb-2">
          <Breadcrumb
            items={[
              ...(jobRequest ? [
                { label: "Yêu cầu tuyển dụng", to: "/sales/job-requests" },
                { label: jobRequest.title || "Chi tiết yêu cầu", to: `/sales/job-requests/${jobRequest.id}` }
              ] : [
                { label: "Hồ sơ ứng tuyển", to: "/sales/applications" }
              ]),
              { label: application ? `Hồ sơ: ${detailedApplication?.talent?.fullName || application.id}` : "Chi tiết hồ sơ" }
            ]}
          />
        </div>

        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ: {detailedApplication?.talent?.fullName || application.id}</h1>
              <p className="text-neutral-600 mb-4">Thông tin chi tiết hồ sơ ứng viên</p>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor} border border-neutral-200`}
                >
                  <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200`}>
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">
                    Cập nhật: {new Date(application.createdAt || "").toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white border border-neutral-100 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-primary-600 text-white shadow-soft"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Hồ sơ tuyển dụng
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

        {/* Tab content */}
        {activeTab === "profile" && (
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft mb-8">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Hồ sơ tuyển dụng</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow label="TA phụ trách" value={detailedApplication?.recruiterName || "—"} icon={<UserIcon className="w-4 h-4" />} />
                <InfoRow label="Vị trí tuyển dụng" value={cvJobRoleLevelDisplay} icon={<Users className="w-4 h-4" />} />
                <InfoRow
                  label="Tên ứng viên"
                  value={
                    detailedApplication?.talent?.fullName ? (
                      <button
                        type="button"
                        onClick={openTalentPopup}
                        className="text-left font-semibold text-primary-700 hover:text-primary-800"
                        title="Xem thông tin ứng viên"
                      >
                        {detailedApplication.talent.fullName}
                      </button>
                    ) : (
                      "—"
                    )
                  }
                  icon={<UserIcon className="w-4 h-4" />}
                />
                <InfoRow
                  label="Thời gian nộp hồ sơ"
                  value={new Date(application?.createdAt || "").toLocaleString("vi-VN")}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>
        )}

        {/* Nút xem thông tin tuyển dụng */}
        {jobRequest && activeTab === "profile" && !showJobSection && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowJobSection(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-soft transition-all duration-300 transform hover:scale-105"
            >
              <Briefcase className="w-5 h-5" />
              Xem chi tiết thông tin công việc
            </button>
          </div>
        )}

        {/* Thông tin tuyển dụng */}
        {jobRequest && showJobSection && activeTab !== "activities" && (
          <div className="mt-8 bg-white border border-neutral-100 rounded-2xl shadow-soft">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin tuyển dụng</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowJobSection(!showJobSection)}
                className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
              >
                {showJobSection ? "Thu gọn" : "Xem chi tiết"}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow
                  label="Công ty khách hàng"
                  value={clientCompanyName}
                  icon={<Building2 className="w-4 h-4" />}
                  onClick={detailedApplication?.clientCompany?.id ? openClientCompanyPopup : undefined}
                  showEyeIcon={false}
                />
                <InfoRow
                  label="Dự án"
                  value={projectName}
                  icon={<Layers className="w-4 h-4" />}
                  onClick={detailedApplication?.project?.id ? openProjectPopup : undefined}
                  showEyeIcon={false}
                />
                <InfoRow
                  label="Chế độ làm việc"
                  value={jobRequest?.workingMode === 1 ? "Tại văn phòng" : jobRequest?.workingMode === 2 ? "Từ xa" : "Linh hoạt"}
                  icon={<GraduationCap className="w-4 h-4" />}
                />
                <InfoRow
                  label="Địa điểm làm việc"
                  value={jobRequestLocationName}
                  icon={<MapPin className="w-4 h-4" />}
                />
                <InfoRow
                  label="Quy trình ứng tuyển"
                value={
                  templateSteps.length > 0 ? (
                    <button
                      type="button"
                      onClick={openProcessStepsPopup}
                      className="text-left font-semibold text-primary-700 hover:text-primary-800"
                      title="Xem các bước quy trình"
                    >
                      {applyProcessTemplateName}
                    </button>
                  ) : (
                    applyProcessTemplateName || "—"
                  )
                }
                icon={<FileCheck className="w-4 h-4" />}
              />
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
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
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Hoạt động tuyển dụng</h2>
                    {templateSteps.length > 0 && (
                      <div className="mt-1 space-y-1 text-xs text-neutral-500">
                        <p>
                          Tiến độ quy trình{" "}
                          {applyProcessTemplateName ? (
                            <button
                              type="button"
                              onClick={openProcessStepsPopup}
                              className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                              title="Xem các bước quy trình"
                            >
                              {applyProcessTemplateName}
                            </button>
                          ) : null}
                          :{" "}
                          <span className="font-semibold text-neutral-700">
                            {activities.length}/{templateSteps.length} bước đã có hoạt động
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            <div className="p-6">
              {activities.length === 0 ? (
                <p className="text-neutral-600">Chưa có hoạt động nào.</p>
              ) : (
                <div className="space-y-4">
                  {[...activities].sort((a, b) => a.id - b.id).map((activity, index) => {
                    const processStep = templateSteps.find(step => step.id === activity.processStepId);
                    const stepOrder = processStep?.stepOrder ?? index + 1;
                    const stepName = processStep?.stepName ?? `Bước ${stepOrder}`;

                    return (
                      <div
                        key={activity.id}
                        className="block p-5 border border-neutral-200 rounded-xl hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 hover:shadow-medium"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                              {stepOrder}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${activity.activityType === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {getActivityTypeLabel(activity.activityType)}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${getActivityStatusColor(activity.status)}`}>
                              {getActivityStatusLabel(activity.status)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900">{stepName}</h4>
                          <p className="text-sm text-neutral-600">{activity.notes || "Không có mô tả"}</p>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span>
                              📅 {activity.scheduledDate
                                ? new Date(activity.scheduledDate).toLocaleString("vi-VN")
                                : "Chưa lên lịch"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                      {talentData.fullName}
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
                  <InfoRow
                    label="Chế độ làm việc"
                    value={getWorkingModeDisplay(talentData.workingMode)}
                    icon={<GraduationCap className="w-4 h-4" />}
                  />
                  <InfoRow label="Địa điểm mong muốn" value={talentData.preferredLocation} icon={<MapPin className="w-4 h-4" />} />
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
                      <span className="text-emerald-700">{talentData.status}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Company Popup */}
        {isClientCompanyPopupOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeClientCompanyPopup();
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden border border-neutral-200">
              <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900">Thông tin công ty</h3>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {clientCompanyDetail?.name || "Đang tải..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeClientCompanyPopup}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                  aria-label="Đóng"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                {clientCompanyDetailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : clientCompanyDetail ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột 1: Mã công ty, Mã số thuế, Địa chỉ */}
                    <div className="space-y-4">
                      <InfoRow label="Mã công ty" value={clientCompanyDetail.code || "—"} icon={<Building2 className="w-4 h-4" />} />
                      <InfoRow label="Mã số thuế" value={clientCompanyDetail.taxCode || "—"} icon={<FileText className="w-4 h-4" />} />
                      <InfoRow label="Địa chỉ" value={clientCompanyDetail.address || "—"} icon={<MapPin className="w-4 h-4" />} />
                    </div>

                    {/* Cột 2: Người đại diện, Email, Số điện thoại */}
                    <div className="space-y-4">
                      <InfoRow label="Người đại diện" value={clientCompanyDetail.representativeName || clientCompanyDetail.contactPerson || "—"} icon={<UserIcon className="w-4 h-4" />} />
                      <InfoRow label="Email" value={clientCompanyDetail.email || "—"} icon={<Mail className="w-4 h-4" />} />
                      <InfoRow label="Số điện thoại" value={clientCompanyDetail.phone || "—"} icon={<Phone className="w-4 h-4" />} />
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-600">Không thể tải thông tin công ty.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Project Popup */}
        {isProjectPopupOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeProjectPopup();
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden border border-neutral-200">
              <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900">Thông tin dự án</h3>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {projectDetail?.name || "Đang tải..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeProjectPopup}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                  aria-label="Đóng"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                {projectDetailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : projectDetail ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột 1: Mã dự án, Trạng thái */}
                    <div className="space-y-4">
                      <InfoRow label="Mã dự án" value={projectDetail.code || "—"} icon={<Layers className="w-4 h-4" />} />
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-neutral-400">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <p className="text-neutral-500 text-sm font-medium">Trạng thái</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusStyle(projectDetail.status)}`}
                        >
                          {projectStatusLabels[projectDetail.status] || projectDetail.status || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Cột 2: Ngày bắt đầu, Ngày kết thúc */}
                    <div className="space-y-4">
                      <InfoRow
                        label="Ngày bắt đầu"
                        value={projectDetail.startDate ? new Date(projectDetail.startDate).toLocaleDateString('vi-VN') : "—"}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                      <InfoRow
                        label="Ngày kết thúc"
                        value={projectDetail.endDate ? new Date(projectDetail.endDate).toLocaleDateString('vi-VN') : "—"}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-600">Không thể tải thông tin dự án.</p>
                )}
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
              {templateSteps.length === 0 ? (
                <p className="text-sm text-neutral-600">Chưa có bước quy trình.</p>
              ) : (
                <div className="space-y-3">
                  {[...templateSteps]
                    .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
                    .map((step, idx) => (
                      <div
                        key={step.id || idx}
                        className="rounded-xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                            {step.stepOrder ?? idx + 1}
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
