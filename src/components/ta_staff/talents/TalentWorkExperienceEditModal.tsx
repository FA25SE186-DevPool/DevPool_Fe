import { useEffect, useMemo, useState } from 'react';
import { Save, X, Workflow, Building2, Calendar, FileText, Search, Target } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { talentWorkExperienceService, type TalentWorkExperienceCreate } from '../../../services/TalentWorkExperience';
import { talentCVService, type TalentCV } from '../../../services/TalentCV';

interface TalentWorkExperienceEditModalProps {
  isOpen: boolean;
  experienceId: number | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  workExperiencePositions: string[];
}

/**
 * Modal chỉnh sửa kinh nghiệm - dùng logic giống trang `/ta/talent-work-experiences/edit/:id`
 */
export function TalentWorkExperienceEditModal({
  isOpen,
  experienceId,
  canEdit,
  onClose,
  onSaved,
  workExperiencePositions,
}: TalentWorkExperienceEditModalProps) {
  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentWorkExperienceCreate>({
    talentId: 0,
    talentCVId: 0,
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // State cho position dropdown (giống trang Edit)
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState('');

  // Validate start date (giống trang Edit)
  const validateStartDate = (date: string): boolean => {
    if (!date) return false;
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (startDate > today) return false;
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
    return startDate >= hundredYearsAgo;
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isPositionDropdownOpen && !target.closest('.position-dropdown-container')) {
        setIsPositionDropdownOpen(false);
      }
    };
    if (isPositionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPositionDropdownOpen]);

  // Load dữ liệu Experience
  useEffect(() => {
    if (!isOpen || !experienceId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await talentWorkExperienceService.getById(Number(experienceId));
        setFormData({
          talentId: data.talentId,
          talentCVId: data.talentCVId,
          company: data.company,
          position: data.position,
          startDate: data.startDate ? data.startDate.split('T')[0] : '',
          endDate: data.endDate ? data.endDate.split('T')[0] : '',
          description: data.description,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu:', err);
        alert('Không thể tải thông tin kinh nghiệm làm việc!');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, experienceId, onClose]);

  // Load danh sách CVs theo talentId
  useEffect(() => {
    if (!isOpen) return;
    const fetchCVs = async () => {
      try {
        if (talentId > 0) {
          const cvs = await talentCVService.getAll({ talentId, excludeDeleted: true });
          let cvsArray: TalentCV[] = [];
          if (Array.isArray(cvs)) {
            cvsArray = cvs;
          } else if (cvs && typeof cvs === 'object') {
            if (Array.isArray((cvs as any).data)) {
              cvsArray = (cvs as any).data;
            } else if (Array.isArray((cvs as any).items)) {
              cvsArray = (cvs as any).items;
            } else if (Array.isArray((cvs as any).Data)) {
              cvsArray = (cvs as any).Data;
            } else if (Array.isArray((cvs as any).Items)) {
              cvsArray = (cvs as any).Items;
            }
          }
          setTalentCVs(cvsArray);
        } else {
          setTalentCVs([]);
        }
      } catch (err) {
        console.error('❌ Lỗi tải danh sách CV:', err);
        setTalentCVs([]);
      }
    };
    fetchCVs();
  }, [isOpen, talentId]);

  const filteredPositions = useMemo(() => {
    if (!positionSearch) return workExperiencePositions;
    return workExperiencePositions.filter((p) => p.toLowerCase().includes(positionSearch.toLowerCase()));
  }, [positionSearch, workExperiencePositions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // realtime validation for dates (giống trang Edit)
    if (name === 'startDate') {
      const newErrors = { ...fieldErrors };
      if (value && !validateStartDate(value)) {
        newErrors.startDate = 'Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước)';
      } else {
        delete newErrors.startDate;
        if (formData.endDate) {
          if (new Date(formData.endDate) <= new Date(value)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
          } else {
            delete newErrors.endDate;
          }
        }
      }
      setFieldErrors(newErrors);
    }

    if (name === 'endDate') {
      const newErrors = { ...fieldErrors };
      if (value && formData.startDate) {
        if (new Date(value) <= new Date(formData.startDate)) {
          newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        } else {
          delete newErrors.endDate;
        }
      } else {
        delete newErrors.endDate;
      }
      setFieldErrors(newErrors);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'talentCVId' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experienceId) return;

    if (!canEdit) {
      alert('Bạn không có quyền chỉnh sửa kinh nghiệm này.');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
    if (!confirmed) return;

    if (!formData.talentCVId || formData.talentCVId === 0) {
      alert('⚠️ Vui lòng chọn CV trước khi lưu!');
      return;
    }
    if (!formData.company.trim()) {
      alert('⚠️ Vui lòng nhập tên công ty!');
      return;
    }
    if (!formData.position.trim()) {
      alert('⚠️ Vui lòng nhập vị trí làm việc!');
      return;
    }
    if (!formData.startDate) {
      alert('⚠️ Vui lòng chọn ngày bắt đầu!');
      return;
    }
    if (!validateStartDate(formData.startDate)) {
      alert('⚠️ Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước)!');
      return;
    }
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('⚠️ Ngày kết thúc phải sau ngày bắt đầu!');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };
      await talentWorkExperienceService.update(Number(experienceId), updateData);
      setShowSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi đóng modal
      setTimeout(() => {
        setShowSuccessOverlay(false);
        onSaved?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật:', err);
      alert('Không thể cập nhật kinh nghiệm làm việc!');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Workflow className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa kinh nghiệm</h3>
              <p className="text-sm text-neutral-600">Cập nhật kinh nghiệm làm việc của nhân sự</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CV của nhân sự <span className="text-red-500">*</span>
                </label>
                <select
                  name="talentCVId"
                  value={formData.talentCVId}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
                  disabled={!canEdit}
                >
                  <option value="0">-- Chọn CV --</option>
                  {Array.isArray(talentCVs) && talentCVs.length > 0 ? (
                    talentCVs.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        v{cv.version}
                      </option>
                    ))
                  ) : (
                    <option disabled>Không có CV nào</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    Vị trí <span className="text-red-500">*</span>
                  </label>
                  <div className="relative position-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsPositionDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                      disabled={!canEdit}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className={formData.position ? 'text-neutral-800' : 'text-neutral-500'}>
                          {formData.position || 'Chọn vị trí'}
                        </span>
                      </div>
                      <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                    </button>
                    {isPositionDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={positionSearch}
                              onChange={(e) => setPositionSearch(e.target.value)}
                              placeholder="Tìm vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {filteredPositions.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, position: '' }));
                                  setPositionSearch('');
                                  setIsPositionDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  !formData.position ? 'bg-primary-50 text-primary-700' : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Chọn vị trí
                              </button>
                              {filteredPositions.map((position) => (
                                <button
                                  type="button"
                                  key={position}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, position }));
                                    setPositionSearch('');
                                    setIsPositionDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    formData.position === position
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                  }`}
                                >
                                  {position}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    const maxDate = today.toISOString().split('T')[0];
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
                    const minDate = hundredYearsAgo.toISOString().split('T')[0];
                    return (
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={minDate}
                        max={maxDate}
                        required
                        className={`w-full focus:ring-primary-500 focus:border-primary-500 rounded-xl border-neutral-200 ${
                          fieldErrors.startDate ? 'border-red-500' : ''
                        }`}
                        disabled={!canEdit}
                      />
                    );
                  })()}
                  {fieldErrors.startDate && <p className="text-xs text-red-600 mt-1">{fieldErrors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày kết thúc (tùy chọn)
                  </label>
                  {(() => {
                    let minEndDate = '';
                    if (formData.startDate) {
                      const startDate = new Date(formData.startDate);
                      startDate.setDate(startDate.getDate() + 1);
                      minEndDate = startDate.toISOString().split('T')[0];
                    }
                    return (
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={minEndDate || undefined}
                        className={`w-full focus:ring-primary-500 focus:border-primary-500 rounded-xl border-neutral-200 ${
                          fieldErrors.endDate ? 'border-red-500' : ''
                        }`}
                        disabled={!canEdit}
                      />
                    );
                  })()}
                  {fieldErrors.endDate ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.endDate}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1">Để trống nếu vẫn đang làm việc</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả công việc (tùy chọn)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                  disabled={!canEdit}
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
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Success Loading Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật kinh nghiệm làm việc thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


