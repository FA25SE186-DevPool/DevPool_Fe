import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/hr_staff/SidebarItems";
import { applyService, type Apply } from "../../../services/Apply";
import { talentApplicationService, type TalentApplicationDetailed } from "../../../services/TalentApplication";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { projectService } from "../../../services/Project";
import { clientCompanyService } from "../../../services/ClientCompany";
import { jobRoleLevelService } from "../../../services/JobRoleLevel";
import { jobRoleService } from "../../../services/JobRole";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { userService } from "../../../services/User";
import { applyActivityService, type ApplyActivity, type ApplyActivityCreate, ApplyActivityType, ApplyActivityStatus } from "../../../services/ApplyActivity";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { locationService } from "../../../services/location";
import { WorkingMode as WorkingModeEnum } from "../../../types/WorkingMode";
import { Button } from "../../../components/ui/button";
import {
  XCircle,
  FileText,
  User as UserIcon,
  Calendar,
  Briefcase,
  Eye,
  AlertCircle,
  X,
  Mail,
  Phone,
  Target,
  MapPin,
  GraduationCap,
  UserPlus,
  Users,
  User,
  Building2,
  FileCheck,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react";

const talentStatusLabels: Record<string, string> = {
  Available: "Sẵn sàng làm việc",
  Working: "Đang làm việc",
  Applying: "Đang ứng tuyển",
  Unavailable: "Không sẵn sàng",
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

const getActivityTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    [ApplyActivityType.Online]: "Trực tuyến",
    [ApplyActivityType.Offline]: "Trực tiếp"
  };
  return labels[type] || `Loại ${type}`;
};


