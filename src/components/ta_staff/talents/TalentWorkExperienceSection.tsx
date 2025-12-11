import { Plus, X, Briefcase, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { type TalentWorkExperienceCreateModel } from '../../../services/Talent';

interface TalentWorkExperienceSectionProps {
  talentWorkExperiences: TalentWorkExperienceCreateModel[];
  workExperiencePositions: string[];
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
  workExperiencePositions,
  workExperiencePositionSearch,
  setWorkExperiencePositionSearch,
  isWorkExperiencePositionDropdownOpen,
  setIsWorkExperiencePositionDropdownOpen,
  errors,
  onAdd,
  onRemove,
  onUpdate,
}: TalentWorkExperienceSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Kinh nghiệm làm việc</h2>
          </div>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm kinh nghiệm
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {talentWorkExperiences.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có kinh nghiệm nào. Nhấn "Thêm kinh nghiệm" để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {talentWorkExperiences.map((exp, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-neutral-700">Kinh nghiệm #{index + 1}</span>
                  <Button
                    type="button"
                    onClick={() => onRemove(index)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Công ty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => onUpdate(index, 'company', e.target.value)}
                        placeholder="Tên công ty"
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white ${
                          errors[`workexp_company_${index}`]
                            ? 'border-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {errors[`workexp_company_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`workexp_company_${index}`]}</p>
                      )}
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Vị trí <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsWorkExperiencePositionDropdownOpen((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left ${
                            errors[`workexp_position_${index}`]
                              ? 'border-red-500 bg-red-50'
                              : 'border-neutral-300 hover:border-primary-300'
                          }`}
                        >
                          <span className="text-sm text-neutral-700">
                            {exp.position || 'Chọn vị trí'}
                          </span>
                          <X
                            className={`w-4 h-4 text-neutral-400 transition-transform ${
                              isWorkExperiencePositionDropdownOpen[index] ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {isWorkExperiencePositionDropdownOpen[index] && (
                          <div
                            className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                            onMouseLeave={() => {
                              setIsWorkExperiencePositionDropdownOpen((prev) => ({
                                ...prev,
                                [index]: false,
                              }));
                              setWorkExperiencePositionSearch((prev) => ({
                                ...prev,
                                [index]: '',
                              }));
                            }}
                          >
                            <div className="p-3 border-b border-neutral-100">
                              <input
                                type="text"
                                value={workExperiencePositionSearch[index] || ''}
                                onChange={(e) =>
                                  setWorkExperiencePositionSearch((prev) => ({
                                    ...prev,
                                    [index]: e.target.value,
                                  }))
                                }
                                placeholder="Tìm vị trí..."
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {workExperiencePositions
                                .filter(
                                  (pos) =>
                                    !workExperiencePositionSearch[index] ||
                                    pos
                                      .toLowerCase()
                                      .includes(workExperiencePositionSearch[index].toLowerCase())
                                )
                                .map((position, posIndex) => (
                                  <button
                                    type="button"
                                    key={posIndex}
                                    onClick={() => {
                                      onUpdate(index, 'position', position);
                                      setIsWorkExperiencePositionDropdownOpen((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      }));
                                      setWorkExperiencePositionSearch((prev) => ({
                                        ...prev,
                                        [index]: '',
                                      }));
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      exp.position === position
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                  >
                                    {position}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {errors[`workexp_position_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`workexp_position_${index}`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
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
                          onUpdate(index, 'startDate', newStartDate);
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white ${
                          errors[`workexp_startdate_${index}`]
                            ? 'border-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {errors[`workexp_startdate_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`workexp_startdate_${index}`]}</p>
                      )}
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
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
                          onUpdate(index, 'endDate', newEndDate);
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white ${
                          errors[`workexp_enddate_${index}`]
                            ? 'border-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {errors[`workexp_enddate_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`workexp_enddate_${index}`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Mô tả công việc</label>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => onUpdate(index, 'description', e.target.value)}
                      rows={3}
                      placeholder="Mô tả công việc, trách nhiệm, thành tựu..."
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

