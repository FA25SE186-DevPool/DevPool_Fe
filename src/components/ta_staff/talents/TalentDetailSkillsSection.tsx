import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Star,
  Filter,
  Search,
  Save,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentSkill } from '../../../services/TalentSkill';
import { type Skill } from '../../../services/Skill';
import { type SkillGroup } from '../../../services/SkillGroup';
import { type SkillGroupVerificationStatus } from '../../../services/TalentSkillGroupAssessment';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';

interface TalentDetailSkillsSectionProps {
  // Data
  talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[];
  selectedSkills: number[];
  setSelectedSkills: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageSkills: number;
  setPageSkills: (page: number) => void;
  skillGroupsPerPage: number;

  // Lookup data
  lookupSkills: Skill[];
  lookupSkillGroups: SkillGroup[];
  skillGroupVerificationStatuses: Record<number, SkillGroupVerificationStatus>;

  // Inline form
  showInlineForm: boolean;
  inlineSkillForm: Partial<{ skillId: number; level: string; yearsExp: number }>;
  setInlineSkillForm: (form: any) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Skill selection states
  isSkillDropdownOpen: boolean;
  setIsSkillDropdownOpen: (open: boolean) => void;
  skillSearchQuery: string;
  setSkillSearchQuery: (query: string) => void;
  selectedSkillGroupId: number | undefined;
  setSelectedSkillGroupId: (id: number | undefined) => void;
  // Skill group dropdown states (separate from skill dropdown)
  isSkillGroupDropdownOpen: boolean;
  setIsSkillGroupDropdownOpen: (open: boolean) => void;
  skillGroupSearchQuery: string;
  setSkillGroupSearchQuery: (query: string) => void;

  // List filter states
  skillListSearchQuery: string;
  setSkillListSearchQuery: (query: string) => void;
  selectedSkillGroupIdForList: number | undefined;
  setSelectedSkillGroupIdForList: (id: number | undefined) => void;
  isSkillGroupListDropdownOpen: boolean;
  setIsSkillGroupListDropdownOpen: (open: boolean) => void;
  skillGroupListSearchQuery: string;
  setSkillGroupListSearchQuery: (query: string) => void;
  showOnlyUnverifiedSkills: boolean;
  setShowOnlyUnverifiedSkills: (show: boolean) => void;

  // CV Analysis suggestions
  analysisResult?: CVAnalysisComparisonResponse | null;
  matchedSkillsNotInProfile: Array<{
    skillId: number;
    skillName: string;
    cvLevel?: string;
    cvYearsExp?: number;
  }>;
  unmatchedSkillSuggestions: Array<{ skillName: string; level?: string }>;
  onQuickCreateSkill: (skill: {
    skillId: number;
    skillName: string;
    cvLevel?: string;
    cvYearsExp?: number;
  }) => void;
  onSuggestionRequest: (
    category: 'skill',
    key: string,
    displayItems: string[],
    detailItems: Array<Record<string, string>>
  ) => void;
  skillSuggestionRequestKey: string;
  skillSuggestionDisplayItems: string[];
  skillSuggestionDetailItems: Array<Record<string, string>>;
  isSuggestionPending: (key: string) => boolean;

  // Skill Group Verification
  onOpenVerifySkillGroup: (skillGroupId: number | undefined) => void;
  onOpenHistorySkillGroup: (skillGroupId: number | undefined) => void;
  onInvalidateSkillGroup: (skillGroupId: number | undefined) => void;

  // Permissions
  canEdit: boolean;

  // Helpers
  getLevelText: (level: string) => string;
}

const SKILL_GROUPS_PER_PAGE = 3;

/**
 * Component section hiển thị và quản lý kỹ năng trong Talent Detail page
 */
