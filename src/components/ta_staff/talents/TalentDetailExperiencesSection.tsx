import { Plus, Trash2, Workflow, X, Save, Target, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentWorkExperience } from '../../../services/TalentWorkExperience';
import { type TalentWorkExperienceCreateModel } from '../../../services/Talent';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';

interface TalentDetailExperiencesSectionProps {
  // Data
  workExperiences: TalentWorkExperience[];
  selectedExperiences: number[];
  setSelectedExperiences: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageExperiences: number;
  setPageExperiences: (page: number) => void;
  itemsPerPage: number;

  // Work experience positions
  workExperiencePositions: string[];

  // Inline form
  showInlineForm: boolean;
  inlineExperienceForm: Partial<TalentWorkExperienceCreateModel>;
  setInlineExperienceForm: (form: Partial<TalentWorkExperienceCreateModel> | ((prev: any) => Partial<TalentWorkExperienceCreateModel>)) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Position selection
  workExperiencePositionSearch: string;
  setWorkExperiencePositionSearch: (search: string) => void;
  isWorkExperiencePositionDropdownOpen: boolean;
  setIsWorkExperiencePositionDropdownOpen: (open: boolean) => void;

  // CV Analysis suggestions
  analysisResult?: CVAnalysisComparisonResponse | null;

  // Permissions
  canEdit: boolean;
}

/**
 * Component section hiển thị và quản lý kinh nghiệm làm việc trong Talent Detail page
 */
