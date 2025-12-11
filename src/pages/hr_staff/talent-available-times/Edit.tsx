import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentAvailableTimeService, type TalentAvailableTimeCreate, type TalentAvailableTime } from "../../../services/TalentAvailableTime";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  Calendar, 
  Clock,
  AlertCircle
} from "lucide-react";

export default function TalentAvailableTimeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentAvailableTimeCreate>({
    talentId: 0,
    startTime: "",
    endTime: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);

  // 🧭 Load dữ liệu Talent Available Time
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentAvailableTimeService.getById(Number(id));

        // Convert ISO datetime to datetime-local format
        const formatDateTime = (isoString: string) => {
          const date = new Date(isoString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          talentId: data.talentId,
          startTime: formatDateTime(data.startTime),
          endTime: data.endTime ? formatDateTime(data.endTime) : "",
          notes: data.notes,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin thời gian có sẵn!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  const findOverlappingSlot = (
    existing: TalentAvailableTime[],
    newStart: Date,
    newEnd: Date | undefined,
    currentId: number
  ) => {
    const effectiveNewEnd = newEnd ?? new Date(8640000000000000);

    for (const slot of existing) {
      if (slot.id === currentId) continue;
      const slotStart = new Date(slot.startTime);
      const slotEnd = slot.endTime ? new Date(slot.endTime) : new Date(8640000000000000);
      if (newStart < slotEnd && slotStart < effectiveNewEnd) {
        return slot;
      }
    }
    return null;
  };

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      if (formData.endTime && value) {
        if (!validateEndTime(value, formData.endTime)) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          delete newErrors.endTime;
        }
      }
    }
    
    // Validate endTime
    if (name === 'endTime') {
      if (value && formData.startTime) {
        if (!validateEndTime(formData.startTime, value)) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          delete newErrors.endTime;
        }
      } else if (value && !formData.startTime) {
        newErrors.endTime = 'Vui lòng chọn thời gian bắt đầu trước';
      } else {
        delete newErrors.endTime;
      }
    }
    
    setErrors(newErrors);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    // Validate talentId
    if (!talentId || talentId === 0) {
      alert("⚠️ Không tìm thấy thông tin nhân sự. Vui lòng quay lại trang trước.");
      return;
    }

    if (!formData.startTime) {
      alert("⚠️ Vui lòng chọn thời gian bắt đầu!");
      return;
    }

    // Validate startTime hợp lý
    if (!validateStartTime(formData.startTime)) {
      alert("⚠️ Thời gian bắt đầu phải nằm trong tương lai!");
      return;
    }

    // Validate endTime hợp lý
    if (formData.endTime && !validateEndTime(formData.startTime, formData.endTime)) {
      alert("⚠️ Thời gian kết thúc phải sau thời gian bắt đầu!");
      return;
    }

    try {
      const newStart = new Date(formData.startTime);
      const newEnd = formData.endTime ? new Date(formData.endTime) : undefined;

      const existingTimes = (await talentAvailableTimeService.getAll({
        talentId,
        excludeDeleted: true,
      })) as TalentAvailableTime[];

      if (Array.isArray(existingTimes)) {
        const overlappingSlot = findOverlappingSlot(existingTimes, newStart, newEnd, Number(id));
        if (overlappingSlot) {
          alert(
            `⚠️ Khung giờ này trùng với khoảng đã có: ${formatRange(overlappingSlot)}. Vui lòng chọn khung khác!`
          );
          return;
        }
      }

      const updateData = {
        ...formData,
        startTime: newStart.toISOString(),
        endTime: newEnd ? newEnd.toISOString() : undefined,
      };

      console.log("Payload gửi đi:", updateData);
      await talentAvailableTimeService.update(Number(id), updateData);

      alert("✅ Cập nhật thời gian có sẵn thành công!");
      navigate(`/ta/developers/${talentId}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật thời gian có sẵn!");
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
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/developers" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/developers/${talentId}` },
              { label: "Chỉnh sửa thời gian có sẵn" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa thời gian có sẵn</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin thời gian có sẵn của nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa thời gian có sẵn
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
                  <Input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full focus:ring-primary-500 rounded-xl border-neutral-200 focus:border-primary-500"
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
                  <Input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    min={formData.startTime ? (() => {
                      const startDate = new Date(formData.startTime);
                      startDate.setMinutes(startDate.getMinutes() + 1);
                      return startDate.toISOString().slice(0, 16);
                    })() : undefined}
                    className="w-full focus:ring-primary-500 rounded-xl border-neutral-200 focus:border-primary-500"
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
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về thời gian có sẵn, điều kiện đặc biệt..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/developers/${talentId}`}
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
