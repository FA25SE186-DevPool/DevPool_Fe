import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { applyActivityService, type ApplyActivityCreate, ApplyActivityType, ApplyActivityStatus } from "../../../services/ApplyActivity";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { applyService } from "../../../services/Apply";
import { jobRequestService } from "../../../services/JobRequest";
import { 
  Plus, 
  Save, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  X,
  Clock
} from "lucide-react";

export default function ApplyActivityCreatePage() {
  const [searchParams] = useSearchParams();
  const applyId = searchParams.get('applyId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [processSteps, setProcessSteps] = useState<ApplyProcessStep[]>([]);
  const [existingActivities, setExistingActivities] = useState<number[]>([]);
  const [activitySchedules, setActivitySchedules] = useState<Record<number, string>>({});
  const [scheduleTouched, setScheduleTouched] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<string>("");
  
  const [form, setForm] = useState({
    applyId: Number(applyId) || 0,
    processStepId: 0,
    activityType: "" as any,
    scheduledDate: "",
    status: ApplyActivityStatus.Scheduled,
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy application để có jobRequestId và createdAt
        if (applyId) {
          const app = await applyService.getById(Number(applyId));
          
          // Lấy JobRequest để có applyProcessTemplateId
          const jobRequest = await jobRequestService.getById(app.jobRequestId);
          
          // Nếu có template, chỉ lấy các steps từ template đó
          if (jobRequest.applyProcessTemplateId) {
            const steps = await applyProcessStepService.getAll({ 
              templateId: jobRequest.applyProcessTemplateId 
            });
            setProcessSteps(steps);
          } else {
            // Nếu không có template, lấy tất cả steps
            const steps = await applyProcessStepService.getAll();
            setProcessSteps(steps);
          }

          // Lấy danh sách activity hiện có để tránh trùng bước
          try {
            const activities = await applyActivityService.getAll({ applyId: Number(applyId) });
            setExistingActivities(activities.map(activity => activity.processStepId).filter(id => id > 0));
            const scheduleMap: Record<number, string> = {};
            activities.forEach(activity => {
              if (activity.processStepId && activity.scheduledDate) {
                scheduleMap[activity.processStepId] = activity.scheduledDate;
              }
            });
            setActivitySchedules(scheduleMap);
          } catch (activityErr) {
            console.error("❌ Lỗi tải danh sách hoạt động hiện có:", activityErr);
            setExistingActivities([]);
            setActivitySchedules({});
          }
        } else {
          // Nếu không có applyId, lấy tất cả steps
          const steps = await applyProcessStepService.getAll();
          setProcessSteps(steps);
          setExistingActivities([]);
          setActivitySchedules({});
        }
      } catch (error) {
        console.error("❌ Error loading data", error);
      }
    };
    fetchData();
  }, [applyId]);

  const sortedSteps = useMemo(
    () => [...processSteps].sort((a, b) => a.stepOrder - b.stepOrder),
    [processSteps]
  );

  // Gợi ý bước đầu tiên chưa có activity (không bắt buộc)
  const suggestedStepId = useMemo(() => {
    const found = sortedSteps.find(step => !existingActivities.includes(step.id));
    return found?.id ?? null;
  }, [sortedSteps, existingActivities]);

  // Kiểm tra bước liền kề trước đã có scheduledDate chưa
  const canEditSchedule = useMemo(() => {
    if (!form.processStepId || sortedSteps.length === 0) return true;
    const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
    if (selectedIndex <= 0) return true; // Bước đầu tiên luôn được phép
    
    // Chỉ cần kiểm tra bước liền kề trước (bước ngay trước đó)
    const previousStep = sortedSteps[selectedIndex - 1];
    if (!activitySchedules[previousStep.id]) {
      // Bước liền kề trước chưa có scheduledDate
      return false;
    }
    return true; // Bước liền kề trước đã có scheduledDate
  }, [form.processStepId, sortedSteps, activitySchedules]);

  // Tìm bước liền kề trước chưa có scheduledDate (để hiển thị thông báo)
  const firstMissingScheduleStep = useMemo(() => {
    if (!form.processStepId || sortedSteps.length === 0) return null;
    const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
    if (selectedIndex <= 0) return null;
    
    // Chỉ kiểm tra bước liền kề trước
    const previousStep = sortedSteps[selectedIndex - 1];
    if (!activitySchedules[previousStep.id]) {
      return previousStep; // Trả về bước liền kề trước chưa có scheduledDate
    }
    return null;
  }, [form.processStepId, sortedSteps, activitySchedules]);

  const previousConstraint = useMemo(() => {
    if (!form.processStepId) return null;
    const orderedSteps = sortedSteps;
    const selectedIndex = orderedSteps.findIndex(step => step.id === form.processStepId);
    if (selectedIndex <= 0) return null;
    for (let i = selectedIndex - 1; i >= 0; i--) {
      const prevStep = orderedSteps[i];
      const schedule = activitySchedules[prevStep.id];
      if (schedule) {
        return { step: prevStep, date: schedule };
      }
    }
    return null;
  }, [form.processStepId, sortedSteps, activitySchedules]);

  // Helper: Format Date sang format cho datetime-local input (theo local time của browser)
  const formatDateTimeInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper: Lấy thời gian hiện tại (theo local time của browser - giờ Việt Nam)
  const getVietnamTime = (): Date => {
    return new Date();
  };

  // Helper: Convert UTC date string (từ backend) sang Date object local time
  const utcToVietnamDate = (utcDateString: string): Date => {
    // UTC date string từ backend, convert sang local time
    return new Date(utcDateString);
  };

  useEffect(() => {
    // Nếu người dùng đã tác động vào field, không tự động điền
    if (scheduleTouched) return;

    let baseDate: Date;
    
    if (previousConstraint) {
      // Activity tiếp theo: activity trước + 1 phút
      // previousConstraint.date là UTC string từ backend, convert sang local time
      const prevDateLocal = utcToVietnamDate(previousConstraint.date);
      baseDate = new Date(prevDateLocal.getTime() + 1 * 60 * 1000); // +1 phút
    } else {
      // Activity đầu tiên: thời gian hiện tại
      baseDate = getVietnamTime();
    }
    
    const currentValue = form.scheduledDate ? new Date(form.scheduledDate) : null;

    // Tự động điền nếu:
    // 1. Chưa có giá trị, HOẶC
    // 2. Giá trị hiện tại nhỏ hơn baseDate (quá khứ hoặc không hợp lệ)
    if (!currentValue || currentValue.getTime() < baseDate.getTime()) {
      setForm(prev => ({
        ...prev,
        scheduledDate: formatDateTimeInput(baseDate)
      }));
    }
  }, [previousConstraint, form.processStepId, scheduleTouched]);

  useEffect(() => {
    if (suggestedStepId) {
      setForm(prev => ({ ...prev, processStepId: suggestedStepId }));
      // Khi set suggestedStepId (activity đầu tiên), reset scheduleTouched để tự động điền thời gian hiện tại
      setScheduleTouched(false);
    }
  }, [suggestedStepId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset validation error khi thay đổi bước quy trình
    if (name === 'processStepId') {
      setDateValidationError("");
    }
    
    if (name === 'scheduledDate') {
      setScheduleTouched(true);
      setDateValidationError(""); // Reset error
      
      // Validation theo thứ tự bước
      if (value && form.processStepId) {
        const selectedStep = processSteps.find(step => step.id === form.processStepId);
        if (selectedStep) {
          const orderedSteps = [...processSteps].sort((a, b) => a.stepOrder - b.stepOrder);
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
      if (value && form.status === ApplyActivityStatus.Scheduled) {
        const selectedDate = new Date(value);
        const now = new Date();
        selectedDate.setSeconds(0, 0);
        now.setSeconds(0, 0);
        
        // Nếu chọn ngày quá khứ (trước bây giờ)
        if (selectedDate < now) {
          const confirmed = window.confirm("Đây có phải hoạt động đã hoàn thành?");
          if (confirmed) {
            setForm(prev => ({
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
    }
    
    setForm(prev => ({ 
      ...prev, 
      [name]: name === 'processStepId' || name === 'status'
        ? Number(value)
        : name === 'activityType'
          ? (value === "" ? "" : Number(value))
          : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (form.activityType === "" || form.activityType === undefined) {
      setError("⚠️ Vui lòng chọn loại hoạt động.");
      setLoading(false);
      return;
    }

    // Kiểm tra bước quy trình: phải có suggestedStepId (bước tiếp theo chưa có activity)
    if (!suggestedStepId || !form.processStepId || form.processStepId === 0) {
      setError("⚠️ Không còn bước quy trình nào để tạo hoạt động. Tất cả các bước đã có hoạt động.");
      setLoading(false);
      return;
    }

    if (!form.applyId) {
      setError("⚠️ Không tìm thấy thông tin hồ sơ ứng tuyển.");
      setLoading(false);
      return;
    }

    // scheduledDate không bắt buộc khi tạo activity (có thể để null)

    // Kiểm tra lỗi validation ngày
    if (dateValidationError) {
      setError(dateValidationError);
      setLoading(false);
      return;
    }

    if (form.scheduledDate) {
      const selectedStep = processSteps.find(step => step.id === form.processStepId);
      if (selectedStep) {
        const orderedSteps = [...processSteps].sort((a, b) => a.stepOrder - b.stepOrder);
        const selectedIndex = orderedSteps.findIndex(step => step.id === selectedStep.id);
        if (selectedIndex > 0) {
          const previousSteps = orderedSteps.slice(0, selectedIndex).reverse();
          const previousWithSchedule = previousSteps.find(step => activitySchedules[step.id]);
          if (previousWithSchedule) {
            // activitySchedules chứa UTC string từ backend, convert sang local time để so sánh
            const previousDate = new Date(activitySchedules[previousWithSchedule.id]);
            // form.scheduledDate là datetime-local string, parse theo local time
            const currentDate = new Date(form.scheduledDate);
            // So sánh: currentDate phải >= previousDate + 1 phút
            const minDate = new Date(previousDate.getTime() + 1 * 60 * 1000);
            if (currentDate.getTime() < minDate.getTime()) {
              setError(`⚠️ Thời gian cho bước "${selectedStep.stepName}" phải sau bước "${previousWithSchedule.stepName}" ít nhất 1 phút.`);
              setLoading(false);
              return;
            }
          }
        }
      }
    }


    // Yêu cầu nhập notes khi status là Failed (Passed thì tùy chọn)
    if (form.status === ApplyActivityStatus.Failed && 
        (!form.notes || form.notes.trim() === "")) {
      setError("⚠️ Vui lòng nhập ghi chú kết quả khi trạng thái là Failed.");
      setLoading(false);
      return;
    }

    try {
      // Convert local datetime to UTC
      let scheduledDateUTC: string | undefined = undefined;
      if (form.scheduledDate) {
        // form.scheduledDate là string từ datetime-local input (hiểu là giờ local)
        const localDate = new Date(form.scheduledDate);
        // new Date(...).toISOString() sẽ tự convert sang UTC đúng chuẩn
        scheduledDateUTC = localDate.toISOString();
      }

      const payload: ApplyActivityCreate = {
        applyId: form.applyId,
        processStepId: form.processStepId || 0,
        activityType: form.activityType as ApplyActivityType,
        scheduledDate: scheduledDateUTC,
        status: form.status,
        notes: form.notes || undefined,
      };
      console.log("ccc", payload);
      await applyActivityService.create(payload);

      // Sau khi tạo hoạt động đầu tiên, cập nhật trạng thái hồ sơ ứng tuyển
      try {
        if (form.applyId) {
          await applyService.updateStatus(form.applyId, { status: "Interviewing" });
        }
      } catch (statusErr) {
        console.error("❌ Lỗi cập nhật trạng thái hồ sơ ứng tuyển:", statusErr);
      }
      setSuccess(true);
      setTimeout(() => navigate(`/ta/applications/${form.applyId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Apply Activity:", err);
      setError("Không thể tạo hoạt động. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Hồ sơ ứng tuyển", to: "/ta/applications" },
              ...(form.applyId ? [{ label: `Hồ sơ #${form.applyId}`, to: `/ta/applications/${form.applyId}` }] : []),
              { label: "Tạo hoạt động mới" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo hoạt động tuyển dụng mới</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để tạo hoạt động tuyển dụng cho ứng viên
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200">
                <Plus className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  Tạo hoạt động mới
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
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Loại hoạt động */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Loại hoạt động <span className="text-red-500">*</span>
                </label>
                <select
                  name="activityType"
                  value={form.activityType}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="">-- Chọn loại hoạt động --</option>
                  <option value={ApplyActivityType.Online}>Online - Trực tuyến</option>
                  <option value={ApplyActivityType.Offline}>Offline - Trực tiếp</option>
                </select>
              </div>

              {/* Bước quy trình - Tự động chọn bước tiếp theo */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bước quy trình <span className="text-red-500">*</span>
                </label>
                {suggestedStepId ? (
                  <div className="w-full border border-primary-200 rounded-xl px-4 py-3 bg-primary-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          {(() => {
                            const selectedStep = sortedSteps.find(step => step.id === suggestedStepId);
                            return selectedStep ? `${selectedStep.stepOrder}. ${selectedStep.stepName}` : "Đang tải...";
                          })()}
                        </p>
                        <p className="text-xs text-primary-600 mt-1">
                          Tự động chọn bước tiếp theo chưa có hoạt động
                        </p>
                      </div>
                    </div>
                    {/* Hidden input để form vẫn có giá trị */}
                    <input
                      type="hidden"
                      name="processStepId"
                      value={suggestedStepId}
                    />
                  </div>
                ) : (
                  <div className="w-full border border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm font-medium text-amber-900">
                        Không còn bước quy trình nào để tạo hoạt động
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Trạng thái hoạt động
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-white text-neutral-700"
                >
                  <option value={ApplyActivityStatus.Scheduled}>Scheduled - Đã lên lịch (mặc định)</option>
                  <option value={ApplyActivityStatus.Completed} disabled>Completed - Hoàn thành</option>
                  <option value={ApplyActivityStatus.Passed} disabled>Passed - Đạt</option>
                  <option value={ApplyActivityStatus.Failed} disabled>Failed - Không đạt</option>
                </select>
                {form.status !== ApplyActivityStatus.Scheduled && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Vui lòng nhập kết quả/ghi chú ở phần Notes bên dưới
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin lịch trình</h2>
              </div>
            </div>
            <div className="p-6">
              {/* Ngày đã lên lịch */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ngày lên lịch
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    value={form.scheduledDate}
                    onChange={handleChange}
                    disabled={!canEditSchedule}
                    className={`flex-1 border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 ${
                      canEditSchedule 
                        ? "border-neutral-200 bg-white" 
                        : "border-neutral-300 bg-neutral-100 cursor-not-allowed opacity-60"
                    }`}
                  />
                  {form.scheduledDate && canEditSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleTouched(true);
                        setDateValidationError("");
                        setForm(prev => ({ ...prev, scheduledDate: "" }));
                      }}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      title="Xóa lịch"
                    >
                      Xóa lịch
                    </button>
                  )}
                </div>
                {!canEditSchedule && firstMissingScheduleStep && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      ⚠️ Không thể tạo lịch: Bước {firstMissingScheduleStep.stepOrder}. {firstMissingScheduleStep.stepName} chưa có lịch.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Vui lòng tạo/chỉnh sửa lịch cho các bước trước theo thứ tự từ bước đầu tiên.
                    </p>
                  </div>
                )}
                {!canEditSchedule && firstMissingScheduleStep && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      ⚠️ Không thể tạo lịch: Bước {firstMissingScheduleStep.stepOrder}. {firstMissingScheduleStep.stepName} chưa có lịch.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Vui lòng tạo/chỉnh sửa lịch cho các bước trước theo thứ tự từ bước đầu tiên.
                    </p>
                  </div>
                )}
                {dateValidationError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {dateValidationError}
                  </p>
                )}
                {!dateValidationError && canEditSchedule && previousConstraint && (
                  <p className="text-sm text-neutral-500 mt-2">
                    * Thời gian tối thiểu: sau{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    }).format(new Date(previousConstraint.date))}
                    {" "} (bước {previousConstraint.step.stepOrder}. {previousConstraint.step.stepName})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <FileText className="w-5 h-5 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Ghi chú</h3>
              </div>
            </div>
            <div className="p-6">
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={6}
                placeholder="Nhập ghi chú về hoạt động này..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
              />
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
                    ✅ Tạo hoạt động thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={form.applyId ? `/ta/applications/${form.applyId}` : "/ta/applications"}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo hoạt động
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}