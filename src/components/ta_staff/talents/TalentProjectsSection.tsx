import { useState, useEffect } from 'react';
import { Plus, X, FolderOpen, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentProjectCreateModel } from '../../../services/Talent';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type TalentCVCreate } from '../../../services/TalentCV';

interface TalentProjectsSectionProps {
  talentProjects: TalentProjectCreateModel[];
  jobRoleLevels: JobRoleLevel[];
  initialCVs?: Partial<TalentCVCreate>[];
  projectPositionSearch: Record<number, string>;
  setProjectPositionSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isProjectPositionDropdownOpen: Record<number, boolean>;
  setIsProjectPositionDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentProjectCreateModel, value: string) => void;
}

/**
 * Component section quản lý dự án của Talent
 */
export function TalentProjectsSection({
  talentProjects,
  jobRoleLevels,
  initialCVs,
  projectPositionSearch,
  setProjectPositionSearch,
  isProjectPositionDropdownOpen,
  setIsProjectPositionDropdownOpen,
  errors,
  onAdd,
  onRemove,
  onUpdate,
}: TalentProjectsSectionProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Description collapse state
  const [isDescriptionOpen, setIsDescriptionOpen] = useState<Record<number, boolean>>({});

  // Calculate pagination
  const totalPages = Math.ceil(talentProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = talentProjects.slice(startIndex, endIndex);

  // Reset to page 1 when projects list changes and current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [talentProjects.length, currentPage, totalPages]);

  // Lấy các jobRoleLevelId từ CV Ban Đầu (nếu có)
  const cvJobRoleLevelIds = initialCVs
    ?.filter((cv) => cv.jobRoleLevelId && cv.jobRoleLevelId > 0)
    .map((cv) => cv.jobRoleLevelId!)
    .filter((id, index, self) => self.indexOf(id) === index) || [];

  // Lấy các jobRoleId từ CV (để filter theo loại vị trí)
  const cvJobRoleIds = cvJobRoleLevelIds.length > 0
    ? jobRoleLevels
        .filter((jrl) => cvJobRoleLevelIds.includes(jrl.id))
        .map((jrl) => jrl.jobRoleId)
        .filter((id, index, self) => self.indexOf(id) === index)
    : [];

  // Nếu có CV, chỉ hiển thị các vị trí từ CV và cùng loại (jobRole)
  // Lấy tên vị trí (name) từ jobRoleLevels, loại bỏ trùng lặp
  const availablePositions = cvJobRoleLevelIds.length > 0
    ? jobRoleLevels
        .filter((jrl) => cvJobRoleIds.includes(jrl.jobRoleId))
        .map((jrl) => jrl.name)
        .filter((name, index, self) => self.indexOf(name) === index)
    : jobRoleLevels
        .map((jrl) => jrl.name)
        .filter((name, index, self) => self.indexOf(name) === index);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <FolderOpen className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Dự án</h2>
          </div>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }} 
            variant="outline" 
            className="flex items-center gap-1.5 text-sm py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm dự án
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {talentProjects.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có dự án nào. Nhấn "Thêm dự án" để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedProjects.map((project, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <div key={globalIndex} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-neutral-700">Dự án #{globalIndex + 1}</span>
                      <Button
                        type="button"
                        onClick={() => onRemove(globalIndex)}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Project Name */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Tên dự án <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={project.projectName || ''}
                            onChange={(e) => onUpdate(globalIndex, 'projectName', e.target.value)}
                            placeholder="Tên dự án"
                            className={`w-full px-3 py-2 border rounded-lg bg-white ${
                              errors[`project_name_${globalIndex}`]
                                ? 'border-red-500'
                                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                            }`}
                          />
                          {errors[`project_name_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`project_name_${globalIndex}`]}</p>
                          )}
                        </div>

                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Vị trí trong dự án <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setIsProjectPositionDropdownOpen((prev) => ({
                                  ...prev,
                                  [globalIndex]: !prev[globalIndex],
                                }))
                              }
                              className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left ${
                                errors[`project_position_${globalIndex}`]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-neutral-300 hover:border-primary-300'
                              }`}
                            >
                              <span className="text-sm text-neutral-700">
                                {project.position || 'Chọn vị trí'}
                              </span>
                              <X
                                className={`w-4 h-4 text-neutral-400 transition-transform ${
                                  isProjectPositionDropdownOpen[globalIndex] ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            {isProjectPositionDropdownOpen[globalIndex] && (
                              <div
                                className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                onMouseLeave={() => {
                                  setIsProjectPositionDropdownOpen((prev) => ({
                                    ...prev,
                                    [globalIndex]: false,
                                  }));
                                  setProjectPositionSearch((prev) => ({
                                    ...prev,
                                    [globalIndex]: '',
                                  }));
                                }}
                              >
                                <div className="p-3 border-b border-neutral-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                    <input
                                      type="text"
                                      value={projectPositionSearch[globalIndex] || ''}
                                      onChange={(e) =>
                                        setProjectPositionSearch((prev) => ({
                                          ...prev,
                                          [globalIndex]: e.target.value,
                                        }))
                                      }
                                      placeholder="Tìm vị trí..."
                                      className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {availablePositions.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                                      {cvJobRoleLevelIds.length > 0 
                                        ? 'Chưa có vị trí nào từ CV ban đầu. Vui lòng thêm CV trước.' 
                                        : 'Chưa có vị trí nào'}
                                    </div>
                                  ) : (
                                    availablePositions
                                      .filter(
                                        (pos) =>
                                          !projectPositionSearch[globalIndex] ||
                                          pos
                                            .toLowerCase()
                                            .includes(projectPositionSearch[globalIndex].toLowerCase())
                                      )
                                      .map((position, posIndex) => {
                                        // Kiểm tra xem vị trí này có trong CV ban đầu không
                                        const isFromCV = cvJobRoleLevelIds.length > 0 && 
                                          jobRoleLevels.some(
                                            (jrl) => jrl.name === position && cvJobRoleLevelIds.includes(jrl.id)
                                          );
                                        
                                        return (
                                          <button
                                            type="button"
                                            key={posIndex}
                                            onClick={() => {
                                              onUpdate(globalIndex, 'position', position);
                                              setIsProjectPositionDropdownOpen((prev) => ({
                                                ...prev,
                                                [globalIndex]: false,
                                              }));
                                              setProjectPositionSearch((prev) => ({
                                                ...prev,
                                                [globalIndex]: '',
                                              }));
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between ${
                                              project.position === position
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'hover:bg-neutral-50 text-neutral-700'
                                            }`}
                                          >
                                            <span>{position}</span>
                                            {isFromCV && (
                                              <span className="text-xs text-green-600 font-medium">(Từ CV)</span>
                                            )}
                                          </button>
                                        );
                                      })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {errors[`project_position_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`project_position_${globalIndex}`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Technologies */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          Công nghệ sử dụng
                        </label>
                        <input
                          type="text"
                          value={project.technologies || ''}
                          onChange={(e) => onUpdate(globalIndex, 'technologies', e.target.value)}
                          placeholder="React, Node.js, MongoDB..."
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDescriptionOpen((prev) => ({
                              ...prev,
                              [globalIndex]: !prev[globalIndex],
                            }));
                          }}
                          className="flex items-center justify-between w-full text-left mb-1.5"
                        >
                          <label className="text-sm font-medium text-neutral-700 cursor-pointer">
                            Mô tả dự án
                          </label>
                          {isDescriptionOpen[globalIndex] ? (
                            <ChevronUp className="w-4 h-4 text-neutral-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                          )}
                        </button>
                        {isDescriptionOpen[globalIndex] && (
                          <textarea
                            value={project.description || ''}
                            onChange={(e) => onUpdate(globalIndex, 'description', e.target.value)}
                            rows={3}
                            placeholder="Mô tả về dự án, chức năng, vai trò của bạn..."
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {talentProjects.length > itemsPerPage && (
              <SectionPagination
                currentPage={currentPage}
                totalItems={talentProjects.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="dự án"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

