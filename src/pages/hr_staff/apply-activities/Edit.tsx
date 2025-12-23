import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { applyActivityService, ApplyActivityType, ApplyActivityStatus } from "../../../services/ApplyActivity";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { applyService } from "../../../services/Apply";
import { jobRequestService } from "../../../services/JobRequest";
import { 
  Save, 
  X, 
  Calendar, 
  FileText, 
  AlertCircle,
  Clock
} from "lucide-react";

export default function ApplyActivityEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [processSteps, setProcessSteps] = useState<ApplyProcessStep[]>([]);
  const [jobRequest, setJobRequest] = useState<any>(null);
  
  const [form, setForm] = useState({
    applyId: 0,
    processStepId: 0,
    activityType: "" as any,
    scheduledDate: "",
    status: ApplyActivityStatus.Scheduled,
    notes: "",
  });
  const [activitySchedules, setActivitySchedules] = useState<Record<number, string>>({});
  const [dateValidationError, setDateValidationError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        // Fetch activity data
        const activityData = await applyActivityService.getById(Number(id));

        // Convert UTC từ backend sang local datetime cho input (datetime-local luôn hiểu là giờ local)
        let localDateTime = "";
        if (activityData.scheduledDate) {
          const d = new Date(activityData.scheduledDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        setForm({
          applyId: activityData.applyId,
          processStepId: activityData.processStepId,
          activityType: activityData.activityType,
          scheduledDate: localDateTime,
          status: activityData.status,
          notes: activityData.notes || "",
        });

        // Fetch related apply & job request to load template steps
        let templateSteps: ApplyProcessStep[] = [];
        try {
          const apply = await applyService.getById(activityData.applyId);
          if (apply?.jobRequestId) {
            const jobReq = await jobRequestService.getById(apply.jobRequestId);
            setJobRequest(jobReq);
            if (jobReq?.applyProcessTemplateId) {
              const stepsResponse = await applyProcessStepService.getAll({
                templateId: jobReq.applyProcessTemplateId,
                excludeDeleted: true,
              });
              templateSteps = Array.isArray(stepsResponse)
                ? stepsResponse
                : Array.isArray(stepsResponse?.data)
                  ? stepsResponse.data
                  : [];
            }
          }
        } catch (templateErr) {
          console.error("⚠️ Không thể tải quy trình mẫu của job request:", templateErr);
        }

        if (templateSteps.length === 0) {
          const fallbackSteps = await applyProcessStepService.getAll();
          templateSteps = Array.isArray(fallbackSteps)
            ? fallbackSteps
            : Array.isArray(fallbackSteps?.data)
              ? fallbackSteps.data
              : [];
        }
        setProcessSteps(templateSteps);

        // Fetch existing activities of this applyId để kiểm tra scheduledDate của các bước
        try {
          const activities = await applyActivityService.getAll({ applyId: activityData.applyId });
          const scheduleMap: Record<number, string> = {};
          // Lấy scheduledDate của TẤT CẢ activities (bao gồm cả activity hiện tại nếu đã có scheduledDate)
          activities
            .filter(activity => activity.processStepId && activity.scheduledDate)
            .forEach(activity => {
              scheduleMap[activity.processStepId] = activity.scheduledDate!;
            });
          // Nếu activity hiện tại đã có scheduledDate, thêm vào map để tính vào validation
          if (activityData.scheduledDate && activityData.processStepId) {
            scheduleMap[activityData.processStepId] = activityData.scheduledDate;
          }
          setActivitySchedules(scheduleMap);
        } catch (err) {
          console.error("❌ Lỗi tải danh sách hoạt động để disable bước:", err);
          setActivitySchedules({});
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin hoạt động!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const sortedSteps = useMemo(
    () => [...processSteps].sort((a, b) => a.stepOrder - b.stepOrder),
    [processSteps]
  );

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

  // Tự động gợi ý scheduledDate khi vào trang Edit:
  // - Chỉ auto-fill khi activity hiện tại CHƯA có scheduledDate (form.scheduledDate rỗng)
  // - Nếu là bước đầu tiên → gợi ý = thời gian hiện tại
  // - Nếu có bước liền trước đã có lịch → gợi ý = lịch bước trước + 1 phút
  // - Nếu bước trước chưa có lịch (và không phải bước đầu tiên) → để scheduledDate = null/empty
  useEffect(() => {
    if (!form.processStepId) return;
    if (form.scheduledDate && form.scheduledDate.trim() !== "") return;
    if (!sortedSteps.length) return;

    const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
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
      setForm(prev => ({
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

      setForm(prev => ({
        ...prev,
        scheduledDate: suggested,
      }));
    }
  }, [form.processStepId, form.scheduledDate, sortedSteps, activitySchedules]);

  const previousConstraint = useMemo(() => {
    if (!form.processStepId) return null;
    const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
    if (selectedIndex <= 0) return null;
    for (let i = selectedIndex - 1; i >= 0; i--) {
      const prevStep = sortedSteps[i];
      const schedule = activitySchedules[prevStep.id];
      if (schedule) {
        return { step: prevStep, date: schedule };
      }
    }
    return null;
  }, [form.processStepId, sortedSteps, activitySchedules]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset validation error khi thay đổi bước quy trình (mặc dù bước bị disabled trong Edit)
    if (name === 'processStepId') {
      setDateValidationError("");
    }
    
    if (name === 'scheduledDate') {
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
      [name]: name === 'processStepId' || name === 'status' ? Number(value) : 
              name === 'activityType' ? (value === "" ? "" : Number(value)) : 
              value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    if (form.activityType === "" || form.activityType === undefined) {
      setError("⚠️ Vui lòng chọn loại hoạt động.");
      setSaving(false);
      return;
    }


    // Validation: scheduledDate (startDate) là bắt buộc
    if (!form.scheduledDate || form.scheduledDate.trim() === "") {
      setError("⚠️ Vui lòng nhập ngày bắt đầu (scheduledDate).");
      setSaving(false);
      return;
    }

    // Yêu cầu nhập notes khi status là Failed (Passed thì tùy chọn)
    if (form.status === ApplyActivityStatus.Failed && 
        (!form.notes || form.notes.trim() === "")) {
      setError("⚠️ Vui lòng nhập ghi chú kết quả khi trạng thái là Failed.");
      setSaving(false);
      return;
    }

    try {
      // Convert local datetime to UTC
      let scheduledDateUTC: string | undefined = undefined;
      if (form.scheduledDate) {
        // form.scheduledDate là string từ datetime-local input (hiểu là giờ local)
        const localDate = new Date(form.scheduledDate);

        const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
        if (selectedIndex > 0) {
          const previousSteps = sortedSteps.slice(0, selectedIndex).reverse();
          const previousWithSchedule = previousSteps.find(step => activitySchedules[step.id]);
          if (previousWithSchedule) {
            // activitySchedules là UTC string từ BE, parse ra Date để so sánh cùng mốc thời gian
            const previousDate = new Date(activitySchedules[previousWithSchedule.id]);
            if (localDate.getTime() < previousDate.getTime()) {
              setError(`⚠️ Thời gian cho bước hiện tại phải sau hoặc bằng bước "${previousWithSchedule.stepName}".`);
              setSaving(false);
              return;
            }
          }
        }

        const nextSteps = sortedSteps.slice(selectedIndex + 1);
        const nextWithSchedule = nextSteps.find(step => activitySchedules[step.id]);
        if (nextWithSchedule) {
          const nextDate = new Date(activitySchedules[nextWithSchedule.id]);
          if (localDate.getTime() > nextDate.getTime()) {
            setError(`⚠️ Thời gian cho bước hiện tại phải trước hoặc bằng bước "${nextWithSchedule.stepName}".`);
            setSaving(false);
            return;
          }
        }

        // Gửi UTC chuẩn cho backend
        scheduledDateUTC = localDate.toISOString();
      }

      const payload = {
        applyId: form.applyId,
        processStepId: form.processStepId || 0,
        activityType: form.activityType as ApplyActivityType,
        scheduledDate: scheduledDateUTC,
        status: form.status as ApplyActivityStatus,
        notes: form.notes || undefined,
      };

      await applyActivityService.update(Number(id), payload);
      setSuccess(true);
      setTimeout(() => navigate(`/ta/apply-activities/${id}`), 1500);
    } catch (err) {
      console.error("❌ Error updating Apply Activity:", err);
      setError("Không thể cập nhật hoạt động. Vui lòng thử lại.");
    } finally {
      setSaving(false);
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              ...(jobRequest ? [
                { label: "Yêu cầu tuyển dụng", to: "/ta/job-requests" },
                { label: jobRequest.title || "Chi tiết yêu cầu", to: `/ta/job-requests/${jobRequest.id}` }
              ] : []),
              { label: "Hồ sơ ứng tuyển", to: "/ta/applications" },
              { label: form.applyId ? `Hồ sơ #${form.applyId}` : "Chi tiết", to: `/ta/applications/${form.applyId}` },
              { label: id ? `Hoạt động #${id}` : "Chi tiết", to: `/ta/apply-activities/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa hoạt động tuyển dụng</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin hoạt động tuyển dụng
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa hoạt động
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

              {/* Bước quy trình */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bước quy trình <span className="text-red-500">*</span>
                </label>
                <select
                  name="processStepId"
                  value={form.processStepId}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-100 cursor-not-allowed"
                  disabled
                >
                  {processSteps.map(step => (
                    <option
                      key={step.id}
                      value={step.id.toString()}
                    >
                      {step.stepOrder}. {step.stepName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-100 cursor-not-allowed"
                  disabled
                >
                  <option value="0">Scheduled - Đã lên lịch</option>
                  <option value="1">Completed - Hoàn thành</option>
                  <option value="2">Passed - Đạt</option>
                  <option value="3">Failed - Không đạt</option>
                  <option value="4">NoShow - Không có mặt</option>
                </select>
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
                  Ngày đã lên lịch
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
                  {form.scheduledDate && (
                    <button
                      type="button"
                      onClick={() => {
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
                      ⚠️ Không thể chỉnh sửa lịch: Bước {firstMissingScheduleStep.stepOrder}. {firstMissingScheduleStep.stepName} chưa có lịch.
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
                {!dateValidationError && form.scheduledDate && previousConstraint && (
                  <div className="mt-3 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium">
                    ⚠️ Phải sau {new Date(previousConstraint.date).toLocaleString('vi-VN')} (bước {previousConstraint.step.stepOrder}. {previousConstraint.step.stepName})
                  </div>
                )}
                {!dateValidationError && form.scheduledDate && (() => {
                  const selectedIndex = sortedSteps.findIndex(step => step.id === form.processStepId);
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
                  <AlertCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    Cập nhật hoạt động thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/apply-activities/${id}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}