export default function TalentCVApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [application, setApplication] = useState<Apply | null>(null);
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
  const [talentCV, setTalentCV] = useState<TalentCV | null>(null);
  const [submitterName, setSubmitterName] = useState<string>("");
  const [activities, setActivities] = useState<ApplyActivity[]>([]);
  const [processSteps, setProcessSteps] = useState<Record<number, ApplyProcessStep>>({});
  const [templateSteps, setTemplateSteps] = useState<ApplyProcessStep[]>([]);
  const [detailedApplication, setDetailedApplication] = useState<TalentApplicationDetailed | null>(null);
  const [talentLocationName, setTalentLocationName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [autoCreating, setAutoCreating] = useState(false);
  const [clientCompanyName, setClientCompanyName] = useState<string>("—");
  const [jobRoleName, setJobRoleName] = useState<string>("—");
  const [jobRoleLevelName, setJobRoleLevelName] = useState<string>("—");
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [applyProcessTemplateName, setApplyProcessTemplateName] = useState<string>("—");
  const [showDob, setShowDob] = useState(false);
  const [showFullCVSummary, setShowFullCVSummary] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ApplyActivity | null>(null);
  const [editActivityForm, setEditActivityForm] = useState<{
    activityType: ApplyActivityType;
    processStepId: number;
    scheduledDate: string;
    status: ApplyActivityStatus;
  }>({
    activityType: ApplyActivityType.Online,
    processStepId: 0,
    scheduledDate: "",
    status: ApplyActivityStatus.Scheduled,
  });
  const [updatingActivity, setUpdatingActivity] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<string>("");
  const [activitySchedules, setActivitySchedules] = useState<Record<number, string>>({});
  const [scheduleTouched, setScheduleTouched] = useState(false);
  const [showStatusNoteDialog, setShowStatusNoteDialog] = useState(false);
  const [statusNoteDialogTargetStatus, setStatusNoteDialogTargetStatus] = useState<ApplyActivityStatus | null>(null);
  const [statusNoteInput, setStatusNoteInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick notes cho status update
  const quickRejectNotes = [
    "Ứng viên không đáp ứng yêu cầu kỹ năng kỹ thuật.",
    "Ứng viên thiếu kinh nghiệm làm việc cần thiết.",
    "Ứng viên không phù hợp với văn hóa công ty.",
    "Kết quả phỏng vấn không đạt yêu cầu.",
  ];

  const quickPassNotes = [
    "Ứng viên đáp ứng đầy đủ yêu cầu kỹ năng kỹ thuật.",
    "Ứng viên có kinh nghiệm phù hợp với vị trí.",
    "Ứng viên phù hợp với văn hóa công ty.",
    "Kết quả phỏng vấn tốt, đạt yêu cầu.",
  ];

  // Kiểm tra xem bước trước đã pass chưa
  const checkCanUpdateStep = useCallback(async (stepOrder: number): Promise<boolean> => {
    if (!editingActivity) return true;
    const stepOrders = templateSteps.map(step => step.stepOrder);
    const minStepOrder = stepOrders.length > 0 ? Math.min(...stepOrders) : 1;
    if (stepOrder <= minStepOrder) return true;

    let relevantSteps = templateSteps;
    if (!relevantSteps.length) {
      try {
        const allSteps = await applyProcessStepService.getAll();
        relevantSteps = Array.isArray(allSteps)
          ? allSteps
          : Array.isArray(allSteps?.data)
            ? allSteps.data
            : [];
      } catch {
        relevantSteps = [];
      }
    }

    const previousStep = relevantSteps.find(step => step.stepOrder === stepOrder - 1);
    if (!previousStep) return true;

    const previousStepActivity = activities.find(act => act.processStepId === previousStep.id);
    if (!previousStepActivity) return true;

    return previousStepActivity.status === ApplyActivityStatus.Passed;
  }, [editingActivity, templateSteps, activities]);

  // Lấy các trạng thái có thể chuyển từ trạng thái hiện tại
  const getAllowedNextStatuses = useCallback((currentStatus: number): number[] => {
    if (!editingActivity || !application) return [];
    
    if (application.status === 'Withdrawn') {
      return [];
    }

    // Không cho đổi trạng thái cho tới khi TẤT CẢ các bước của quy trình đã được tạo activity
    try {
      if (templateSteps.length > 0) {
        const requiredStepIds = new Set(templateSteps.map(s => s.id));
        const createdStepIds = new Set(activities.map(a => a.processStepId));
        const allCreated = Array.from(requiredStepIds).every(id => createdStepIds.has(id));
        if (!allCreated) {
          return [];
        }
      }
    } catch { }

    if (!editingActivity.processStepId) return [];
    const currentStep = templateSteps.find(step => step.id === editingActivity.processStepId);
    if (!currentStep) return [];

    const canUpdateStep = () => {
      if (currentStep.stepOrder <= 1) return true;
      const previousStep = templateSteps.find(step => step.stepOrder === currentStep.stepOrder - 1);
      if (!previousStep) return true;
      const previousActivity = activities.find(act => act.processStepId === previousStep.id);
      return previousActivity?.status === ApplyActivityStatus.Passed;
    };

    const canUpdate = canUpdateStep();

    switch (currentStatus) {
      case ApplyActivityStatus.Scheduled:
        return canUpdate ? [ApplyActivityStatus.Completed] : [];
      case ApplyActivityStatus.Completed:
        return [ApplyActivityStatus.Failed, ApplyActivityStatus.Passed];
      case ApplyActivityStatus.Failed:
      case ApplyActivityStatus.Passed:
      case ApplyActivityStatus.NoShow:
        return [];
      default:
        return [];
    }
  }, [editingActivity, application, templateSteps, activities]);

  const getActivityStatusLabel = (status: number): string => {
    const labels: Record<number, string> = {
      [ApplyActivityStatus.Scheduled]: "Đã lên lịch",
      [ApplyActivityStatus.Completed]: "Hoàn thành",
      [ApplyActivityStatus.Passed]: "Đạt",
      [ApplyActivityStatus.Failed]: "Không đạt",
      [ApplyActivityStatus.NoShow]: "Không có mặt"
    };
    return labels[status] || `Trạng thái ${status}`;
  };

  const handleActivityStatusUpdate = async (newStatus: ApplyActivityStatus) => {
    if (!editingActivity) return;

    // ✅ Kiểm tra scheduledDate: Khi đổi trạng thái phải bắt buộc có scheduledDate
    if (!editActivityForm.scheduledDate || editActivityForm.scheduledDate.trim() === "") {
      alert("⚠️ Vui lòng thêm ngày lên lịch trước khi thay đổi trạng thái!");
      return;
    }

    // Nếu đang ở Completed và chuyển sang Passed hoặc Failed, yêu cầu nhập note
    if (editingActivity.status === ApplyActivityStatus.Completed && 
        (newStatus === ApplyActivityStatus.Passed || newStatus === ApplyActivityStatus.Failed)) {
      setStatusNoteDialogTargetStatus(newStatus);
      setStatusNoteInput("");
      setShowStatusNoteDialog(true);
      return;
    }

    // Nếu là trạng thái "Không đạt" (không từ Completed), hiển thị modal dialog
    if (newStatus === ApplyActivityStatus.Failed) {
      setStatusNoteDialogTargetStatus(ApplyActivityStatus.Failed);
      setStatusNoteInput("");
      setShowStatusNoteDialog(true);
      return;
    }

    const confirm = window.confirm(`⚠️ Bạn có chắc muốn thay đổi trạng thái thành "${getActivityStatusLabel(newStatus)}"?`);
    if (!confirm) return;

    await performStatusUpdate(newStatus);
  };

  const handleCancelStatusNoteDialog = () => {
    setShowStatusNoteDialog(false);
    setStatusNoteDialogTargetStatus(null);
    setStatusNoteInput("");
  };

  const handleConfirmStatusNoteDialog = async () => {
    const note = statusNoteInput.trim();
    // Chỉ bắt buộc note khi status là Failed, Passed thì tùy chọn
    if (!note && statusNoteDialogTargetStatus === ApplyActivityStatus.Failed) {
      alert(`⚠️ Vui lòng nhập ghi chú khi thay đổi trạng thái sang "Không đạt"`);
      return;
    }
    
    if (!statusNoteDialogTargetStatus) return;
    
    await performStatusUpdate(statusNoteDialogTargetStatus, note);
    setShowStatusNoteDialog(false);
    setStatusNoteDialogTargetStatus(null);
    setStatusNoteInput("");
  };

  const performStatusUpdate = async (newStatus: ApplyActivityStatus, notes?: string) => {
    if (!editingActivity) return;

    try {
      setIsUpdatingStatus(true);
      
      // Kiểm tra xem bước trước đã pass chưa (chỉ khi đổi sang Completed)
      if (newStatus === ApplyActivityStatus.Completed) {
        const currentStep = templateSteps.find(step => step.id === editingActivity.processStepId);
        if (currentStep && currentStep.stepOrder > 1) {
          const canUpdate = await checkCanUpdateStep(currentStep.stepOrder);
          if (!canUpdate) {
            alert("⚠️ Không thể cập nhật! Bước trước chưa đạt. Vui lòng hoàn thành bước trước trước.");
            setIsUpdatingStatus(false);
            return;
          }
        }
      }

      // Cập nhật status trong form
      setEditActivityForm(prev => ({ ...prev, status: newStatus }));

      // Nếu có notes, cần cập nhật activity với notes
      if (notes) {
        await applyActivityService.update(editingActivity.id, {
          status: newStatus,
          notes: notes,
        });
      } else {
        await applyActivityService.updateStatus(editingActivity.id, { 
          status: newStatus,
        });
      }

      // Nếu status là Completed, tự động cập nhật application status thành Interviewing
      if (newStatus === ApplyActivityStatus.Completed && application) {
        try {
          const currentAppStatus = application.status;
          // Chỉ cập nhật nếu application chưa ở trạng thái Interviewing hoặc sau đó
          if (currentAppStatus !== 'Interviewing' && currentAppStatus !== 'Hired' && currentAppStatus !== 'Rejected' && currentAppStatus !== 'Withdrawn') {
            await applyService.updateStatus(application.id, { status: 'Interviewing' });
            setApplication({ ...application, status: 'Interviewing' });
          }
        } catch (err) {
          console.error("❌ Lỗi cập nhật trạng thái application:", err);
        }
      }

      // Kiểm tra nếu tất cả các bước trong quy trình đều pass, tự động chuyển application sang Hired
      if (newStatus === ApplyActivityStatus.Passed && application) {
        try {
          // Reload activities để lấy dữ liệu mới nhất
          const activitiesData = await applyActivityService.getAll({ applyId: editingActivity.applyId });
          
          // Kiểm tra tất cả bước trong quy trình đều đã có activity và ở trạng thái Passed
          let allStepsPassed = true;
          for (const step of templateSteps) {
            const stepActivity = activitiesData.find(act => act.processStepId === step.id);
            if (!stepActivity || stepActivity.status !== ApplyActivityStatus.Passed) {
              allStepsPassed = false;
              break;
            }
          }

          // Nếu tất cả bước đều pass và application đang ở Interviewing, chuyển sang Hired
          if (allStepsPassed && application.status === 'Interviewing') {
            await applyService.updateStatus(application.id, { status: 'Hired' });
            setApplication({ ...application, status: 'Hired' });
            alert(`✅ Đã cập nhật trạng thái thành công!\n🎉 Tất cả các bước đã hoàn thành, tự động chuyển application sang trạng thái Hired (Đã tuyển)!`);
            await fetchData();
            setEditingActivity(null);
            setEditActivityForm({
              activityType: ApplyActivityType.Online,
              processStepId: 0,
              scheduledDate: "",
              status: ApplyActivityStatus.Scheduled,
            });
            setIsUpdatingStatus(false);
            return;
          }
        } catch (err) {
          console.error("❌ Lỗi kiểm tra tất cả bước:", err);
        }
      }

      // Reload dữ liệu để cập nhật UI
      await fetchData();
      setEditingActivity(null);
      setEditActivityForm({
        activityType: ApplyActivityType.Online,
        processStepId: 0,
        scheduledDate: "",
        status: ApplyActivityStatus.Scheduled,
      });
      setScheduleTouched(false);
      setDateValidationError("");
      alert(`✅ Đã cập nhật trạng thái thành công!`);
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      alert("Không thể cập nhật trạng thái!");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Tính toán sortedSteps từ templateSteps
  const sortedSteps = useMemo(
    () => [...templateSteps].sort((a, b) => a.stepOrder - b.stepOrder),
    [templateSteps]
  );

  // Kiểm tra bước liền kề trước đã có scheduledDate chưa
  const canEditSchedule = useMemo(() => {
    if (!editingActivity) return false;
    
    // Không cho sửa lịch khi đã ở trạng thái Hoàn thành (Completed) hoặc các trạng thái sau đó
    if (editingActivity.status === ApplyActivityStatus.Completed ||
        editingActivity.status === ApplyActivityStatus.Passed ||
        editingActivity.status === ApplyActivityStatus.Failed ||
        editingActivity.status === ApplyActivityStatus.NoShow) {
      return false;
    }
    
    if (!editingActivity.processStepId || sortedSteps.length === 0) return true;
    const selectedIndex = sortedSteps.findIndex(step => step.id === editingActivity.processStepId);
    if (selectedIndex <= 0) return true; // Bước đầu tiên luôn được phép
    
    // Chỉ cần kiểm tra bước liền kề trước (bước ngay trước đó)
    const previousStep = sortedSteps[selectedIndex - 1];
    if (!activitySchedules[previousStep.id]) {
      // Bước liền kề trước chưa có scheduledDate
      return false;
    }
    return true; // Bước liền kề trước đã có scheduledDate
  }, [editingActivity, sortedSteps, activitySchedules]);

  // Tìm bước liền kề trước chưa có scheduledDate (để hiển thị thông báo)
  const firstMissingScheduleStep = useMemo(() => {
    if (!editingActivity?.processStepId || sortedSteps.length === 0) return null;
    const selectedIndex = sortedSteps.findIndex(step => step.id === editingActivity.processStepId);
    if (selectedIndex <= 0) return null;
    
    // Chỉ kiểm tra bước liền kề trước
    const previousStep = sortedSteps[selectedIndex - 1];
    if (!activitySchedules[previousStep.id]) {
      return previousStep; // Trả về bước liền kề trước chưa có scheduledDate
    }
    return null;
  }, [editingActivity, sortedSteps, activitySchedules]);

  // Tìm bước liền kề trước có scheduledDate
  const previousConstraint = useMemo(() => {
    if (!editingActivity?.processStepId) return null;
    const selectedIndex = sortedSteps.findIndex(step => step.id === editingActivity.processStepId);
    if (selectedIndex <= 0) return null;
    for (let i = selectedIndex - 1; i >= 0; i--) {
      const prevStep = sortedSteps[i];
      const schedule = activitySchedules[prevStep.id];
      if (schedule) {
        return { step: prevStep, date: schedule };
      }
    }
    return null;
  }, [editingActivity, sortedSteps, activitySchedules]);

  // Tự động gợi ý scheduledDate khi mở popup:
  // - Chỉ auto-fill khi activity hiện tại CHƯA có scheduledDate (editActivityForm.scheduledDate rỗng)
  // - Nếu là bước đầu tiên → gợi ý = thời gian hiện tại
  // - Nếu có bước liền trước đã có lịch → gợi ý = lịch bước trước + 1 phút
  // - Nếu bước trước chưa có lịch (và không phải bước đầu tiên) → để scheduledDate = null/empty
  useEffect(() => {
    if (!editingActivity?.processStepId) return;
    if (scheduleTouched) return;
    if (editActivityForm.scheduledDate && editActivityForm.scheduledDate.trim() !== "") return;
    if (!sortedSteps.length) return;

    const selectedIndex = sortedSteps.findIndex(step => step.id === editingActivity.processStepId);
    let baseDate: Date | null = null;
    let shouldSetEmpty = false;

    // Nếu là bước đầu tiên → dùng thời gian hiện tại
    if (selectedIndex <= 0) {
      baseDate = new Date();
    } else {
      // Nếu không phải bước đầu tiên, thử lấy lịch của bước liền trước
      const previousStep = sortedSteps[selectedIndex - 1];
      const prevSchedule = activitySchedules[previousStep.id];
      if (prevSchedule) {
        const prevDate = new Date(prevSchedule); // UTC string từ BE -> Date (mốc thời gian tuyệt đối)
        baseDate = new Date(prevDate.getTime() + 1 * 60 * 1000); // +1 phút
      } else {
        // Bước trước chưa có lịch → để scheduledDate = null/empty
        shouldSetEmpty = true;
      }
    }

    if (shouldSetEmpty) {
      // Để scheduledDate = null/empty khi bước trước chưa có lịch
      setEditActivityForm(prev => ({
        ...prev,
        scheduledDate: "",
      }));
    } else if (baseDate) {
      // Format về yyyy-MM-ddTHH:mm cho input datetime-local (theo local time)
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, "0");
      const day = String(baseDate.getDate()).padStart(2, "0");
      const hours = String(baseDate.getHours()).padStart(2, "0");
      const minutes = String(baseDate.getMinutes()).padStart(2, "0");

      const suggested = `${year}-${month}-${day}T${hours}:${minutes}`;

      setEditActivityForm(prev => ({
        ...prev,
        scheduledDate: suggested,
      }));
    }
  }, [editingActivity, sortedSteps, activitySchedules, scheduleTouched, editActivityForm.scheduledDate]);

  const fetchData = useCallback(async () => {
    let currentApplication: Apply | null = null;
    try {
      setLoading(true);

      // Fetch application
      const appData = await applyService.getById(Number(id));
      currentApplication = appData;

      // Fetch related data in parallel
      const [jobReqData, cvData] = await Promise.all([
        jobRequestService.getById(appData.jobRequestId),
        talentCVService.getById(appData.cvId)
      ]);

      setJobRequest(jobReqData);
      setTalentCV(cvData);

      let fetchedTemplateSteps: ApplyProcessStep[] = [];
      if (jobReqData?.applyProcessTemplateId) {
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
        } catch (err) {
          console.error("❌ Lỗi tải bước quy trình ứng tuyển:", err);
        }
      } else {
        fetchedTemplateSteps = [];
      }
      setTemplateSteps(fetchedTemplateSteps);

      // Enrich JobRequest: client company, job role level/name, remaining slots
      try {
        // Client company via project
        if (jobReqData.projectId) {
          try {
            const proj = await projectService.getById(jobReqData.projectId);
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
            setClientCompanyName("—");
          }
        } else {
          setClientCompanyName("—");
        }

        // Job role level and role
        if (jobReqData.jobRoleLevelId) {
          try {
            const level = await jobRoleLevelService.getById(jobReqData.jobRoleLevelId);
            setJobRoleLevelName(level?.name ?? "—");
            if (level?.jobRoleId) {
              try {
                const role = await jobRoleService.getById(level.jobRoleId);
                setJobRoleName(role?.name ?? "—");
              } catch {
                setJobRoleName("—");
              }
            } else {
              setJobRoleName("—");
            }
          } catch {
            setJobRoleLevelName("—");
            setJobRoleName("—");
          }
        } else {
          setJobRoleLevelName("—");
          setJobRoleName("—");
        }

        // Apply process template name
        try {
          if (jobReqData.applyProcessTemplateId) {
            const tpl = await applyProcessTemplateService.getById(jobReqData.applyProcessTemplateId);
            setApplyProcessTemplateName(tpl?.name ?? "—");
          } else {
            setApplyProcessTemplateName("—");
          }
        } catch {
          setApplyProcessTemplateName("—");
        }

        // Remaining slots = quantity - count(Submitted/Interviewing/Hired)
        try {
          const allApps = await talentApplicationService.getAll({
            jobRequestId: jobReqData.id,
            excludeDeleted: true,
          });
          const appsArray: any[] = Array.isArray(allApps) ? allApps : [];
          const qualifying = new Set(["Submitted", "Interviewing", "Hired"]);
          const used = appsArray.filter(a => qualifying.has(a.status)).length;
          const qty = jobReqData.quantity ?? 0;
          setRemainingSlots(Math.max(qty - used, 0));
        } catch {
          setRemainingSlots(null);
        }
      } catch {
        // ignore enrich errors
      }

      // Fetch detailed application info (talent, project, client company)
      let foundApplication: TalentApplicationDetailed | null = null;
      try {
        // Thử dùng getDetailedById để lấy updatedAt chính xác
        try {
          foundApplication = await talentApplicationService.getDetailedById(appData.id);
          setDetailedApplication(foundApplication);
        } catch {
          // Fallback: dùng getByJobRequest nếu getDetailedById không có
          const detailedResponse = await talentApplicationService.getByJobRequest(appData.jobRequestId);
          foundApplication = detailedResponse?.data?.applications?.find(app => app.id === appData.id) ?? null;
          setDetailedApplication(foundApplication);
        }

        if (foundApplication?.talent?.locationId) {
          try {
            const location = await locationService.getById(foundApplication.talent.locationId);
            setTalentLocationName(location.name);
          } catch {
            setTalentLocationName("—");
          }
        } else {
          setTalentLocationName("—");
        }
      } catch (err) {
        console.error("❌ Lỗi tải thông tin chi tiết ứng viên:", err);
        setDetailedApplication(null);
        setTalentLocationName("—");
      }

      // Fetch submitter name
      try {
        const user = await userService.getById(appData.submittedBy);
        setSubmitterName(user.fullName);
      } catch {
        setSubmitterName(appData.submittedBy);
      }

      // Fetch activities
      try {
        const activitiesData = await applyActivityService.getAll({ applyId: appData.id });
        setActivities(activitiesData);

        // Fetch process steps for activities
        const stepIds = [...new Set(activitiesData.map(a => a.processStepId).filter(id => id > 0))];
        const stepsMap: Record<number, ApplyProcessStep> = {};
        const templateMap = new Map<number, ApplyProcessStep>();
        fetchedTemplateSteps.forEach(step => {
          stepsMap[step.id] = step;
          templateMap.set(step.id, step);
        });

        const missingStepIds = stepIds.filter(id => !templateMap.has(id));
        if (missingStepIds.length > 0) {
          const stepPromises = missingStepIds.map(id =>
            applyProcessStepService.getById(id).catch(() => null)
          );
          const steps = await Promise.all(stepPromises);
          steps.forEach(step => {
            if (step) {
              stepsMap[step.id] = step;
            }
          });
        }
        setProcessSteps(stepsMap);
      } catch (err) {
        console.error("❌ Lỗi tải activities:", err);
      }
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết Application:", err);
    } finally {
      setLoading(false);
      setApplication(currentApplication);
    }
  }, [id]);

  const handleDeleteAllActivities = async () => {
    if (!application || activities.length === 0) return;
    
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tất cả ${activities.length} hoạt động? Hành động này không thể hoàn tác.`
    );
    
    if (!confirmed) return;

    try {
      setDeletingAll(true);
      // Xóa tất cả activities
      await Promise.all(activities.map(activity => applyActivityService.delete(activity.id)));
      
      // Refresh data
      await fetchData();
      alert(`✅ Đã xóa ${activities.length} hoạt động thành công!`);
    } catch (err) {
      console.error("❌ Lỗi xóa activities:", err);
      alert("Không thể xóa tất cả hoạt động. Vui lòng thử lại.");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleAutoCreateActivities = async () => {
    if (!application || !jobRequest || autoCreating) return;

    try {
      setAutoCreating(true);

      if (!templateSteps.length) {
        alert("⚠️ Job request này chưa cấu hình quy trình mẫu, không thể tự động tạo hoạt động.");
        return;
      }

      // Sắp xếp bước theo thứ tự tăng dần
      const sortedSteps = [...templateSteps].sort((a, b) => a.stepOrder - b.stepOrder);

      // Xây map để truy ra step theo order
      const orderToStep = new Map<number, ApplyProcessStep>();
      const idToStep = new Map<number, ApplyProcessStep>();
      sortedSteps.forEach((s) => {
        orderToStep.set(s.stepOrder, s);
        idToStep.set(s.id, s);
      });

      // Tập các processStepId đã có activity và activity Passed
      const existingByStepId = new Map<number, ApplyActivity>();
      const passedByStepId = new Set<number>();
      activities.forEach((act) => {
        if (!existingByStepId.has(act.processStepId)) {
          existingByStepId.set(act.processStepId, act);
        }
        if (act.status === ApplyActivityStatus.Passed) {
          passedByStepId.add(act.processStepId);
        }
      });

      // Tự động tạo tối đa có thể: duyệt theo thứ tự, tôn trọng ràng buộc "bước trước phải Passed"
      const createdList: ApplyActivity[] = [];
      
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        if (existingByStepId.has(step.id)) continue;
        // BỎ VALID: không cần bước trước phải đạt mới được thêm activity
        try {
          // Tạo activity tự động không cần scheduledDate (để null)
          const payload: any = {
            applyId: application.id,
            processStepId: step.id,
            activityType: ApplyActivityType.Online,
            status: ApplyActivityStatus.Scheduled,
            scheduledDate: undefined, // ✅ Tạo tự động không cần lịch, để null
            notes: step.description
              ? `Tự động tạo từ bước "${step.stepName}": ${step.description}`
              : `Tự động tạo từ bước "${step.stepName}"`
          };

          const created = await applyActivityService.create(payload);
          createdList.push(created);
          existingByStepId.set(step.id, created as any);
        } catch (e) {
          // dừng nếu BE từ chối (ví dụ chưa pass bước trước)
          break;
        }
      }

      if (createdList.length === 0) {
        alert("ℹ️ Không có bước nào đủ điều kiện để tạo thêm (bước trước chưa đạt hoặc tất cả đã tồn tại).");
        return;
      }

      setActivities(prev => [...prev, ...createdList].sort((a, b) => a.id - b.id));

      // Nếu là lần tạo đầu tiên và application đang ở Submitted -> chuyển sang Interviewing
      try {
        const hasAnyActivity = activities && activities.length > 0;
        if (!hasAnyActivity && application.status === 'Submitted') {
          await applyService.updateStatus(application.id, { status: 'Interviewing' });
          setApplication({ ...application, status: 'Interviewing' });
        }
      } catch (statusErr) {
        console.error("⚠️ Không thể cập nhật trạng thái application sang Interviewing:", statusErr);
      }

      await fetchData();
      alert(`✅ Đã tạo ${createdList.length} hoạt động theo quy trình!`);
    } catch (err) {
      console.error("❌ Lỗi tạo hoạt động tự động:", err);
      alert("Không thể tự động tạo hoạt động. Vui lòng thử lại.");
    } finally {
      setAutoCreating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, fetchData, location.key]);

  // Giữ lại nếu cần dùng cho mục đích khác trong tương lai (hiện không dùng để ẩn nút)
  // const allProcessStepsCovered = useMemo(() => {
  //   if (!templateSteps.length) return false;
  //   const coveredStepIds = new Set(activities.map(activity => activity.processStepId));
  //   return templateSteps.every(step => coveredStepIds.has(step.id));
  // }, [templateSteps, activities]);

  // Còn bước nào chưa tạo activity?
  const hasRemainingSteps = useMemo(() => {
    if (!templateSteps.length) return false;
    const existingByStepId = new Set<number>(activities.map(a => a.processStepId));
    return templateSteps.some(step => !existingByStepId.has(step.id));
  }, [templateSteps, activities]);

  // Tính toán last updated time và kiểm tra idle 7 ngày - DI CHUYỂN LÊN TRƯỚC EARLY RETURN
  const getLastUpdatedTime = useMemo(() => {
    // Ưu tiên: updatedAt > last activity scheduledDate > createdAt
    let lastUpdated: Date | null = null;
    
    if (detailedApplication?.updatedAt) {
      lastUpdated = new Date(detailedApplication.updatedAt);
    } else if (activities.length > 0) {
      // Lấy activity có scheduledDate gần nhất
      const sortedActivities = [...activities]
        .filter(a => a.scheduledDate)
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
  }, [detailedApplication, activities, application]);

  const isIdle7Days = useMemo(() => {
    if (!getLastUpdatedTime) return false;
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - getLastUpdatedTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate >= 7;
  }, [getLastUpdatedTime]);

  // Kiểm tra xem có activity nào đã hoàn thành không (Completed, Passed, Failed, NoShow)
  const hasCompletedActivity = useMemo(() => {
    return activities.some(activity => 
      activity.status === ApplyActivityStatus.Completed ||
      activity.status === ApplyActivityStatus.Passed ||
      activity.status === ApplyActivityStatus.Failed ||
      activity.status === ApplyActivityStatus.NoShow
    );
  }, [activities]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !application) return;

    try {
      await applyService.updateStatus(Number(id), { status: newStatus });
      setApplication({ ...application, status: newStatus });

      // Nếu là Withdrawn, cập nhật trạng thái activities
      if (newStatus === 'Withdrawn') {
        try {
          const wasInterviewing = application.status === 'Interviewing';

          const updates = await Promise.all(
            activities.map(async activity => {
              if (wasInterviewing) {
                if (activity.status === ApplyActivityStatus.Completed) {
                  await applyActivityService.updateStatus(activity.id, { status: ApplyActivityStatus.Failed });
                  return { ...activity, status: ApplyActivityStatus.Failed };
                }
                if (activity.status === ApplyActivityStatus.Passed || activity.status === ApplyActivityStatus.Failed) {
                  return activity;
                }
                if (activity.status !== ApplyActivityStatus.NoShow) {
                  await applyActivityService.updateStatus(activity.id, { status: ApplyActivityStatus.NoShow });
                  return { ...activity, status: ApplyActivityStatus.NoShow };
                }
                return activity;
              } else {
                if (activity.status !== ApplyActivityStatus.NoShow) {
                  await applyActivityService.updateStatus(activity.id, { status: ApplyActivityStatus.NoShow });
                  return { ...activity, status: ApplyActivityStatus.NoShow };
                }
                return activity;
              }
            })
          );

          setActivities(updates);
        } catch (err) {
          console.error("❌ Lỗi cập nhật trạng thái activities:", err);
        }
      }

      alert(`✅ Đã cập nhật trạng thái thành công!`);
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      alert("Không thể cập nhật trạng thái!");
    }
  };

  // Helper functions to check activity statuses
  const hasFailedActivity = () => {
    return activities.some(activity => activity.status === ApplyActivityStatus.Failed);
  };

  // const hasApprovedActivity = () => {
  //   return activities.some(activity_result => activity.status === ApplyActivityStatus.Approved);
  // };

  // Helper functions - moved after all hooks
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
      "Withdrawn": {
        label: "Đã rút",
        color: "bg-gray-100 text-gray-800",
        bgColor: "bg-gray-50"
      },
      "Rejected": {
        label: "Đã từ chối",
        color: "bg-red-100 text-red-800",
        bgColor: "bg-red-50"
      },
      "Expired": {
        label: "Đã hết hạn",
        color: "bg-gray-100 text-gray-800",
        bgColor: "bg-gray-50"
      },
      "ClosedBySystem": {
        label: "Đã đóng bởi hệ thống",
        color: "bg-red-100 text-red-800",
        bgColor: "bg-red-50"
      }
    };

    return (
      configs[status] || {
        label: status,
        color: "bg-neutral-100 text-neutral-800",
        bgColor: "bg-neutral-50"
      }
    );
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu hồ sơ ứng tuyển...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy hồ sơ ứng tuyển</p>
            <Link
              to="/ta/applications"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const statusAllowsActivityCreation =
    ["Submitted", "Interviewing"].includes(application.status) &&
    application.status !== "Expired" &&
    application.status !== "ClosedBySystem";

  // Cho phép tạo hoạt động (thủ công) khi còn bước chưa tạo và trạng thái cho phép
  const canCreateNextActivity = statusAllowsActivityCreation && hasRemainingSteps;

  // Chỉ cho phép tự động tạo khi chưa có hoạt động nào
  const canAutoCreateActivities = canCreateNextActivity && activities.length === 0;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    } catch {
      return dateString;
    }
  };

  const getWorkingModeDisplay = (workingMode?: number) => {
    if (!workingMode) return "—";
    const labels: { value: number; label: string }[] = [
      { value: WorkingModeEnum.Onsite, label: "Tại văn phòng" },
      { value: WorkingModeEnum.Remote, label: "Làm từ xa" },
      { value: WorkingModeEnum.Hybrid, label: "Kết hợp" },
      { value: WorkingModeEnum.Flexible, label: "Linh hoạt" },
    ];

    const matched = labels
      .filter(item => (workingMode & item.value) === item.value)
      .map(item => item.label);

    return matched.length > 0 ? matched.join(", ") : "—";
  };

  const getTalentStatusLabel = (status?: string | null) => {
    if (!status) return "—";
    return talentStatusLabels[status] ?? status;
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatLastUpdatedTime = () => {
    if (!getLastUpdatedTime) return "—";
    try {
      return getLastUpdatedTime.toLocaleString("vi-VN", {
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
    if (!getLastUpdatedTime) return 0;
    return Math.floor(
      (new Date().getTime() - getLastUpdatedTime.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              ...(jobRequest ? [
                { label: "Yêu cầu tuyển dụng", to: "/ta/job-requests" },
                { label: jobRequest.title || "Chi tiết yêu cầu", to: `/ta/job-requests/${jobRequest.id}` }
              ] : [
                { label: "Hồ sơ ứng tuyển", to: "/ta/applications" }
              ]),
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
                <div 
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor} border border-neutral-200 relative group`}
                  title={application.status === "Expired" || application.status === "ClosedBySystem" 
                    ? "Tự động đóng bởi hệ thống do quá 30 ngày không có hoạt động." 
                    : ""}
                >
                  <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                  {(application.status === "Expired" || application.status === "ClosedBySystem") && (
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                  )}
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
              {application.status === 'Submitted' ? (
                <Button
                  onClick={() => handleStatusUpdate('Withdrawn')}
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft transform hover:scale-105 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Rút lui
                </Button>
              ) : application.status === 'Interviewing' ? (
                <>
                  {hasFailedActivity() && (
                    <Button
                      onClick={() => handleStatusUpdate('Rejected')}
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                      <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Từ chối
                    </Button>
                  )}
                  <Button
                    onClick={() => handleStatusUpdate('Withdrawn')}
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft transform hover:scale-105 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                  >
                    <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Rút lui
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin hồ sơ */}
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
                <InfoRow label="TA phụ trách" value={submitterName || application.submittedBy} icon={<UserIcon className="w-4 h-4" />} />
                <InfoRow label="Thời gian nộp hồ sơ" value={new Date(application.createdAt).toLocaleString('vi-VN')} icon={<Calendar className="w-4 h-4" />} />
              </div>
            </div>

            {/* Thông tin tuyển dụng */}
            {jobRequest && (
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
                  <InfoRow label="Công ty khách hàng" value={clientCompanyName} icon={<Building2 className="w-4 h-4" />} />
                  <InfoRow label="Loại vị trí tuyển dụng" value={jobRoleName} icon={<User className="w-4 h-4" />} />
                  <InfoRow label="Vị trí tuyển dụng" value={jobRoleLevelName} icon={<Users className="w-4 h-4" />} />
                  <InfoRow
                    label="Chế độ làm việc"
                    value={getWorkingModeDisplay(jobRequest.workingMode)}
                    icon={<GraduationCap className="w-4 h-4" />}
                  />
                  <InfoRow label="Quy trình ứng tuyển" value={applyProcessTemplateName} icon={<FileCheck className="w-4 h-4" />} />
                  <InfoRow
                    label="Số lượng tuyển dụng"
                    value={(() => {
                      const qty = jobRequest.quantity ?? 0;
                      if (remainingSlots === null || remainingSlots === undefined) {
                        return `${qty} (—)`;
                      }
                      if (remainingSlots === 0) {
                        return `${qty} (Đã đủ)`;
                      }
                      return `${qty} (${remainingSlots}/${qty} còn lại)`;
                    })()}
                    icon={<UserPlus className="w-4 h-4" />}
                  />

                  {showJobDetails && (
                    <>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <p className="text-neutral-500 text-sm font-medium">Mô tả công việc</p>
                        </div>
                        {jobRequest.description ? (
                          <div
                            className="prose prose-sm text-gray-700 leading-relaxed max-w-none"
                            dangerouslySetInnerHTML={{ __html: jobRequest.description }}
                          />
                        ) : (
                          <p className="text-gray-500 italic">Chưa có mô tả</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-neutral-400" />
                          <p className="text-neutral-500 text-sm font-medium">Yêu cầu ứng viên</p>
                        </div>
                        {jobRequest.requirements ? (
                          <div
                            className="prose prose-sm text-gray-700 leading-relaxed max-w-none"
                            dangerouslySetInnerHTML={{ __html: jobRequest.requirements }}
                          />
                        ) : (
                          <p className="text-gray-500 italic">Chưa có yêu cầu ứng viên</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Hoạt động */}
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Hoạt động tuyển dụng</h2>
                      {templateSteps.length > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Tiến độ quy trình:{" "}
                          <span className="font-semibold text-neutral-700">
                            {activities.length}/{templateSteps.length} bước đã có hoạt động
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {canCreateNextActivity && (
                      <>
                        {/* Nút tạo hoạt động thủ công: luôn hiển thị khi còn bước và trạng thái cho phép */}
                        <Button
                          onClick={() => navigate(`/ta/apply-activities/create?applyId=${application.id}`)}
                          disabled={!statusAllowsActivityCreation}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${!statusAllowsActivityCreation ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"}`}
                        >
                          <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Tạo hoạt động
                        </Button>

                        {/* Nút tự động tạo: chỉ hiển thị khi chưa có hoạt động nào */}
                        {canAutoCreateActivities && (
                          <Button
                            onClick={handleAutoCreateActivities}
                            disabled={!statusAllowsActivityCreation || autoCreating}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${!statusAllowsActivityCreation || autoCreating ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"}`}
                          >
                            <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {autoCreating ? "Đang tạo..." : "Tự động tạo"}
                          </Button>
                        )}
                      </>
                    )}
                    {activities.length > 0 && !hasCompletedActivity && (
                      <Button
                        onClick={handleDeleteAllActivities}
                        disabled={deletingAll}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${deletingAll ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"}`}
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {deletingAll ? "Đang xóa..." : "Xóa hết"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                {activities.length === 0 ? (
                  <p className="text-sm text-neutral-500">Chưa có hoạt động nào.</p>
                ) : (
                  <div className="space-y-4">
                    {/* System log nếu application bị auto-close */}
                    {(application.status === "Expired" || application.status === "ClosedBySystem") && (
                      <div className="p-5 border border-neutral-200 rounded-xl bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">System auto-closed (Inactivity {'>'} 30 days).</p>
                            <p className="text-xs text-gray-600">Hệ thống tự động đóng hồ sơ do không có hoạt động trong 30 ngày.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {[...activities].sort((a, b) => a.id - b.id).map((activity, index) => {
                      const processStep = processSteps[activity.processStepId];
                      const formattedDate = activity.scheduledDate
                        ? new Date(activity.scheduledDate).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : null;

                      return (
                        <div key={activity.id} className="block p-5 border border-neutral-200 rounded-xl hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 hover:shadow-medium">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">{index + 1}</span>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${activity.activityType === ApplyActivityType.Online ? 'bg-blue-100 text-blue-800' : activity.activityType === ApplyActivityType.Offline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{getActivityTypeLabel(activity.activityType)}</span>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${activity.status === ApplyActivityStatus.Scheduled ? 'bg-gray-100 text-gray-800' : activity.status === ApplyActivityStatus.Completed ? 'bg-blue-100 text-blue-800' : activity.status === ApplyActivityStatus.Passed ? 'bg-green-100 text-green-800' : activity.status === ApplyActivityStatus.Failed ? 'bg-red-100 text-red-800' : activity.status === ApplyActivityStatus.NoShow ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>{getActivityStatusLabel(activity.status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {formattedDate && (
                                <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-lg">
                                  <Calendar className="w-4 h-4 text-neutral-500" />
                                  <span className="text-xs text-neutral-700 font-medium">{formattedDate}</span>
                                </div>
                              )}
                              <Button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingActivity(activity);
                                  setScheduleTouched(false);
                                  setDateValidationError("");
                                  
                                  // Convert UTC từ backend sang local datetime cho input
                                  let localDateTime = "";
                                  if (activity.scheduledDate) {
                                    const d = new Date(activity.scheduledDate);
                                    const year = d.getFullYear();
                                    const month = String(d.getMonth() + 1).padStart(2, "0");
                                    const day = String(d.getDate()).padStart(2, "0");
                                    const hours = String(d.getHours()).padStart(2, "0");
                                    const minutes = String(d.getMinutes()).padStart(2, "0");
                                    localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                                  }

                                  setEditActivityForm({
                                    activityType: activity.activityType,
                                    processStepId: activity.processStepId || 0,
                                    scheduledDate: localDateTime,
                                    status: activity.status,
                                  });

                                  // Fetch existing activities để tính activitySchedules
                                  try {
                                    const allActivities = await applyActivityService.getAll({ applyId: activity.applyId });
                                    const scheduleMap: Record<number, string> = {};
                                    allActivities
                                      .filter(a => a.processStepId && a.scheduledDate)
                                      .forEach(a => {
                                        scheduleMap[a.processStepId] = a.scheduledDate!;
                                      });
                                    // Nếu activity hiện tại đã có scheduledDate, thêm vào map
                                    if (activity.scheduledDate && activity.processStepId) {
                                      scheduleMap[activity.processStepId] = activity.scheduledDate;
                                    }
                                    setActivitySchedules(scheduleMap);
                                  } catch (err) {
                                    console.error("❌ Lỗi tải danh sách hoạt động:", err);
                                    setActivitySchedules({});
                                  }
                                }}
                                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition-all duration-300"
                              >
                                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Sửa
                              </Button>
                              <Link
                                to={`/ta/apply-activities/${activity.id}`}
                                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all duration-300"
                              >
                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Xem
                              </Link>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {processStep && (
                              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                                <Briefcase className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-blue-600 font-medium mb-0.5">Bước quy trình</p>
                                  <p className="text-sm text-blue-900 font-semibold">{processStep.stepName}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {activity.notes && (
                            <div className="mt-3 pt-3 border-t border-neutral-200">
                              <p className="text-xs text-neutral-500 font-semibold mb-1.5 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Ghi chú
                              </p>
                              <p className="text-sm text-neutral-700 leading-relaxed">{activity.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Thông tin ứng viên */}
            {detailedApplication?.talent && (
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
                  <InfoRow label="Tên ứng viên" value={detailedApplication.talent.fullName} icon={<UserIcon className="w-4 h-4" />} />
                  <InfoRow label="Email" value={detailedApplication.talent.email} icon={<Mail className="w-4 h-4" />} />
                  <InfoRow label="Số điện thoại" value={detailedApplication.talent.phone || "—"} icon={<Phone className="w-4 h-4" />} />
                  <InfoRow label="Chế độ làm việc" value={getWorkingModeDisplay(detailedApplication.talent.workingMode)} icon={<GraduationCap className="w-4 h-4" />} />
                  <InfoRow label="Địa điểm mong muốn" value={talentLocationName} icon={<MapPin className="w-4 h-4" />} />
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-neutral-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <p className="text-neutral-500 text-sm font-medium">Trạng thái hiện tại</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold ${talentStatusStyles[detailedApplication.talent.status ?? ""]?.badgeClass || "bg-neutral-50 border border-neutral-200"}`}
                    >
                      <span
                        className={`${talentStatusStyles[detailedApplication.talent.status ?? ""]?.textClass || "text-neutral-700"}`}
                      >
                        {getTalentStatusLabel(detailedApplication.talent.status)}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowDob(!showDob)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      {showDob ? "Ẩn ngày sinh" : "Hiển thị ngày sinh"}
                    </button>
                    {showDob && (
                      <InfoRow label="Ngày sinh" value={formatDate(detailedApplication.talent.dateOfBirth)} icon={<Calendar className="w-4 h-4" />} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin CV */}
            {talentCV && (
              <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft">
                <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <FileText className="w-5 h-5 text-secondary-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Thông tin CV</h2>
                  </div>
                  {talentCV.cvFileUrl && (
                    <Button
                      onClick={() => window.open(talentCV.cvFileUrl, '_blank')}
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transform hover:scale-105"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Xem CV
                    </Button>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow label="Phiên bản" value={talentCV.version ? `v${talentCV.version}` : ""} icon={<FileText className="w-4 h-4" />} />
                    <InfoRow
                      label="Ngày cập nhật CV"
                      value={(talentCV as { updatedAt?: string | null })?.updatedAt ? formatDateTime((talentCV as { updatedAt?: string | null })?.updatedAt) : "Chưa cập nhật"}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                  {talentCV.summary && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <p className="text-neutral-600 text-sm font-semibold">Tóm tắt</p>
                        </div>
                        {(() => {
                          const textLen = (talentCV.summary || "").length;
                          const maxLen = 240;
                          return textLen > maxLen;
                        })() && (
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
                        {(() => {
                          const text = talentCV.summary || "";
                          if (showFullCVSummary) return text;
                          const maxLen = 240; // khoảng 2–3 dòng
                          return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Edit className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa hoạt động</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingActivity(null);
                    setEditActivityForm({
                      activityType: ApplyActivityType.Online,
                      processStepId: 0,
                      scheduledDate: "",
                      status: ApplyActivityStatus.Scheduled,
                    });
                    setScheduleTouched(false);
                    setDateValidationError("");
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingActivity) return;

                // Validation: scheduledDate là bắt buộc
                if (!editActivityForm.scheduledDate || editActivityForm.scheduledDate.trim() === "") {
                  setDateValidationError("⚠️ Vui lòng nhập ngày bắt đầu (scheduledDate).");
                  return;
                }

                // Validation: kiểm tra thứ tự với các bước khác
                if (editActivityForm.scheduledDate && editActivityForm.processStepId) {
                  const selectedIndex = sortedSteps.findIndex(step => step.id === editActivityForm.processStepId);
                  const localDate = new Date(editActivityForm.scheduledDate);

                  if (selectedIndex > 0) {
                    const previousSteps = sortedSteps.slice(0, selectedIndex).reverse();
                    const previousWithSchedule = previousSteps.find(step => activitySchedules[step.id]);
                    if (previousWithSchedule) {
                      const previousDate = new Date(activitySchedules[previousWithSchedule.id]);
                      if (localDate.getTime() < previousDate.getTime()) {
                        setDateValidationError(`⚠️ Thời gian cho bước hiện tại phải sau hoặc bằng bước "${previousWithSchedule.stepName}".`);
                        return;
                      }
                    }
                  }

                  const nextSteps = sortedSteps.slice(selectedIndex + 1);
                  const nextWithSchedule = nextSteps.find(step => activitySchedules[step.id]);
                  if (nextWithSchedule) {
                    const nextDate = new Date(activitySchedules[nextWithSchedule.id]);
                    if (localDate.getTime() > nextDate.getTime()) {
                      setDateValidationError(`⚠️ Thời gian cho bước hiện tại phải trước hoặc bằng bước "${nextWithSchedule.stepName}".`);
                      return;
                    }
                  }
                }

                try {
                  setUpdatingActivity(true);
                  setDateValidationError("");

                  // Convert local datetime to UTC
                  let scheduledDateUTC: string | undefined = undefined;
                  if (editActivityForm.scheduledDate) {
                    const localDate = new Date(editActivityForm.scheduledDate);
                    scheduledDateUTC = localDate.toISOString();
                  }

                  const payload: Partial<ApplyActivityCreate> = {
                    applyId: editingActivity.applyId,
                    processStepId: editActivityForm.processStepId || editingActivity.processStepId || 0,
                    activityType: editActivityForm.activityType,
                    scheduledDate: scheduledDateUTC,
                    status: editActivityForm.status as ApplyActivityStatus,
                    notes: editingActivity.notes || undefined,
                  };

                  await applyActivityService.update(editingActivity.id, payload);
                  
                  // Reload dữ liệu để cập nhật UI với dữ liệu đầy đủ từ API
                  await fetchData();

                  setEditingActivity(null);
                  setEditActivityForm({
                    activityType: ApplyActivityType.Online,
                    processStepId: 0,
                    scheduledDate: "",
                    status: ApplyActivityStatus.Scheduled,
                  });
                  setScheduleTouched(false);
                  setDateValidationError("");
                  alert("✅ Đã cập nhật hoạt động thành công!");
                } catch (err) {
                  console.error("❌ Lỗi cập nhật hoạt động:", err);
                  alert("Không thể cập nhật hoạt động. Vui lòng thử lại.");
                } finally {
                  setUpdatingActivity(false);
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Loại hoạt động */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Loại hoạt động <span className="text-red-500">*</span>
                </label>
                <select
                  name="activityType"
                  value={editActivityForm.activityType}
                  onChange={(e) => {
                    setEditActivityForm(prev => ({
                      ...prev,
                      activityType: Number(e.target.value) as ApplyActivityType,
                    }));
                  }}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value={ApplyActivityType.Online}>Online - Trực tuyến</option>
                  <option value={ApplyActivityType.Offline}>Offline - Trực tiếp</option>
                </select>
              </div>

              {/* Bước quy trình */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bước quy trình <span className="text-red-500">*</span>
                </label>
                <select
                  name="processStepId"
                  value={editActivityForm.processStepId}
                  onChange={(e) => {
                    setEditActivityForm(prev => ({
                      ...prev,
                      processStepId: Number(e.target.value),
                    }));
                  }}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-100 cursor-not-allowed"
                  disabled
                >
                  {sortedSteps.map(step => (
                    <option
                      key={step.id}
                      value={step.id.toString()}
                    >
                      {step.stepOrder}. {step.stepName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thông tin lịch trình */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Thông tin lịch trình
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={editActivityForm.scheduledDate}
                    onChange={(e) => {
                      setScheduleTouched(true);
                      setDateValidationError("");
                      const value = e.target.value;
                      
                      // Validation theo thứ tự bước
                      if (value && editActivityForm.processStepId) {
                        const selectedStep = sortedSteps.find(step => step.id === editActivityForm.processStepId);
                        if (selectedStep) {
                          const orderedSteps = [...sortedSteps].sort((a, b) => a.stepOrder - b.stepOrder);
                          const selectedIndex = orderedSteps.findIndex(step => step.id === selectedStep.id);
                          const selectedDate = new Date(value);
                          
                          // Kiểm tra với bước trước
                          if (selectedIndex > 0) {
                            const previousSteps = orderedSteps.slice(0, selectedIndex).reverse();
                            const previousWithSchedule = previousSteps.find(step => activitySchedules[step.id]);
                            if (previousWithSchedule) {
                              const previousDate = new Date(activitySchedules[previousWithSchedule.id]);
                              if (selectedDate.getTime() < previousDate.getTime()) {
                                setDateValidationError(`⚠️ Thời gian cho bước "${selectedStep.stepName}" phải sau hoặc bằng bước "${previousWithSchedule.stepName}" (${new Date(activitySchedules[previousWithSchedule.id]).toLocaleString('vi-VN')}).`);
                                return; // Không cập nhật nếu vi phạm
                              }
                            }
                          }
                          
                          // Kiểm tra với bước sau
                          const nextSteps = orderedSteps.slice(selectedIndex + 1);
                          const nextWithSchedule = nextSteps.find(step => activitySchedules[step.id]);
                          if (nextWithSchedule) {
                            const nextDate = new Date(activitySchedules[nextWithSchedule.id]);
                            if (selectedDate.getTime() > nextDate.getTime()) {
                              setDateValidationError(`⚠️ Thời gian cho bước "${selectedStep.stepName}" phải trước hoặc bằng bước "${nextWithSchedule.stepName}" (${new Date(activitySchedules[nextWithSchedule.id]).toLocaleString('vi-VN')}).`);
                              return; // Không cập nhật nếu vi phạm
                            }
                          }
                        }
                      }
                      
                      // Smart UX: Nếu chọn ngày quá khứ khi Status = Scheduled → tự chuyển sang Completed
                      if (value && editActivityForm.status === ApplyActivityStatus.Scheduled) {
                        const selectedDate = new Date(value);
                        const now = new Date();
                        selectedDate.setSeconds(0, 0);
                        now.setSeconds(0, 0);
                        
                        // Nếu chọn ngày quá khứ (trước bây giờ)
                        if (selectedDate < now) {
                          const confirmed = window.confirm("Đây có phải hoạt động đã hoàn thành?");
                          if (confirmed) {
                            setEditActivityForm(prev => ({
                              ...prev,
                              scheduledDate: value,
                              status: ApplyActivityStatus.Completed
                            }));
                            // Không return để cho phép cập nhật scheduledDate
                          } else {
                            // Nếu không xác nhận, không cập nhật scheduledDate (giữ nguyên giá trị cũ)
                            return;
                          }
                        }
                      }
                      
                      setEditActivityForm(prev => ({ ...prev, scheduledDate: value }));
                    }}
                    disabled={!canEditSchedule}
                    className={`flex-1 border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 ${
                      canEditSchedule 
                        ? "border-neutral-200 bg-white" 
                        : "border-neutral-300 bg-neutral-100 cursor-not-allowed opacity-60"
                    }`}
                  />
                  {editActivityForm.scheduledDate && canEditSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateValidationError("");
                        setEditActivityForm(prev => ({ ...prev, scheduledDate: "" }));
                        setScheduleTouched(true);
                      }}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
                      title="Xóa lịch"
                    >
                      Xóa lịch
                    </button>
                  )}
                </div>
                {!canEditSchedule && editingActivity && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    {editingActivity.status === ApplyActivityStatus.Completed ||
                     editingActivity.status === ApplyActivityStatus.Passed ||
                     editingActivity.status === ApplyActivityStatus.Failed ||
                     editingActivity.status === ApplyActivityStatus.NoShow ? (
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        ⚠️ Không thể chỉnh sửa lịch: Hoạt động đã ở trạng thái "{getActivityStatusLabel(editingActivity.status)}".
                      </p>
                    ) : firstMissingScheduleStep ? (
                      <>
                        <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          ⚠️ Không thể chỉnh sửa lịch: Bước {firstMissingScheduleStep.stepOrder}. {firstMissingScheduleStep.stepName} chưa có lịch.
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Vui lòng tạo/chỉnh sửa lịch cho các bước trước theo thứ tự từ bước đầu tiên.
                        </p>
                      </>
                    ) : null}
                  </div>
                )}
                {dateValidationError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {dateValidationError}
                  </p>
                )}
                {!dateValidationError && editActivityForm.scheduledDate && previousConstraint && (
                  <div className="mt-3 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium">
                    ⚠️ Phải sau {new Date(previousConstraint.date).toLocaleString('vi-VN')} (bước {previousConstraint.step.stepOrder}. {previousConstraint.step.stepName})
                  </div>
                )}
                {!dateValidationError && editActivityForm.scheduledDate && editActivityForm.processStepId && (() => {
                  const selectedIndex = sortedSteps.findIndex(step => step.id === editActivityForm.processStepId);
                  const nextSteps = sortedSteps.slice(selectedIndex + 1);
                  const nextWithSchedule = nextSteps.find(step => activitySchedules[step.id]);
                  if (!nextWithSchedule) return null;
                  return (
                    <div className="mt-3 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                      ⚠️ Phải trước {new Date(activitySchedules[nextWithSchedule.id]).toLocaleString('vi-VN')} (bước {nextWithSchedule.stepOrder}. {nextWithSchedule.stepName})
                    </div>
                  );
                })()}
              </div>

              {/* Thay đổi trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Thay đổi trạng thái
                </label>
                {(() => {
                  if (!editingActivity) return null;
                  const allowedStatuses = getAllowedNextStatuses(editingActivity.status);

                  if (allowedStatuses.length === 0) {
                    let message = "Không thể cập nhật trạng thái từ trạng thái hiện tại";
                    if (application?.status === 'Withdrawn') {
                      message = "Không thể cập nhật trạng thái vì ứng viên đã rút khỏi quy trình tuyển dụng";
                    } else if (editingActivity.status === ApplyActivityStatus.Scheduled) {
                      const currentStep = templateSteps.find(step => step.id === editingActivity.processStepId);
                      if (currentStep && currentStep.stepOrder > 1) {
                        message = "⚠️ Vui lòng hoàn thành bước trước (đạt trạng thái Đạt)";
                      }
                    }

                    return (
                      <div className="text-center py-4 border border-neutral-200 rounded-xl bg-neutral-50">
                        <p className="text-neutral-500 font-medium text-sm">{message}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-3">
                      {allowedStatuses.includes(ApplyActivityStatus.Completed) && (
                        <button
                          type="button"
                          onClick={() => handleActivityStatusUpdate(ApplyActivityStatus.Completed)}
                          disabled={isUpdatingStatus}
                          className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Clock className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Hoàn thành
                        </button>
                      )}
                      {allowedStatuses.includes(ApplyActivityStatus.Passed) && (
                        <button
                          type="button"
                          onClick={() => handleActivityStatusUpdate(ApplyActivityStatus.Passed)}
                          disabled={isUpdatingStatus}
                          className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Target className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Đạt
                        </button>
                      )}
                      {allowedStatuses.includes(ApplyActivityStatus.Failed) && (
                        <button
                          type="button"
                          onClick={() => handleActivityStatusUpdate(ApplyActivityStatus.Failed)}
                          disabled={isUpdatingStatus}
                          className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <AlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Không đạt
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null);
                    setEditActivityForm({
                      activityType: ApplyActivityType.Online,
                      processStepId: 0,
                      scheduledDate: "",
                      status: ApplyActivityStatus.Scheduled,
                    });
                  }}
                  className="px-6 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-all font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingActivity}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {updatingActivity ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Note Dialog - cho Passed hoặc Failed */}
      {showStatusNoteDialog && statusNoteDialogTargetStatus !== null && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingStatus) {
              handleCancelStatusNoteDialog();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {statusNoteDialogTargetStatus === ApplyActivityStatus.Passed 
                  ? "Ghi chú kết quả" 
                  : "Ghi rõ lý do từ chối"}
              </h3>
              <button
                onClick={handleCancelStatusNoteDialog}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Đóng"
                disabled={isUpdatingStatus}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-neutral-600">
                {statusNoteDialogTargetStatus === ApplyActivityStatus.Passed
                  ? "Vui lòng nhập ghi chú về kết quả để ứng viên và các bộ phận liên quan dễ dàng xử lý."
                  : "Vui lòng nhập lý do để ứng viên và các bộ phận liên quan dễ dàng xử lý và điều chỉnh."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(statusNoteDialogTargetStatus === ApplyActivityStatus.Failed ? quickRejectNotes : quickPassNotes).map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setStatusNoteInput((prev) => (prev ? `${prev}\n${note}` : note))}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {note}
                  </button>
                ))}
              </div>
              <textarea
                value={statusNoteInput}
                onChange={(e) => setStatusNoteInput(e.target.value)}
                rows={4}
                placeholder={statusNoteDialogTargetStatus === ApplyActivityStatus.Passed ? "Nhập ghi chú kết quả..." : "Nhập lý do từ chối..."}
                className={`w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800 focus:ring-2 resize-none ${
                  statusNoteDialogTargetStatus === ApplyActivityStatus.Passed
                    ? "focus:border-green-500 focus:ring-green-200"
                    : "focus:border-red-500 focus:ring-red-200"
                }`}
                disabled={isUpdatingStatus}
              />
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelStatusNoteDialog}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusNoteDialog}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  statusNoteDialogTargetStatus === ApplyActivityStatus.Passed
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isUpdatingStatus 
                  ? "Đang xử lý..." 
                  : statusNoteDialogTargetStatus === ApplyActivityStatus.Passed
                    ? "Xác nhận Đạt"
                    : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
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