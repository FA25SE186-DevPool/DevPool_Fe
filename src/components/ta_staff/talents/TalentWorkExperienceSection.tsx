import { useState, useEffect } from 'react';
import { Plus, X, Briefcase, Calendar, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentWorkExperienceCreateModel } from '../../../services/Talent';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type TalentCVCreate } from '../../../services/TalentCV';

interface TalentWorkExperienceSectionProps {
  talentWorkExperiences: TalentWorkExperienceCreateModel[];
  jobRoleLevels: JobRoleLevel[];
  initialCVs?: Partial<TalentCVCreate>[];
  workExperiencePositionSearch: Record<number, string>;
  setWorkExperiencePositionSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isWorkExperiencePositionDropdownOpen: Record<number, boolean>;
  setIsWorkExperiencePositionDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentWorkExperienceCreateModel, value: string | undefined) => void;
}

/**
 * Component section quản lý kinh nghiệm làm việc của Talent
 */
export function TalentWorkExperienceSection({
  talentWorkExperiences,
  jobRoleLevels,
  initialCVs,
  workExperiencePositionSearch,
  setWorkExperiencePositionSearch,
  isWorkExperiencePositionDropdownOpen,
  setIsWorkExperiencePositionDropdownOpen,
  errors,
  onAdd,
  onRemove,
  onUpdate,
}: TalentWorkExperienceSectionProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Description collapse state
  const [isDescriptionOpen, setIsDescriptionOpen] = useState<Record<number, boolean>>({});

  // Calculate pagination
  const totalPages = Math.ceil(talentWorkExperiences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExperiences = talentWorkExperiences.slice(startIndex, endIndex);

  // Reset to page 1 when experiences list changes and current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [talentWorkExperiences.length, currentPage, totalPages]);

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
              <Briefcase className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Kinh nghiệm làm việc</h2>
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
            Thêm kinh nghiệm
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {talentWorkExperiences.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có kinh nghiệm nào. Nhấn "Thêm kinh nghiệm" để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedExperiences.map((exp, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <div key={globalIndex} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-neutral-700">Kinh nghiệm #{globalIndex + 1}</span>
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
                        {/* Company */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Công ty <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => onUpdate(globalIndex, 'company', e.target.value)}
                            placeholder="Tên công ty"
                            className={`w-full px-3 py-2 border rounded-lg bg-white ${
                              errors[`workexp_company_${globalIndex}`]
                                ? 'border-red-500'
                                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                            }`}
                          />
                          {errors[`workexp_company_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`workexp_company_${globalIndex}`]}</p>
                          )}
                        </div>

                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Vị trí <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setIsWorkExperiencePositionDropdownOpen((prev) => ({
                                  ...prev,
                                  [globalIndex]: !prev[globalIndex],
                                }))
                              }
                              className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left ${
                                errors[`workexp_position_${globalIndex}`]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-neutral-300 hover:border-primary-300'
                              }`}
                            >
                              <span className="text-sm text-neutral-700">
                                {exp.position || 'Chọn vị trí'}
                              </span>
                              <X
                                className={`w-4 h-4 text-neutral-400 transition-transform ${
                                  isWorkExperiencePositionDropdownOpen[globalIndex] ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            {isWorkExperiencePositionDropdownOpen[globalIndex] && (
                              <div
                                className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                onMouseLeave={() => {
                                  setIsWorkExperiencePositionDropdownOpen((prev) => ({
                                    ...prev,
                                    [globalIndex]: false,
                                  }));
                                  setWorkExperiencePositionSearch((prev) => ({
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
                                      value={workExperiencePositionSearch[globalIndex] || ''}
                                      onChange={(e) =>
                                        setWorkExperiencePositionSearch((prev) => ({
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
                                          !workExperiencePositionSearch[globalIndex] ||
                                          pos
                                            .toLowerCase()
                                            .includes(workExperiencePositionSearch[globalIndex].toLowerCase())
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
                                              setIsWorkExperiencePositionDropdownOpen((prev) => ({
                                                ...prev,
                                                [globalIndex]: false,
                                              }));
                                              setWorkExperiencePositionSearch((prev) => ({
                                                ...prev,
                                                [globalIndex]: '',
                                              }));
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between ${
                                              exp.position === position
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
                          {errors[`workexp_position_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`workexp_position_${globalIndex}`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Start Date */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Ngày bắt đầu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={exp.startDate || ''}
                            max={exp.endDate || undefined}
                            onChange={(e) => {
                              const newStartDate = e.target.value;
                              // Kiểm tra nếu startDate > endDate
                              if (newStartDate && exp.endDate && newStartDate > exp.endDate) {
                                // Không cho phép chọn ngày sau endDate
                                return;
                              }
                              onUpdate(globalIndex, 'startDate', newStartDate);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg bg-white ${
                              errors[`workexp_startdate_${globalIndex}`]
                                ? 'border-red-500'
                                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                            }`}
                          />
                          {errors[`workexp_startdate_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`workexp_startdate_${globalIndex}`]}</p>
                          )}
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Ngày kết thúc
                          </label>
                          <input
                            type="date"
                            value={exp.endDate || ''}
                            min={exp.startDate || undefined}
                            onChange={(e) => {
                              const newEndDate = e.target.value || undefined;
                              // Kiểm tra nếu endDate < startDate
                              if (newEndDate && exp.startDate && newEndDate < exp.startDate) {
                                // Không cho phép chọn ngày trước startDate
                                return;
                              }
                              onUpdate(globalIndex, 'endDate', newEndDate);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg bg-white ${
                              errors[`workexp_enddate_${globalIndex}`]
                                ? 'border-red-500'
                                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                            }`}
                          />
                          {errors[`workexp_enddate_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`workexp_enddate_${globalIndex}`]}</p>
                          )}
                        </div>
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
                            Mô tả công việc
                          </label>
                          {isDescriptionOpen[globalIndex] ? (
                            <ChevronUp className="w-4 h-4 text-neutral-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                          )}
                        </button>
                        {isDescriptionOpen[globalIndex] && (
                          <textarea
                            value={exp.description || ''}
                            onChange={(e) => onUpdate(globalIndex, 'description', e.target.value)}
                            rows={3}
                            placeholder="Mô tả công việc, trách nhiệm, thành tựu..."
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {talentWorkExperiences.length > itemsPerPage && (
              <SectionPagination
                currentPage={currentPage}
                totalItems={talentWorkExperiences.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="kinh nghiệm"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

