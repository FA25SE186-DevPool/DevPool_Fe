import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentAvailableTimeService, type TalentAvailableTimeCreate, type TalentAvailableTime } from "../../../services/TalentAvailableTime";
import { 
  Plus, 
  Save, 
  Calendar, 
  Clock,
  AlertCircle, 
  CheckCircle,
  X
} from "lucide-react";

export default function TalentAvailableTimeCreatePage() {
  const [searchParams] = useSearchParams();
  const talentId = searchParams.get('talentId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TalentAvailableTimeCreate>({
    talentId: talentId ? Number(talentId) : 0,
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Validation functions
  const validateStartTime = (dateTime: string): boolean => {
    if (!dateTime) return false;
    const startDateTime = new Date(dateTime);
    const now = new Date();
    return startDateTime > now;
  };

  const validateEndTime = (startDateTime: string, endDateTime: string | undefined): boolean => {
    if (!endDateTime) return true; // End time is optional
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // End time phải sau start time
    if (end <= start) return false;
    
    return true;
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateTime = (value?: string) => {
    if (!value) return "Không xác định";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Không xác định";
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  const formatRange = (slot: TalentAvailableTime) => {
    const start = formatDateTime(slot.startTime);
    const end = slot.endTime ? formatDateTime(slot.endTime) : "Không xác định";
    return `${start} - ${end}`;
  };

  const findOverlappingSlot = (existing: TalentAvailableTime[], newStart: Date, newEnd?: Date) => {
    const effectiveNewEnd = newEnd ?? new Date(8640000000000000); // ~ Infinity

    for (const slot of existing) {
      const slotStart = new Date(slot.startTime);
      const slotEnd = slot.endTime ? new Date(slot.endTime) : new Date(8640000000000000);

      if (newStart < slotEnd && slotStart < effectiveNewEnd) {
        return slot;
      }
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };
    
    // Validate startTime
    if (name === 'startTime') {
      if (value && !validateStartTime(value)) {
        newErrors.startTime = 'Thời gian bắt đầu phải trong tương lai';
      } else {
        delete newErrors.startTime;
      }
      // Re-validate endTime if startTime changes
      if (form.endTime && value) {
        if (!validateEndTime(value, form.endTime)) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          delete newErrors.endTime;
        }
      }
    }
    
    // Validate endTime
    if (name === 'endTime') {
      if (value && form.startTime) {
        if (!validateEndTime(form.startTime, value)) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          delete newErrors.endTime;
        }
      } else if (value && !form.startTime) {
        newErrors.endTime = 'Vui lòng chọn thời gian bắt đầu trước';
      } else {
        delete newErrors.endTime;
      }
    }
    
    setErrors(newErrors);
    
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn thêm thời gian có sẵn cho nhân sự không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate talentId
    if (!talentId || !form.talentId || form.talentId === 0) {
      setError("⚠️ Không tìm thấy thông tin nhân sự. Vui lòng quay lại trang trước.");
      setLoading(false);
      return;
    }

    if (!form.startTime) {
      setError("⚠️ Vui lòng chọn thời gian bắt đầu.");
      setLoading(false);
      return;
    }

    // Validate startTime hợp lý
    if (!validateStartTime(form.startTime)) {
      setError("⚠️ Thời gian bắt đầu phải nằm trong tương lai.");
      setLoading(false);
      return;
    }

    // Validate endTime hợp lý
    if (form.endTime && !validateEndTime(form.startTime, form.endTime)) {
      setError("⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.");
      setLoading(false);
      return;
    }

    try {
      const newStart = new Date(form.startTime);
      const newEnd = form.endTime ? new Date(form.endTime) : undefined;

      const existingTimes = (await talentAvailableTimeService.getAll({
        talentId: form.talentId,
        excludeDeleted: true,
      })) as TalentAvailableTime[];

      if (Array.isArray(existingTimes)) {
        const overlappingSlot = findOverlappingSlot(existingTimes, newStart, newEnd);
        if (overlappingSlot) {
          setError(
            `⚠️ Khung giờ này trùng với khoảng đã có: ${formatRange(overlappingSlot)}. Vui lòng chọn khung khác.`
          );
          setLoading(false);
          return;
        }
      }

      // Convert datetime-local to UTC ISO string for PostgreSQL
      const formData = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      };
      
      await talentAvailableTimeService.create(formData);
      setSuccess(true);
      setTimeout(() => navigate(`/ta/talents/${talentId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Talent Available Time:", err);
      setError("Không thể tạo thời gian có sẵn cho nhân sự. Vui lòng thử lại.");
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
              { label: "Nhân sự", to: "/ta/talents" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/talents/${talentId}` },
              { label: "Thêm thời gian có sẵn" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm thời gian có sẵn cho nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm thời gian có sẵn mới cho nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Thêm thời gian có sẵn mới
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
                <h2 className="text-xl font-semibold text-gray-900">Thông tin thời gian có sẵn</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thời gian bắt đầu */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Chọn ngày và giờ bắt đầu có sẵn (phải lớn hơn thời điểm hiện tại)
                  </p>
                </div>

                {/* Thời gian kết thúc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời gian kết thúc (tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    min={form.startTime ? (() => {
                      const startDate = new Date(form.startTime);
                      startDate.setMinutes(startDate.getMinutes() + 1);
                      return startDate.toISOString().slice(0, 16);
                    })() : undefined}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Để trống nếu không có thời gian kết thúc cụ thể
                  </p>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Ghi chú
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về thời gian có sẵn, điều kiện đặc biệt..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                />
              </div>
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
                    Thêm thời gian có sẵn thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${talentId}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Thêm thời gian
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
