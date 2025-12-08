import { Plus, Trash2, Briefcase, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentProject } from '../../../services/TalentProject';
import { type TalentProjectCreateModel } from '../../../services/Talent';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';

interface TalentDetailProjectsSectionProps {
  // Data
  talentProjects: TalentProject[];
  selectedProjects: number[];
  setSelectedProjects: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageProjects: number;
  setPageProjects: (page: number) => void;
  itemsPerPage: number;

  // Inline form
  showInlineForm: boolean;
  inlineProjectForm: Partial<TalentProjectCreateModel>;
  setInlineProjectForm: (form: Partial<TalentProjectCreateModel> | ((prev: any) => Partial<TalentProjectCreateModel>)) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Permissions
  canEdit: boolean;

  // CV Analysis suggestions
  analysisResult?: CVAnalysisComparisonResponse | null;
}

/**
 * Component section hiển thị và quản lý dự án trong Talent Detail page
 */
export function TalentDetailProjectsSection({
  talentProjects,
  selectedProjects,
  setSelectedProjects,
  pageProjects,
  setPageProjects,
  itemsPerPage,
  showInlineForm,
  inlineProjectForm,
  setInlineProjectForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  canEdit,
  analysisResult,
}: TalentDetailProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Inline Project Form */}
      {showInlineForm && (
        <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h3>
            <button
              onClick={onCloseForm}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Tên dự án <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inlineProjectForm.projectName || ''}
                onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, projectName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="Nhập tên dự án"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Vị trí</label>
                <input
                  type="text"
                  value={inlineProjectForm.position || ''}
                  onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Nhập vị trí"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Công nghệ sử dụng</label>
                <input
                  type="text"
                  value={inlineProjectForm.technologies || ''}
                  onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, technologies: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Nhập công nghệ sử dụng"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
              <textarea
                value={inlineProjectForm.description || ''}
                onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                placeholder="Nhập mô tả dự án"
              />
            </div>
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
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2 ${
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

      {/* CV Analysis Suggestions */}
      {analysisResult &&
        (analysisResult.projects.newEntries.length > 0 || analysisResult.projects.potentialDuplicates.length > 0) && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">Gợi ý từ CV mới</h3>
              <span className="text-xs text-purple-700">
                {analysisResult.projects.newEntries.length} dự án mới · {analysisResult.projects.potentialDuplicates.length}{' '}
                dự án có thể trùng
              </span>
            </div>
            {analysisResult.projects.newEntries.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-purple-700 font-medium">Đề xuất thêm dự án:</p>
                {analysisResult.projects.newEntries.map((project, index) => (
                  <div
                    key={`suggested-project-${index}`}
                    className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-purple-900 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{project.projectName}</span>
                      {project.position && <span className="text-xs text-purple-700">Vai trò: {project.position}</span>}
                    </div>
                    {project.technologies && (
                      <p className="mt-1 text-xs text-purple-600">Công nghệ: {project.technologies}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {analysisResult.projects.potentialDuplicates.length > 0 && (
              <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <p className="font-medium mb-1">Kiểm tra trùng lặp:</p>
                <ul className="space-y-1">
                  {analysisResult.projects.potentialDuplicates.map((dup, index) => (
                    <li key={`dup-project-${index}`}>
                      - {dup.fromCV.projectName} · Khuyến nghị: <span className="font-semibold">{dup.recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Danh sách dự án</h3>
        <div className="flex gap-2">
          {!showInlineForm && (
            <Button
              onClick={onOpenForm}
              disabled={isSubmitting || !canEdit}
              className={`group flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                isSubmitting || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                !canEdit
                  ? 'Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                  : isSubmitting
                    ? 'Đang xử lý...'
                    : 'Tạo dự án'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedProjects.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa dự án ({selectedProjects.length})
            </Button>
          )}
        </div>
      </div>

      {/* Projects Table */}
      {talentProjects.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedProjects.length ===
                          talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).length &&
                        talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentPageItems = talentProjects
                            .slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage)
                            .map((project) => project.id);
                          setSelectedProjects([...new Set([...selectedProjects, ...currentPageItems])]);
                        } else {
                          const currentPageItems = talentProjects
                            .slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage)
                            .map((project) => project.id);
                          setSelectedProjects(selectedProjects.filter((id) => !currentPageItems.includes(id)));
                        }
                      }}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Tên dự án
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Vị trí
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Công nghệ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {talentProjects
                  .slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage)
                  .map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => navigate(`/ta/talent-projects/edit/${project.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, project.id]);
                            } else {
                              setSelectedProjects(selectedProjects.filter((id) => id !== project.id));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-800">{project.projectName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-primary-700">{project.position}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-primary-600">{project.technologies}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SectionPagination
            currentPage={pageProjects}
            totalItems={talentProjects.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageProjects}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có dự án nào</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa tham gia dự án</p>
        </div>
      )}
    </div>
  );
}

