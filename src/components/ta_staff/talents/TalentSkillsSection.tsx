import { useState, useEffect } from 'react';
import { Plus, X, Star, Layers } from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentSkillCreateModel } from '../../../services/Talent';
import { type Skill } from '../../../services/Skill';
import { type SkillGroup } from '../../../services/SkillGroup';

interface TalentSkillsSectionProps {
  talentSkills: TalentSkillCreateModel[];
  skills: Skill[];
  skillGroups: SkillGroup[];
  skillSearchQuery: Record<number, string>;
  setSkillSearchQuery: (query: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isSkillDropdownOpen: Record<number, boolean>;
  setIsSkillDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  skillGroupSearchQuery: string;
  setSkillGroupSearchQuery: (query: string) => void;
  isSkillGroupDropdownOpen: boolean;
  setIsSkillGroupDropdownOpen: (open: boolean) => void;
  selectedSkillGroupId: number | undefined;
  setSelectedSkillGroupId: (id: number | undefined) => void;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentSkillCreateModel, value: string | number) => void;
}

/**
 * Component section quản lý kỹ năng của Talent
 */
export function TalentSkillsSection({
  talentSkills,
  skills,
  skillGroups,
  skillSearchQuery,
  setSkillSearchQuery,
  isSkillDropdownOpen,
  setIsSkillDropdownOpen,
  skillGroupSearchQuery,
  setSkillGroupSearchQuery,
  isSkillGroupDropdownOpen,
  setIsSkillGroupDropdownOpen,
  selectedSkillGroupId,
  setSelectedSkillGroupId,
  errors,
  onAdd,
  onRemove,
  onUpdate,
}: TalentSkillsSectionProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Filter skills by group
  const filteredSkills = selectedSkillGroupId
    ? skills.filter((s) => s.skillGroupId === selectedSkillGroupId)
    : skills;

  // Calculate pagination
  const totalPages = Math.ceil(talentSkills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSkills = talentSkills.slice(startIndex, endIndex);

  // Reset to page 1 when skills list changes and current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [talentSkills.length, currentPage, totalPages]);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <Star className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Kỹ năng</h2>
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
            Thêm kỹ năng
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Skill Group Filter */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            <Layers className="w-4 h-4 inline mr-1.5" />
            Lọc theo nhóm kỹ năng
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSkillGroupDropdownOpen(!isSkillGroupDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
            >
              <span className="text-sm text-neutral-700">
                {selectedSkillGroupId
                  ? skillGroups.find((g) => g.id === selectedSkillGroupId)?.name || 'Tất cả nhóm'
                  : 'Tất cả nhóm'}
              </span>
              <X
                className={`w-4 h-4 text-neutral-400 transition-transform ${
                  isSkillGroupDropdownOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
            {isSkillGroupDropdownOpen && (
              <div
                className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                onMouseLeave={() => {
                  setIsSkillGroupDropdownOpen(false);
                  setSkillGroupSearchQuery('');
                }}
              >
                <div className="p-3 border-b border-neutral-100">
                  <input
                    type="text"
                    value={skillGroupSearchQuery}
                    onChange={(e) => setSkillGroupSearchQuery(e.target.value)}
                    placeholder="Tìm nhóm kỹ năng..."
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkillGroupId(undefined);
                      setIsSkillGroupDropdownOpen(false);
                      setSkillGroupSearchQuery('');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${
                      !selectedSkillGroupId
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    Tất cả nhóm
                  </button>
                  {skillGroups
                    .filter((g) =>
                      !skillGroupSearchQuery ||
                      g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase())
                    )
                    .map((group) => (
                      <button
                        type="button"
                        key={group.id}
                        onClick={() => {
                          setSelectedSkillGroupId(group.id);
                          setIsSkillGroupDropdownOpen(false);
                          setSkillGroupSearchQuery('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${
                          selectedSkillGroupId === group.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills List */}
        {talentSkills.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có kỹ năng nào. Nhấn "Thêm kỹ năng" để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedSkills.map((skill, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <div
                    key={globalIndex}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-neutral-700">Kỹ năng #{globalIndex + 1}</span>
                      <Button
                        type="button"
                        onClick={() => onRemove(globalIndex)}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Skill Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Kỹ năng <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsSkillDropdownOpen((prev) => ({
                            ...prev,
                            [globalIndex]: !prev[globalIndex],
                          }))
                        }
                        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left ${
                          errors[`skill_${globalIndex}`]
                            ? 'border-red-500 bg-red-50'
                            : 'border-neutral-300 hover:border-primary-300'
                        }`}
                      >
                        <span className="text-sm text-neutral-700">
                          {skill.skillId && skill.skillId > 0
                            ? skills.find((s) => s.id === skill.skillId)?.name || 'Chọn kỹ năng'
                            : 'Chọn kỹ năng'}
                        </span>
                        <X
                          className={`w-4 h-4 text-neutral-400 transition-transform ${
                            isSkillDropdownOpen[globalIndex] ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {isSkillDropdownOpen[globalIndex] && (
                        <div
                          className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => {
                            setIsSkillDropdownOpen((prev) => ({ ...prev, [globalIndex]: false }));
                            setSkillSearchQuery((prev) => ({ ...prev, [globalIndex]: '' }));
                          }}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <input
                              type="text"
                              value={skillSearchQuery[globalIndex] || ''}
                              onChange={(e) =>
                                setSkillSearchQuery((prev) => ({ ...prev, [globalIndex]: e.target.value }))
                              }
                              placeholder="Tìm kỹ năng..."
                              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {filteredSkills
                              .filter(
                                (s) =>
                                  !skillSearchQuery[globalIndex] ||
                                  s.name.toLowerCase().includes(skillSearchQuery[globalIndex].toLowerCase())
                              )
                              .map((s) => {
                                // Kiểm tra xem skill này đã được chọn ở entry khác chưa
                                const isAlreadySelected = talentSkills.some(
                                  (ts, idx) => idx !== globalIndex && ts.skillId === s.id && ts.skillId > 0
                                );
                                
                                return (
                                  <button
                                    type="button"
                                    key={s.id}
                                    onClick={() => {
                                      if (!isAlreadySelected) {
                                        onUpdate(globalIndex, 'skillId', s.id);
                                        setIsSkillDropdownOpen((prev) => ({ ...prev, [globalIndex]: false }));
                                        setSkillSearchQuery((prev) => ({ ...prev, [globalIndex]: '' }));
                                      }
                                    }}
                                    disabled={isAlreadySelected}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      skill.skillId === s.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : isAlreadySelected
                                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed italic'
                                          : 'hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                    title={isAlreadySelected ? 'Kỹ năng này đã được chọn ở entry khác' : ''}
                                  >
                                    {s.name}
                                    {isAlreadySelected && ' (đã chọn)'}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors[`skill_${globalIndex}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`skill_${globalIndex}`]}</p>
                    )}
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Cấp độ</label>
                    <select
                      value={skill.level || 'Beginner'}
                      onChange={(e) => onUpdate(globalIndex, 'level', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="Beginner">Mới bắt đầu</option>
                      <option value="Intermediate">Trung bình</option>
                      <option value="Advanced">Nâng cao</option>
                      <option value="Expert">Chuyên gia</option>
                    </select>
                  </div>
                </div>
              </div>
                );
              })}
            </div>
            {talentSkills.length > itemsPerPage && (
              <SectionPagination
                currentPage={currentPage}
                totalItems={talentSkills.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="kỹ năng"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