export function TalentDetailSkillsSection({
  talentSkills,
  selectedSkills,
  setSelectedSkills,
  pageSkills,
  setPageSkills,
  skillGroupsPerPage = SKILL_GROUPS_PER_PAGE,
  lookupSkills,
  lookupSkillGroups,
  skillGroupVerificationStatuses,
  showInlineForm,
  inlineSkillForm,
  setInlineSkillForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  isSkillDropdownOpen,
  setIsSkillDropdownOpen,
  skillSearchQuery,
  setSkillSearchQuery,
  selectedSkillGroupId,
  setSelectedSkillGroupId,
  isSkillGroupDropdownOpen,
  setIsSkillGroupDropdownOpen,
  skillGroupSearchQuery,
  setSkillGroupSearchQuery,
  skillListSearchQuery,
  setSkillListSearchQuery,
  selectedSkillGroupIdForList,
  setSelectedSkillGroupIdForList,
  isSkillGroupListDropdownOpen,
  setIsSkillGroupListDropdownOpen,
  skillGroupListSearchQuery,
  setSkillGroupListSearchQuery,
  showOnlyUnverifiedSkills,
  setShowOnlyUnverifiedSkills,
  analysisResult,
  matchedSkillsNotInProfile,
  unmatchedSkillSuggestions,
  onQuickCreateSkill,
  onSuggestionRequest,
  skillSuggestionRequestKey,
  skillSuggestionDisplayItems,
  skillSuggestionDetailItems,
  isSuggestionPending,
  onOpenVerifySkillGroup,
  onOpenHistorySkillGroup,
  onInvalidateSkillGroup,
  canEdit,
  getLevelText,
}: TalentDetailSkillsSectionProps) {
  const navigate = useNavigate();

  // Filter skills for inline form
  const filteredSkillsForForm = useMemo(() => {
    return lookupSkills.filter((s) => {
      const matchesSearch =
        !skillSearchQuery ||
        s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(skillSearchQuery.toLowerCase()));
      const matchesGroup = !selectedSkillGroupId || s.skillGroupId === selectedSkillGroupId;
      return matchesSearch && matchesGroup;
    });
  }, [lookupSkills, skillSearchQuery, selectedSkillGroupId]);

  // Get selected skill IDs to prevent duplicates
  const selectedSkillIds = useMemo(() => {
    return talentSkills.map((skill) => skill.skillId).filter((id) => id > 0);
  }, [talentSkills]);

  // Group and filter skills for display
  const groupedSkills = useMemo(() => {
    let filtered = talentSkills;

    // Filter by search query
    if (skillListSearchQuery) {
      filtered = filtered.filter((skill) => {
        const skillName = skill.skillName?.toLowerCase() || '';
        return skillName.includes(skillListSearchQuery.toLowerCase());
      });
    }

    // Filter by skill group
    if (selectedSkillGroupIdForList !== undefined) {
      filtered = filtered.filter((skill) => skill.skillGroupId === selectedSkillGroupIdForList);
    }

    // Group by skill group
    const groupMap: Record<
      string,
      {
        key: string;
        skillGroupId?: number;
        groupName: string;
        skills: (TalentSkill & { skillName: string; skillGroupId?: number })[];
      }
    > = {};

    filtered.forEach((skill) => {
      const groupId = skill.skillGroupId;
      const key = groupId ? `group-${groupId}` : 'group-ungrouped';
      if (!groupMap[key]) {
        const group = groupId ? lookupSkillGroups.find((g) => g.id === groupId) : undefined;
        groupMap[key] = {
          key,
          skillGroupId: groupId,
          groupName: group?.name ?? (groupId ? `Nhóm #${groupId}` : 'Khác'),
          skills: [],
        };
      }
      groupMap[key].skills.push(skill);
    });

    let groups = Object.values(groupMap);

    // Filter by verification status
    if (showOnlyUnverifiedSkills) {
      groups = groups.filter((g) => {
        if (!g.skillGroupId) return true;
        const status = skillGroupVerificationStatuses[g.skillGroupId];
        const isVerified = status?.isVerified === true;
        const needsReverification = status?.needsReverification === true;
        return !isVerified || needsReverification;
      });
    }

    return groups;
  }, [
    talentSkills,
    skillListSearchQuery,
    selectedSkillGroupIdForList,
    lookupSkillGroups,
    showOnlyUnverifiedSkills,
    skillGroupVerificationStatuses,
  ]);

  // Paginate groups
  const paginatedGroups = useMemo(() => {
    const startIndex = (pageSkills - 1) * skillGroupsPerPage;
    const endIndex = startIndex + skillGroupsPerPage;
    return groupedSkills.slice(startIndex, endIndex);
  }, [groupedSkills, pageSkills, skillGroupsPerPage]);

  return (
    <div className="space-y-6">
      {/* Inline Skill Form */}
      {showInlineForm && (
        <div className="bg-white rounded-xl border-2 border-secondary-200 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thêm kỹ năng mới</h3>
            <button
              onClick={onCloseForm}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Skill Group Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Nhóm kỹ năng</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSkillGroupDropdownOpen(!isSkillGroupDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-secondary-500/20 transition-all border-neutral-300 focus:border-secondary-500"
                >
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Layers className="w-4 h-4 text-neutral-400" />
                    <span>
                      {selectedSkillGroupId
                        ? lookupSkillGroups.find((g) => g.id === selectedSkillGroupId)?.name || 'Chọn nhóm kỹ năng'
                        : 'Tất cả nhóm kỹ năng'}
                    </span>
                  </div>
                </button>
                {isSkillGroupDropdownOpen && (
                  <div
                    className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                    onMouseLeave={() => {
                      setIsSkillGroupDropdownOpen(false);
                      setSkillGroupSearchQuery('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={skillGroupSearchQuery}
                          onChange={(e) => setSkillGroupSearchQuery(e.target.value)}
                          placeholder="Tìm nhóm kỹ năng..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
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
                        Tất cả nhóm kỹ năng
                      </button>
                      {lookupSkillGroups
                        .filter((g) =>
                          !skillGroupSearchQuery ||
                          g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()) ||
                          (g.description && g.description.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()))
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

            {/* Skill Selection */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Kỹ năng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-secondary-500/20 transition-all border-neutral-300 focus:border-secondary-500"
                >
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Star className="w-4 h-4 text-neutral-400" />
                    <span>
                      {inlineSkillForm.skillId && inlineSkillForm.skillId > 0
                        ? lookupSkills.find((s) => s.id === inlineSkillForm.skillId)?.name || 'Chọn kỹ năng'
                        : 'Chọn kỹ năng'}
                    </span>
                  </div>
                </button>
                {isSkillDropdownOpen && (
                  <div
                    className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                    onMouseLeave={() => {
                      setIsSkillDropdownOpen(false);
                      setSkillSearchQuery('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={skillSearchQuery}
                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                          placeholder="Tìm kỹ năng..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-secondary-500 focus:ring-secondary-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredSkillsForForm.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy kỹ năng nào</p>
                      ) : (
                        filteredSkillsForForm.map((skill) => {
                          const isDisabled = selectedSkillIds.includes(skill.id);
                          return (
                            <button
                              type="button"
                              key={skill.id}
                              onClick={() => {
                                if (!isDisabled) {
                                  setInlineSkillForm({ ...inlineSkillForm, skillId: skill.id });
                                  if (skill.skillGroupId) {
                                    setSelectedSkillGroupId(skill.skillGroupId);
                                  }
                                  setIsSkillDropdownOpen(false);
                                  setSkillSearchQuery('');
                                }
                              }}
                              disabled={isDisabled}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                inlineSkillForm.skillId === skill.id
                                  ? 'bg-secondary-50 text-secondary-700'
                                  : isDisabled
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed italic'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              {skill.name}
                              {isDisabled ? ' (đã chọn)' : ''}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Trình độ</label>
              <select
                value={inlineSkillForm.level || 'Beginner'}
                onChange={(e) => setInlineSkillForm({ ...inlineSkillForm, level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500"
              >
                <option value="Beginner">Mới bắt đầu</option>
                <option value="Intermediate">Trung bình</option>
                <option value="Advanced">Nâng cao</option>
                <option value="Expert">Chuyên gia</option>
              </select>
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

      {/* CV Analysis Suggestions */}
      {analysisResult &&
        (analysisResult.skills.newFromCV.length > 0 || analysisResult.skills.matched.length > 0) && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Đề xuất kỹ năng</h3>
              <span className="text-xs text-amber-700">
                {matchedSkillsNotInProfile.length} cần tạo mới · {unmatchedSkillSuggestions.length} chưa có trong hệ
                thống
              </span>
            </div>
            {(matchedSkillsNotInProfile.length > 0 || unmatchedSkillSuggestions.length > 0) && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <p className="font-medium mb-2 text-sm text-amber-900">So sánh khác với hồ sơ hiện tại:</p>
                {matchedSkillsNotInProfile.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-900">
                      Cần tạo mới (có trong hệ thống, chưa có trong hồ sơ) ({matchedSkillsNotInProfile.length}):
                    </p>
                    <ul className="space-y-1">
                      {matchedSkillsNotInProfile.map((skill, index) => (
                        <li
                          key={`missing-skill-system-${index}`}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{skill.skillName}</span>
                          </div>
                          <Button
                            onClick={() =>
                              onQuickCreateSkill({
                                skillId: skill.skillId,
                                skillName: skill.skillName,
                                cvLevel: skill.cvLevel,
                                cvYearsExp: skill.cvYearsExp ?? undefined,
                              })
                            }
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:from-primary-700 hover:to-primary-800"
                          >
                            <Plus className="w-4 h-4" />
                            Tạo nhanh
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {unmatchedSkillSuggestions.length > 0 && (
                  <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-white p-3 text-xs text-amber-700">
                    <p className="font-semibold text-amber-900">
                      Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({unmatchedSkillSuggestions.length}):
                    </p>
                    <ul className="mt-2 space-y-1">
                      {unmatchedSkillSuggestions.map((skill, index) => (
                        <li key={`unmatched-skill-${index}`}>- {skill.skillName}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-col items-end gap-1">
                      <Button
                        onClick={() =>
                          onSuggestionRequest('skill', skillSuggestionRequestKey, skillSuggestionDisplayItems, skillSuggestionDetailItems)
                        }
                        disabled={!skillSuggestionDisplayItems.length || isSuggestionPending(skillSuggestionRequestKey)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all duration-300 ${
                          !skillSuggestionDisplayItems.length || isSuggestionPending(skillSuggestionRequestKey)
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        {isSuggestionPending(skillSuggestionRequestKey)
                          ? 'Đã gửi đề xuất'
                          : 'Đề xuất thêm kỹ năng vào hệ thống'}
                      </Button>
                      {isSuggestionPending(skillSuggestionRequestKey) && (
                        <span className="text-xs text-amber-600">Đang chờ Admin xem xét đề xuất này.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Kỹ năng của nhân sự</h3>
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
                    : 'Thêm kỹ năng'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedSkills.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa kỹ năng ({selectedSkills.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters and search */}
      {talentSkills.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600">
              Tổng cộng <span className="font-semibold text-neutral-900">{talentSkills.length}</span> kỹ năng
            </p>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                checked={showOnlyUnverifiedSkills}
                onChange={(e) => setShowOnlyUnverifiedSkills(e.target.checked)}
              />
              <span>Chỉ xem nhóm kỹ năng chưa verify</span>
            </label>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search by skill name */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={skillListSearchQuery}
                onChange={(e) => setSkillListSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên kỹ năng..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white"
              />
            </div>
            {/* Filter by skill group */}
            {lookupSkillGroups.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSkillGroupListDropdownOpen(!isSkillGroupListDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all border-neutral-300"
                >
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <span>
                      {selectedSkillGroupIdForList
                        ? lookupSkillGroups.find((g) => g.id === selectedSkillGroupIdForList)?.name || 'Nhóm kỹ năng'
                        : 'Tất cả nhóm kỹ năng'}
                    </span>
                  </div>
                </button>
                {isSkillGroupListDropdownOpen && (
                  <div
                    className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                    onMouseLeave={() => {
                      setIsSkillGroupListDropdownOpen(false);
                      setSkillGroupListSearchQuery('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={skillGroupListSearchQuery}
                          onChange={(e) => setSkillGroupListSearchQuery(e.target.value)}
                          placeholder="Tìm nhóm kỹ năng..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSkillGroupIdForList(undefined);
                          setIsSkillGroupListDropdownOpen(false);
                          setSkillGroupListSearchQuery('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${
                          !selectedSkillGroupIdForList
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        Tất cả nhóm kỹ năng
                      </button>
                      {lookupSkillGroups
                        .filter(
                          (g) =>
                            !skillGroupListSearchQuery ||
                            g.name.toLowerCase().includes(skillGroupListSearchQuery.toLowerCase()) ||
                            (g.description && g.description.toLowerCase().includes(skillGroupListSearchQuery.toLowerCase()))
                        )
                        .map((group) => (
                          <button
                            type="button"
                            key={group.id}
                            onClick={() => {
                              setSelectedSkillGroupIdForList(group.id);
                              setIsSkillGroupListDropdownOpen(false);
                              setSkillGroupListSearchQuery('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              selectedSkillGroupIdForList === group.id
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
            )}
          </div>
        </>
      )}

      {/* Skills grouped by skill groups */}
      {groupedSkills.length > 0 ? (
        <>
          <div className="space-y-3">
            {paginatedGroups.map((group) => {
              const status: SkillGroupVerificationStatus | undefined =
                group.skillGroupId !== undefined
                  ? skillGroupVerificationStatuses[group.skillGroupId] ?? undefined
                  : undefined;
              const needsReverification = status?.needsReverification === true;
              const isVerified = status?.isVerified === true;
              const hasBeenVerified = status?.lastVerifiedDate != null;

              // Calculate checkbox for group
              const groupSkillIds = group.skills.map((s) => s.id);
              const allSelected =
                groupSkillIds.length > 0 && groupSkillIds.every((id) => selectedSkills.includes(id));

              return (
                <div key={group.key} className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <div>
                      <div className="flex items-center gap-2">
                        {group.skills.length > 0 && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                            checked={allSelected}
                            onChange={(e) => {
                              const shouldSelect = e.target.checked;
                              setSelectedSkills((prev) => {
                                if (shouldSelect) {
                                  const newIds = groupSkillIds.filter((id) => !prev.includes(id));
                                  return [...prev, ...newIds];
                                }
                                return prev.filter((id) => !groupSkillIds.includes(id));
                              });
                            }}
                          />
                        )}
                        <h4 className="text-sm font-semibold text-neutral-900">{group.groupName}</h4>
                        {group.skillGroupId &&
                          (needsReverification ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
                              title={status?.reason || 'Có kỹ năng được thêm hoặc cập nhật sau lần verify cuối'}
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Cần verify lại
                            </span>
                          ) : isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Đã verify
                            </span>
                          ) : hasBeenVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Không hợp lệ / bị hủy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-300">
                              <span className="w-2 h-2 rounded-full bg-neutral-400" />
                              Chưa verify
                            </span>
                          ))}
                      </div>
                      {status?.lastVerifiedDate && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[11px] text-neutral-500">
                            Lần cuối: {new Date(status.lastVerifiedDate).toLocaleString('vi-VN')}
                            {status.lastVerifiedByExpertName && (
                              <>
                                {' '}· Bởi <span className="font-medium">{status.lastVerifiedByExpertName}</span>
                              </>
                            )}
                          </p>
                          {needsReverification && status?.reason && (
                            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              <span className="font-medium">Lý do:</span> {status.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {group.skillGroupId && (
                        <>
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => onOpenVerifySkillGroup(group.skillGroupId)}
                              disabled={!canEdit}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary-600 text-white hover:bg-secondary-700 ${
                                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={!canEdit ? 'Bạn không có quyền verify. Chỉ TA đang quản lý nhân sự này mới được verify.' : ''}
                            >
                              Verify group
                            </button>
                          )}
                          {status && (
                            <button
                              type="button"
                              onClick={() => onOpenHistorySkillGroup(group.skillGroupId)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                              Lịch sử
                            </button>
                          )}
                          {status && isVerified && (
                            <button
                              type="button"
                              onClick={() => onInvalidateSkillGroup(group.skillGroupId)}
                              disabled={!canEdit}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ${
                                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={!canEdit ? 'Bạn không có quyền hủy đánh giá. Chỉ TA đang quản lý nhân sự này mới được hủy đánh giá.' : ''}
                            >
                              Hủy đánh giá
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {group.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/ta/talent-skills/edit/${skill.id}`)}
                      >
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                            checked={selectedSkills.includes(skill.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills([...selectedSkills, skill.id]);
                              } else {
                                setSelectedSkills(selectedSkills.filter((id) => id !== skill.id));
                              }
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{skill.skillName}</div>
                            <div className="text-xs text-neutral-500">
                              Level: {getLevelText(skill.level)} · {skill.yearsExp} năm
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {groupedSkills.length > skillGroupsPerPage && (
            <SectionPagination
              currentPage={pageSkills}
              totalItems={groupedSkills.length}
              itemsPerPage={skillGroupsPerPage}
              onPageChange={setPageSkills}
              itemLabel="nhóm kỹ năng"
            />
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có kỹ năng nào</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật kỹ năng</p>
        </div>
      )}
    </div>
  );
}