export function TalentDetailExperiencesSection({
  workExperiences,
  selectedExperiences,
  setSelectedExperiences,
  pageExperiences,
  setPageExperiences,
  itemsPerPage,
  workExperiencePositions,
  showInlineForm,
  inlineExperienceForm,
  setInlineExperienceForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  workExperiencePositionSearch,
  setWorkExperiencePositionSearch,
  isWorkExperiencePositionDropdownOpen,
  setIsWorkExperiencePositionDropdownOpen,
  analysisResult,
  canEdit,
}: TalentDetailExperiencesSectionProps) {
  const navigate = useNavigate();

  // Filter positions
  const filteredPositions = workExperiencePositions.filter((position) => {
    if (!workExperiencePositionSearch) return true;
    return position.toLowerCase().includes(workExperiencePositionSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* CV Analysis Suggestions */}
      {analysisResult &&
        (analysisResult.workExperiences.newEntries.length > 0 || analysisResult.workExperiences.potentialDuplicates.length > 0) && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Đề xuất kinh nghiệm làm việc</h3>
              <span className="text-xs text-blue-700">
                {analysisResult.workExperiences.newEntries.length} mục mới · {analysisResult.workExperiences.potentialDuplicates.length} mục có thể trùng
              </span>
            </div>
            {analysisResult.workExperiences.newEntries.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-blue-700 font-medium">Kinh nghiệm mới nên thêm:</p>
                {analysisResult.workExperiences.newEntries.map((exp, index) => (
                  <div key={`suggested-exp-${index}`} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm">
                    <p className="font-semibold">{exp.position}</p>
                    <p className="text-xs text-blue-700">{exp.company}</p>
                    <p className="text-xs text-blue-600">
                      {exp.startDate ?? '—'} - {exp.endDate ?? 'Hiện tại'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {analysisResult.workExperiences.potentialDuplicates.length > 0 && (
              <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <p className="font-medium mb-1">Mục cần rà soát trùng lặp:</p>
                <ul className="space-y-1">
                  {analysisResult.workExperiences.potentialDuplicates.map((dup, index) => (
                    <li key={`dup-exp-${index}`}>
                      - {dup.fromCV.position} tại {dup.fromCV.company} · Khuyến nghị:{' '}
                      <span className="font-semibold">{dup.recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      {/* Inline Experience Form */}
      {showInlineForm && (
        <div className="bg-white rounded-xl border-2 border-accent-200 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thêm kinh nghiệm mới</h3>
            <button
              onClick={onCloseForm}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Company and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Công ty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inlineExperienceForm.company || ''}
                  onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, company: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                  placeholder="Nhập tên công ty"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Vị trí <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsWorkExperiencePositionDropdownOpen(!isWorkExperiencePositionDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-accent-500/20 transition-all border-neutral-300 focus:border-accent-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Target className="w-4 h-4 text-neutral-400" />
                      <span className={inlineExperienceForm.position ? 'text-neutral-800' : 'text-neutral-500'}>
                        {inlineExperienceForm.position || 'Chọn vị trí'}
                      </span>
                    </div>
                  </button>
                  {isWorkExperiencePositionDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setIsWorkExperiencePositionDropdownOpen(false);
                        setWorkExperiencePositionSearch('');
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={workExperiencePositionSearch}
                            onChange={(e) => setWorkExperiencePositionSearch(e.target.value)}
                            placeholder="Tìm vị trí..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-accent-500 focus:ring-accent-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredPositions.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>
                        ) : (
                          filteredPositions.map((position) => (
                            <button
                              type="button"
                              key={position}
                              onClick={() => {
                                setInlineExperienceForm({ ...inlineExperienceForm, position: position });
                                setIsWorkExperiencePositionDropdownOpen(false);
                                setWorkExperiencePositionSearch('');
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                inlineExperienceForm.position === position
                                  ? 'bg-accent-50 text-accent-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              {position}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Start Date and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={inlineExperienceForm.startDate || ''}
                  max={inlineExperienceForm.endDate || undefined}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    // Validation: Khi startDate thay đổi, kiểm tra và reset endDate nếu cần
                    if (startDate && inlineExperienceForm.endDate && inlineExperienceForm.endDate < startDate) {
                      alert('⚠️ Ngày kết thúc đã được xóa vì nhỏ hơn ngày bắt đầu mới.');
                      setInlineExperienceForm({ ...inlineExperienceForm, startDate, endDate: undefined });
                      return;
                    }
                    setInlineExperienceForm({ ...inlineExperienceForm, startDate });
                  }}
                  className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày kết thúc</label>
                <input
                  type="date"
                  value={inlineExperienceForm.endDate || ''}
                  min={inlineExperienceForm.startDate || undefined}
                  onChange={(e) => {
                    const endDate = e.target.value || undefined;
                    // Validation: Ngày kết thúc phải sau ngày bắt đầu
                    if (endDate && inlineExperienceForm.startDate && endDate < inlineExperienceForm.startDate) {
                      alert('⚠️ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
                      return;
                    }
                    setInlineExperienceForm({ ...inlineExperienceForm, endDate });
                  }}
                  className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
              <textarea
                value={inlineExperienceForm.description || ''}
                onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-none"
                placeholder="Nhập mô tả kinh nghiệm"
              />
            </div>

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
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white transition-all flex items-center gap-2 ${
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
        <h3 className="text-lg font-semibold text-gray-900">Kinh nghiệm làm việc</h3>
        <div className="flex gap-2">
          {!showInlineForm && (
            <Button
              onClick={onOpenForm}
              disabled={isSubmitting || !canEdit}
              className={`group flex items-center justify-center bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                isSubmitting || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                !canEdit
                  ? 'Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                  : isSubmitting
                    ? 'Đang xử lý...'
                    : 'Thêm kinh nghiệm'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedExperiences.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa kinh nghiệm ({selectedExperiences.length})
            </Button>
          )}
        </div>
      </div>

      {/* Experiences List */}
      {workExperiences.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedExperiences.length ===
                          workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).length &&
                        workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentPageItems = workExperiences
                            .slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage)
                            .map((exp) => exp.id);
                          setSelectedExperiences([...new Set([...selectedExperiences, ...currentPageItems])]);
                        } else {
                          const currentPageItems = workExperiences
                            .slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage)
                            .map((exp) => exp.id);
                          setSelectedExperiences(selectedExperiences.filter((id) => !currentPageItems.includes(id)));
                        }
                      }}
                      className="w-4 h-4 text-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Công ty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {workExperiences
                  .slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage)
                  .map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-accent-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => navigate(`/ta/talent-work-experiences/edit/${exp.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedExperiences.includes(exp.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedExperiences([...selectedExperiences, exp.id]);
                            } else {
                              setSelectedExperiences(selectedExperiences.filter((id) => id !== exp.id));
                            }
                          }}
                          className="w-4 h-4 text-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-accent-800">{exp.position}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-accent-700">{exp.company}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-accent-600">
                          {new Date(exp.startDate).toLocaleDateString('vi-VN')} -{' '}
                          {exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SectionPagination
            currentPage={pageExperiences}
            totalItems={workExperiences.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageExperiences}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Workflow className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có kinh nghiệm làm việc</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật kinh nghiệm làm việc</p>
        </div>
      )}
    </div>
  );
}

