import { Plus, Trash2, X, Save, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentAvailableTime } from '../../../services/TalentAvailableTime';
import { type TalentAvailableTimeCreate } from '../../../services/TalentAvailableTime';

interface TalentDetailAvailableTimesSectionProps {
  // Data
  availableTimes: TalentAvailableTime[];
  selectedAvailableTimes: number[];
  setSelectedAvailableTimes: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageAvailableTimes: number;
  setPageAvailableTimes: (page: number) => void;
  itemsPerPage: number;

  // Inline form
  showInlineForm: boolean;
  inlineAvailableTimeForm: Partial<TalentAvailableTimeCreate>;
  setInlineAvailableTimeForm: (form: Partial<TalentAvailableTimeCreate> | ((prev: any) => Partial<TalentAvailableTimeCreate>)) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Form errors
  availableTimeFormErrors: Record<string, string>;
  setAvailableTimeFormErrors: (errors: Record<string, string>) => void;

  // Validation functions
  validateStartTime: (dateTime: string) => boolean;
  validateEndTime: (startDateTime: string, endDateTime: string | undefined) => boolean;

  // Permissions
  canEdit: boolean;
}

/**
 * Component section hiển thị và quản lý thời gian sẵn sàng trong Talent Detail page
 */
export function TalentDetailAvailableTimesSection({
  availableTimes,
  selectedAvailableTimes,
  setSelectedAvailableTimes,
  pageAvailableTimes,
  setPageAvailableTimes,
  itemsPerPage,
  showInlineForm,
  inlineAvailableTimeForm,
  setInlineAvailableTimeForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  availableTimeFormErrors,
  setAvailableTimeFormErrors,
  validateStartTime,
  validateEndTime,
  canEdit,
}: TalentDetailAvailableTimesSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Inline AvailableTime Form */}
      {showInlineForm && (
        <div className="bg-white rounded-xl border-2 border-secondary-200 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thêm thời gian sẵn sàng mới</h3>
            <button
              onClick={onCloseForm}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Start Time and End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={inlineAvailableTimeForm.startTime || ''}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, startTime: value });
                    const newErrors = { ...availableTimeFormErrors };
                    if (value && !validateStartTime(value)) {
                      newErrors.startTime = '⚠️ Thời gian bắt đầu phải nằm trong tương lai.';
                    } else {
                      delete newErrors.startTime;
                    }
                    if (inlineAvailableTimeForm.endTime && value) {
                      if (!validateEndTime(value, inlineAvailableTimeForm.endTime)) {
                        newErrors.endTime = '⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.';
                      } else {
                        delete newErrors.endTime;
                      }
                    }
                    setAvailableTimeFormErrors(newErrors);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white ${
                    availableTimeFormErrors.startTime
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500'
                  }`}
                />
                {availableTimeFormErrors.startTime && (
                  <p className="text-xs text-red-600 mt-1">{availableTimeFormErrors.startTime}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  Chọn ngày và giờ bắt đầu có sẵn (phải lớn hơn thời điểm hiện tại)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Thời gian kết thúc (tùy chọn)</label>
                <input
                  type="datetime-local"
                  value={inlineAvailableTimeForm.endTime || ''}
                  min={
                    inlineAvailableTimeForm.startTime
                      ? (() => {
                          const startDate = new Date(inlineAvailableTimeForm.startTime);
                          startDate.setMinutes(startDate.getMinutes() + 1);
                          return startDate.toISOString().slice(0, 16);
                        })()
                      : undefined
                  }
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, endTime: value });
                    const newErrors = { ...availableTimeFormErrors };
                    if (value && inlineAvailableTimeForm.startTime) {
                      if (!validateEndTime(inlineAvailableTimeForm.startTime, value)) {
                        newErrors.endTime = '⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.';
                      } else {
                        delete newErrors.endTime;
                      }
                    } else if (value && !inlineAvailableTimeForm.startTime) {
                      newErrors.endTime = '⚠️ Vui lòng chọn thời gian bắt đầu trước.';
                    } else {
                      delete newErrors.endTime;
                    }
                    setAvailableTimeFormErrors(newErrors);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white ${
                    availableTimeFormErrors.endTime
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500'
                  }`}
                />
                {availableTimeFormErrors.endTime && (
                  <p className="text-xs text-red-600 mt-1">{availableTimeFormErrors.endTime}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">Để trống nếu không có thời gian kết thúc cụ thể</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Ghi chú</label>
              <textarea
                value={inlineAvailableTimeForm.notes || ''}
                onChange={(e) => setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 resize-none"
                placeholder="Nhập ghi chú"
              />
            </div>

            {/* Error messages */}
            {availableTimeFormErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{availableTimeFormErrors.submit}</p>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={onCloseForm}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
              >
                Hủy
              </Button>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white transition-all flex items-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lịch sẵn sàng của nhân sự</h3>
        <div className="flex gap-2">
          {!showInlineForm && (
            <Button
              onClick={onOpenForm}
              disabled={isSubmitting || !canEdit}
              className={`group flex items-center justify-center bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                isSubmitting || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                !canEdit
                  ? 'Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                  : isSubmitting
                    ? 'Đang xử lý...'
                    : 'Thêm thời gian'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedAvailableTimes.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa thời gian ({selectedAvailableTimes.length})
            </Button>
          )}
        </div>
      </div>

      {/* Available Times List */}
      {availableTimes.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedAvailableTimes.length ===
                          availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).length &&
                        availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentPageItems = availableTimes
                            .slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage)
                            .map((time) => time.id);
                          setSelectedAvailableTimes([...new Set([...selectedAvailableTimes, ...currentPageItems])]);
                        } else {
                          const currentPageItems = availableTimes
                            .slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage)
                            .map((time) => time.id);
                          setSelectedAvailableTimes(selectedAvailableTimes.filter((id) => !currentPageItems.includes(id)));
                        }
                      }}
                      className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Từ ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Đến ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {availableTimes
                  .slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage)
                  .map((time) => (
                    <tr
                      key={time.id}
                      className="hover:bg-secondary-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => navigate(`/ta/talent-available-times/edit/${time.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAvailableTimes.includes(time.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedAvailableTimes([...selectedAvailableTimes, time.id]);
                            } else {
                              setSelectedAvailableTimes(selectedAvailableTimes.filter((id) => id !== time.id));
                            }
                          }}
                          className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-700">
                          {new Date(time.startTime).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-secondary-600">
                          {time.endTime ? new Date(time.endTime).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{time.notes || '—'}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SectionPagination
            currentPage={pageAvailableTimes}
            totalItems={availableTimes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageAvailableTimes}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có thông tin thời gian</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật thời gian có sẵn</p>
        </div>
      )}
    </div>
  );
}

