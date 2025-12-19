import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Clock, Save, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { talentAvailableTimeService, type TalentAvailableTime, type TalentAvailableTimeCreate } from '../../../services/TalentAvailableTime';

export interface TalentAvailableTimeEditModalProps {
  isOpen: boolean;
  availableTimeId: number | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

export function TalentAvailableTimeEditModal({
  isOpen,
  availableTimeId,
  canEdit,
  onClose,
  onSaved,
}: TalentAvailableTimeEditModalProps) {
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentAvailableTimeCreate>({
    talentId: 0,
    startTime: '',
    endTime: '',
    notes: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert ISO datetime to datetime-local format
  const toDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateStartTime = (dateTime: string): boolean => {
    if (!dateTime) return false;
    const startDateTime = new Date(dateTime);
    const now = new Date();

    // Start ≥ now (cho phép thời gian hiện tại)
    if (startDateTime < now) return false;

    // Start ≤ now + 6 tháng (không quá xa trong tương lai)
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(now.getMonth() + 6);
    return startDateTime <= sixMonthsFromNow;
  };

  const validateEndTime = (startDateTime: string, endDateTime: string | undefined): boolean => {
    if (!endDateTime) return true;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // End > start (cơ bản)
    if (end <= start) return false;

    // End ≤ start + 6 tháng (không quá xa từ start)
    const sixMonthsFromStart = new Date(start);
    sixMonthsFromStart.setMonth(start.getMonth() + 6);
    return end <= sixMonthsFromStart;
  };

  // Tính max date cho start time (now + 6 tháng)
  const getStartTimeMax = () => {
    const maxDate = new Date();
    const currentYear = maxDate.getFullYear();
    const currentMonth = maxDate.getMonth();

    // Tính tháng và năm mới
    const newMonth = currentMonth + 6;
    const newYear = currentYear + Math.floor(newMonth / 12);
    const finalMonth = newMonth % 12;

    maxDate.setFullYear(newYear, finalMonth);
    const result = maxDate.toISOString().slice(0, 16);
    console.log('Start time max:', result); // Debug
    return result;
  };

  // Tính max date cho end time (start + 6 tháng)
  const getEndTimeMax = () => {
    if (!formData.startTime) return undefined;
    const startDate = new Date(formData.startTime);
    const currentYear = startDate.getFullYear();
    const currentMonth = startDate.getMonth();

    // Tính tháng và năm mới
    const newMonth = currentMonth + 6;
    const newYear = currentYear + Math.floor(newMonth / 12);
    const finalMonth = newMonth % 12;

    startDate.setFullYear(newYear, finalMonth);
    return startDate.toISOString().slice(0, 16);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'Không xác định';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không xác định';
    return date.toLocaleString('vi-VN', { hour12: false });
  };

  const formatRange = (slot: TalentAvailableTime) => {
    const start = formatDateTime(slot.startTime);
    const end = slot.endTime ? formatDateTime(slot.endTime) : 'Không xác định';
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
      if (newStart < slotEnd && slotStart < effectiveNewEnd) return slot;
    }
    return null;
  };

  const subtitle = useMemo(() => {
    if (!formData.startTime) return '—';
    const start = new Date(formData.startTime);
    if (Number.isNaN(start.getTime())) return '—';
    const end = formData.endTime ? new Date(formData.endTime) : null;
    const startText = start.toLocaleString('vi-VN', { hour12: false });
    const endText = end && !Number.isNaN(end.getTime()) ? end.toLocaleString('vi-VN', { hour12: false }) : 'Không giới hạn';
    return `${startText} → ${endText}`;
  }, [formData.startTime, formData.endTime]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Load available time data
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !availableTimeId) return;
      setLoading(true);
      try {
        const data = await talentAvailableTimeService.getById(Number(availableTimeId));
        setFormData({
          talentId: data.talentId,
          startTime: toDateTimeLocal(data.startTime),
          endTime: data.endTime ? toDateTimeLocal(data.endTime) : '',
          notes: data.notes || '',
        });
        setTalentId(data.talentId);
        setErrors({});
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu:', err);
        alert('Không thể tải thông tin thời gian có sẵn!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, availableTimeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === 'startTime') {
      // Kiểm tra và force về max date nếu vượt quá
      if (value) {
        const selectedDate = new Date(value);
        const maxDate = new Date(getStartTimeMax());

        if (selectedDate > maxDate) {
          // Tự động reset về max date
          const maxValue = getStartTimeMax();
          setFormData((prev) => ({ ...prev, [name]: maxValue }));
          newErrors.startTime = 'Thời gian bắt đầu không được quá 6 tháng từ hiện tại';
          return; // Không cập nhật value mới
        }

        if (!validateStartTime(value)) {
          const startDate = new Date(value);
          const now = new Date();
          if (startDate < now) {
            newErrors.startTime = 'Thời gian bắt đầu phải từ thời điểm hiện tại trở đi';
          }
        } else {
          delete newErrors.startTime;
        }
      } else {
        delete newErrors.startTime;
      }

      if (formData.endTime && value) {
        if (!validateEndTime(value, formData.endTime)) newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        else delete newErrors.endTime;
      }
    }

    if (name === 'endTime') {
      if (value && formData.startTime) {
        // Kiểm tra và force về max date nếu vượt quá
        const selectedDate = new Date(value);
        const maxDate = new Date(getEndTimeMax() || '');

        if (maxDate && selectedDate > maxDate) {
          // Tự động reset về max date
          const maxValue = getEndTimeMax();
          setFormData((prev) => ({ ...prev, [name]: maxValue }));
          newErrors.endTime = 'Thời gian kết thúc không được quá 6 tháng từ thời gian bắt đầu';
          return; // Không cập nhật value mới
        }

        if (!validateEndTime(formData.startTime, value)) {
          const start = new Date(formData.startTime);
          const end = new Date(value);
          if (end <= start) {
            newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
          } else {
            newErrors.endTime = 'Thời gian kết thúc không được quá 6 tháng từ thời gian bắt đầu';
          }
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableTimeId) return;
    if (!canEdit) return;

    const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
    if (!confirmed) return;

    if (!talentId || talentId === 0) {
      alert('⚠️ Không tìm thấy thông tin nhân sự. Vui lòng thử lại.');
      return;
    }
    if (!formData.startTime) {
      alert('⚠️ Vui lòng chọn thời gian bắt đầu!');
      return;
    }
    if (!validateStartTime(formData.startTime)) {
      alert('⚠️ Thời gian bắt đầu phải từ thời điểm hiện tại trở đi!');
      return;
    }
    if (formData.endTime && !validateEndTime(formData.startTime, formData.endTime)) {
      alert('⚠️ Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    setSaving(true);
    try {
      const newStart = new Date(formData.startTime);
      const newEnd = formData.endTime ? new Date(formData.endTime) : undefined;

      const existingTimes = (await talentAvailableTimeService.getAll({
        talentId,
        excludeDeleted: true,
      })) as TalentAvailableTime[];

      if (Array.isArray(existingTimes)) {
        const overlappingSlot = findOverlappingSlot(existingTimes, newStart, newEnd, Number(availableTimeId));
        if (overlappingSlot) {
          alert(`⚠️ Khung giờ này trùng với khoảng đã có: ${formatRange(overlappingSlot)}. Vui lòng chọn khung khác!`);
          return;
        }
      }

      const updateData = {
        ...formData,
        startTime: newStart.toISOString(),
        endTime: newEnd ? newEnd.toISOString() : undefined,
      };

      await talentAvailableTimeService.update(Number(availableTimeId), updateData);
      alert('✅ Cập nhật thời gian có sẵn thành công!');
      await onSaved?.();
      onClose();
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật:', err);
      alert('Không thể cập nhật thời gian có sẵn!');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa thời gian có sẵn</h3>
              <p className="text-xs text-neutral-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!canEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>Bạn không có quyền chỉnh sửa thời gian này.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    max={getStartTimeMax()}
                    disabled={!canEdit}
                    className="w-full focus:ring-primary-500 rounded-xl border-neutral-200 focus:border-primary-500"
                  />
                  {errors.startTime && <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>}
                </div>

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
                    disabled={!canEdit}
                    min={
                      formData.startTime
                        ? (() => {
                            const startDate = new Date(formData.startTime);
                            startDate.setMinutes(startDate.getMinutes() + 1);
                            return startDate.toISOString().slice(0, 16);
                          })()
                        : undefined
                    }
                    max={getEndTimeMax()}
                    className="w-full focus:ring-primary-500 rounded-xl border-neutral-200 focus:border-primary-500"
                  />
                  {errors.endTime && <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>}
                  <p className="text-xs text-neutral-500 mt-1">Để trống nếu không có thời gian kết thúc cụ thể</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Ghi chú
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="Mô tả chi tiết về thời gian có sẵn, điều kiện đặc biệt..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none disabled:bg-neutral-50"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform bg-white font-medium"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Hủy
                </button>
                <Button
                  type="submit"
                  disabled={saving || !canEdit}
                  className={`group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                    saving || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


