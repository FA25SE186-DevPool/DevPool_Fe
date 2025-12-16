import { Plus, Trash2, Target, X, Save, Search, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { TalentJobRoleLevelEditModal } from './TalentJobRoleLevelEditModal';
import { type TalentJobRoleLevel } from '../../../services/TalentJobRoleLevel';
import { type TalentJobRoleLevelCreateModel } from '../../../services/Talent';
import { type JobRole } from '../../../services/JobRole';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';

interface TalentDetailJobRoleLevelsSectionProps {
  // Data
  jobRoleLevels: (TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string })[];
  selectedJobRoleLevels: number[];
  setSelectedJobRoleLevels: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageJobRoleLevels: number;
  setPageJobRoleLevels: (page: number) => void;
  itemsPerPage: number;

  // Lookup data
  jobRoles: JobRole[];
  lookupJobRoleLevelsForTalent: JobRoleLevel[];
  talentCVs?: Array<{ jobRoleLevelId?: number }>; // CVs để kiểm tra xem có vị trí mới không

  // Inline form
  showInlineForm: boolean;
  inlineJobRoleLevelForm: Partial<TalentJobRoleLevelCreateModel>;
  setInlineJobRoleLevelForm: (form: Partial<TalentJobRoleLevelCreateModel> | ((prev: any) => Partial<TalentJobRoleLevelCreateModel>)) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Job role level selection
  selectedJobRoleLevelName: string;
  setSelectedJobRoleLevelName: (name: string) => void;
  jobRoleLevelNameSearch: string;
  setJobRoleLevelNameSearch: (search: string) => void;
  isJobRoleLevelNameDropdownOpen: boolean;
  setIsJobRoleLevelNameDropdownOpen: (open: boolean) => void;
  selectedLevel: number | undefined;
  setSelectedLevel: (level: number | undefined) => void;
  isLevelDropdownOpen: boolean;
  setIsLevelDropdownOpen: (open: boolean) => void;

  // Job role filter
  selectedJobRoleFilterId: number | undefined;
  setSelectedJobRoleFilterId: (id: number | undefined) => void;
  jobRoleFilterSearch: string;
  setJobRoleFilterSearch: (search: string) => void;
  isJobRoleFilterDropdownOpen: boolean;
  setIsJobRoleFilterDropdownOpen: (open: boolean) => void;

  // CV Analysis suggestions
  analysisResult?: CVAnalysisComparisonResponse | null;
  matchedJobRoleLevelsNotInProfile: Array<{
    jobRoleLevelId: number;
    position: string;
    level?: string;
    yearsOfExp?: number;
    ratePerMonth?: number;
  }>;
  jobRoleLevelsUnmatched: Array<{
    position?: string;
    level?: string;
    yearsOfExp?: number;
    ratePerMonth?: number;
  }>;
  onQuickCreateJobRoleLevel?: (jobRole: {
    jobRoleLevelId: number;
    position: string;
    level?: string;
    yearsOfExp?: number;
    ratePerMonth?: number;
  }) => void;
  onQuickCreateUnmatchedJobRoleLevel?: (jobRole: {
    position: string;
    level?: string;
    yearsOfExp?: number;
    ratePerMonth?: number;
  }) => void;

  // Permissions
  canEdit: boolean;

  // Helpers
  getLevelText: (level: number) => string;

  // Refresh callback
  onRefreshJobRoleLevels?: () => void;
}

/**
 * Component section hiển thị và quản lý vị trí công việc trong Talent Detail page
 */
export function TalentDetailJobRoleLevelsSection({
  jobRoleLevels,
  selectedJobRoleLevels,
  setSelectedJobRoleLevels,
  pageJobRoleLevels,
  setPageJobRoleLevels,
  itemsPerPage,
  jobRoles,
  lookupJobRoleLevelsForTalent,
  showInlineForm,
  inlineJobRoleLevelForm: _inlineJobRoleLevelForm,
  setInlineJobRoleLevelForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  selectedJobRoleLevelName,
  setSelectedJobRoleLevelName,
  jobRoleLevelNameSearch,
  setJobRoleLevelNameSearch,
  isJobRoleLevelNameDropdownOpen,
  setIsJobRoleLevelNameDropdownOpen,
  selectedLevel,
  setSelectedLevel,
  isLevelDropdownOpen,
  setIsLevelDropdownOpen,
  selectedJobRoleFilterId,
  setSelectedJobRoleFilterId,
  jobRoleFilterSearch,
  setJobRoleFilterSearch,
  isJobRoleFilterDropdownOpen,
  setIsJobRoleFilterDropdownOpen,
  analysisResult: _analysisResult,
  matchedJobRoleLevelsNotInProfile,
  jobRoleLevelsUnmatched,
  onQuickCreateJobRoleLevel,
  onQuickCreateUnmatchedJobRoleLevel,
  canEdit,
  getLevelText,
  onRefreshJobRoleLevels,
}: TalentDetailJobRoleLevelsSectionProps) {
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobRoleLevelId, setEditingJobRoleLevelId] = useState<number | null>(null);

  // Get unique names from jobRoleLevels, filtered by jobRole if needed
  const filteredByJobRole = selectedJobRoleFilterId
    ? lookupJobRoleLevelsForTalent.filter((j) => j.jobRoleId === selectedJobRoleFilterId)
    : lookupJobRoleLevelsForTalent;

  const uniqueNames = Array.from(new Set(filteredByJobRole.map((j) => j.name || ''))).filter((name) => name);

  const filteredNames = jobRoleLevelNameSearch
    ? uniqueNames.filter((name) => name.toLowerCase().includes(jobRoleLevelNameSearch.toLowerCase()))
    : uniqueNames;

  // Get available levels for selected name
  const availableLevels = selectedJobRoleLevelName
    ? lookupJobRoleLevelsForTalent
        .filter((j) => j.name === selectedJobRoleLevelName)
        .map((j) => j.level)
        .filter((level, idx, self) => self.indexOf(level) === idx)
    : [];

  // Get selected job role level IDs (excluding current form)
  const selectedJobRoleLevelIds = jobRoleLevels.map((jrl) => jrl.jobRoleLevelId).filter((id) => id > 0);
  
  // Kiểm tra xem có vị trí nào trong CVs nhưng chưa được tạo trong jobRoleLevels không
  // Sử dụng matchedJobRoleLevelsNotInProfile từ CV Analysis
  const hasNewPositionFromCVs = matchedJobRoleLevelsNotInProfile && matchedJobRoleLevelsNotInProfile.length > 0;
  
  // Get selected position names (for checking if a position name is already selected)
  const selectedPositionNames = Array.from(
    new Set(
      jobRoleLevels
        .map((jrl) => jrl.jobRoleLevelName)
        .filter((name) => name && name.trim() !== '')
    )
  );

  return (
    <div className="space-y-6">
      {/* CV Analysis Suggestions */}
      {(matchedJobRoleLevelsNotInProfile.length > 0 || jobRoleLevelsUnmatched.length > 0) && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Đề xuất vị trí (CV có)</h3>
            <span className="text-xs text-green-700">
              {matchedJobRoleLevelsNotInProfile.length} cần tạo mới · {jobRoleLevelsUnmatched.length} chưa có trong hệ thống
            </span>
          </div>
          {(matchedJobRoleLevelsNotInProfile.length > 0 || jobRoleLevelsUnmatched.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-3">
              {matchedJobRoleLevelsNotInProfile.length > 0 && (
                <div className="space-y-2">
                  <ul className="space-y-2">
                    {matchedJobRoleLevelsNotInProfile.map((jobRole, index) => (
                      <li
                        key={`jobrole-matched-notin-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm"
                      >
                        <span className="font-semibold text-sm">
                          {jobRole.position}
                        </span>
                        {onQuickCreateJobRoleLevel && (
                          <button
                            onClick={() => onQuickCreateJobRoleLevel(jobRole)}
                            className="px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-medium"
                          >
                            Tạo nhanh
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {jobRoleLevelsUnmatched.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({jobRoleLevelsUnmatched.length})</p>
                  <ul className="space-y-2">
                    {jobRoleLevelsUnmatched.map((suggestion, index) => (
                      <li
                        key={`jobrole-unmatched-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm"
                      >
                        <span className="font-semibold text-sm">
                          {suggestion.position ?? 'Vị trí chưa rõ'}
                          {suggestion.level && <span className="ml-1.5 text-amber-600">· {suggestion.level}</span>}
                        </span>
                        {onQuickCreateUnmatchedJobRoleLevel && (
                          <button
                            onClick={() => onQuickCreateUnmatchedJobRoleLevel({
                              position: suggestion.position ?? 'Vị trí chưa rõ',
                              level: suggestion.level,
                              yearsOfExp: suggestion.yearsOfExp,
                              ratePerMonth: suggestion.ratePerMonth,
                            })}
                            className="px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-medium"
                          >
                            Tạo nhanh
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vị trí</h3>
        <div className="flex gap-2">
          {!showInlineForm && hasNewPositionFromCVs && (
            <Button
              onClick={onOpenForm}
              disabled={isSubmitting || !canEdit}
              className={`group flex items-center justify-center bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                isSubmitting || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                !canEdit
                  ? 'Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                  : isSubmitting
                    ? 'Đang xử lý...'
                    : 'Thêm vị trí'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedJobRoleLevels.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa vị trí ({selectedJobRoleLevels.length})
            </Button>
          )}
        </div>
      </div>

      {/* Form and List in same row */}
      <div className={`grid gap-6 ${showInlineForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Inline JobRoleLevel Form */}
        {showInlineForm && (
          <div className="bg-white rounded-xl border-2 border-warning-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thêm vị trí mới</h3>
              <button
                onClick={onCloseForm}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          <div className="space-y-4">
            {/* Job Role Filter */}
            {jobRoles.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Lọc theo loại vị trí</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsJobRoleFilterDropdownOpen(!isJobRoleFilterDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left focus:border-warning-500 focus:ring-warning-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Filter className="w-4 h-4 text-neutral-400" />
                      <span>
                        {selectedJobRoleFilterId
                          ? jobRoles.find((r) => r.id === selectedJobRoleFilterId)?.name || 'Loại vị trí'
                          : 'Tất cả loại vị trí'}
                      </span>
                    </div>
                  </button>
                  {isJobRoleFilterDropdownOpen && (
                    <div
                      className="absolute bottom-full left-0 right-0 z-30 mb-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setIsJobRoleFilterDropdownOpen(false);
                        setJobRoleFilterSearch('');
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={jobRoleFilterSearch}
                            onChange={(e) => setJobRoleFilterSearch(e.target.value)}
                            placeholder="Tìm loại vị trí..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-warning-500 focus:ring-warning-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobRoleFilterId(undefined);
                            setJobRoleFilterSearch('');
                            setIsJobRoleFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm ${
                            !selectedJobRoleFilterId
                              ? 'bg-warning-50 text-warning-700'
                              : 'hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          Tất cả loại vị trí
                        </button>
                        {jobRoles
                          .filter(
                            (role) => !jobRoleFilterSearch || role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
                          )
                          .map((role) => (
                            <button
                              type="button"
                              key={role.id}
                              onClick={() => {
                                setSelectedJobRoleFilterId(role.id);
                                setJobRoleFilterSearch('');
                                setIsJobRoleFilterDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                selectedJobRoleFilterId === role.id
                                  ? 'bg-warning-50 text-warning-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              {role.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job Role Level Name and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropdown 1: Chọn Vị trí (Name) */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Vị trí <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsJobRoleLevelNameDropdownOpen(!isJobRoleLevelNameDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-warning-500/20 transition-all border-neutral-300 focus:border-warning-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Target className="w-4 h-4 text-neutral-400" />
                      <span className={selectedJobRoleLevelName ? 'font-medium text-neutral-900' : 'text-neutral-500'}>
                        {selectedJobRoleLevelName || 'Chọn vị trí'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${isJobRoleLevelNameDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isJobRoleLevelNameDropdownOpen && (
                    <div
                      className="absolute bottom-full left-0 right-0 z-[60] mb-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setTimeout(() => setIsJobRoleLevelNameDropdownOpen(false), 200);
                        setJobRoleLevelNameSearch('');
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={jobRoleLevelNameSearch}
                            onChange={(e) => setJobRoleLevelNameSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Tìm vị trí..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-warning-500 focus:ring-warning-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredNames.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>
                        ) : (
                          filteredNames.map((name) => {
                            // Kiểm tra xem vị trí này đã được chọn chưa
                            const isAlreadySelected = selectedPositionNames.includes(name);
                            
                            return (
                              <button
                                type="button"
                                key={name}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isAlreadySelected) {
                                    setSelectedJobRoleLevelName(name);
                                    setIsJobRoleLevelNameDropdownOpen(false);
                                    setJobRoleLevelNameSearch('');
                                    setSelectedLevel(undefined);
                                    setInlineJobRoleLevelForm((prev) => ({ ...prev, jobRoleLevelId: 0 }));
                                    const firstMatch = lookupJobRoleLevelsForTalent.find((j) => j.name === name);
                                    if (firstMatch) {
                                      setSelectedJobRoleFilterId(firstMatch.jobRoleId);
                                    }
                                  }
                                }}
                                disabled={isAlreadySelected}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleLevelName === name
                                    ? 'bg-warning-50 text-warning-700'
                                    : isAlreadySelected
                                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed italic'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                                title={isAlreadySelected ? 'Vị trí này đã được chọn' : ''}
                              >
                                {name}
                                {isAlreadySelected && ' (đã chọn)'}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dropdown 2: Chọn Cấp độ (Level) */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Cấp độ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedJobRoleLevelName) {
                        setIsLevelDropdownOpen(!isLevelDropdownOpen);
                      }
                    }}
                    disabled={!selectedJobRoleLevelName}
                    className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-warning-500/20 transition-all ${
                      !selectedJobRoleLevelName
                        ? 'opacity-50 cursor-not-allowed bg-neutral-50'
                        : 'border-neutral-300 focus:border-warning-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-neutral-500" />
                      <span
                        className={
                          !selectedJobRoleLevelName
                            ? 'text-neutral-400'
                            : selectedLevel !== undefined
                              ? 'font-medium text-neutral-900'
                              : 'text-neutral-500'
                        }
                      >
                        {!selectedJobRoleLevelName
                          ? 'Chọn vị trí trước'
                          : selectedLevel !== undefined
                            ? getLevelText(selectedLevel)
                            : 'Chọn cấp độ'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isLevelDropdownOpen && selectedJobRoleLevelName && (
                    <div
                      className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setTimeout(() => setIsLevelDropdownOpen(false), 200);
                      }}
                    >
                      <div className="max-h-56 overflow-y-auto">
                        {availableLevels.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Không có cấp độ nào cho vị trí này</p>
                        ) : (
                          availableLevels.map((level) => {
                            const matchingJobRoleLevel = lookupJobRoleLevelsForTalent.find(
                              (j) => j.name === selectedJobRoleLevelName && j.level === level
                            );
                            const isDisabled = matchingJobRoleLevel
                              ? selectedJobRoleLevelIds.includes(matchingJobRoleLevel.id)
                              : false;

                            return (
                              <button
                                type="button"
                                key={level}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isDisabled && matchingJobRoleLevel) {
                                    setSelectedLevel(level);
                                    setIsLevelDropdownOpen(false);
                                    setInlineJobRoleLevelForm((prev) => ({ ...prev, jobRoleLevelId: matchingJobRoleLevel.id }));
                                  }
                                }}
                                disabled={isDisabled}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedLevel === level
                                    ? 'bg-warning-50 text-warning-700'
                                    : isDisabled
                                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed italic'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {getLevelText(level)}
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
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white transition-all flex items-center gap-2 ${
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

          {/* Job Role Levels List */}
        <div className={showInlineForm ? '' : 'col-span-1'}>
          {jobRoleLevels.length > 0 ? (
            <>
              <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedJobRoleLevels.length ===
                          jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).length &&
                        jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentPageItems = jobRoleLevels
                            .slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage)
                            .map((jrl) => jrl.id);
                          setSelectedJobRoleLevels([...new Set([...selectedJobRoleLevels, ...currentPageItems])]);
                        } else {
                          const currentPageItems = jobRoleLevels
                            .slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage)
                            .map((jrl) => jrl.id);
                          setSelectedJobRoleLevels(selectedJobRoleLevels.filter((id) => !currentPageItems.includes(id)));
                        }
                      }}
                      className="w-4 h-4 text-warning-600 bg-gray-100 border-gray-300 rounded focus:ring-warning-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Cấp độ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {jobRoleLevels
                  .slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage)
                  .map((jrl) => (
                    <tr
                      key={jrl.id}
                      className="hover:bg-warning-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        setEditingJobRoleLevelId(jrl.id);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedJobRoleLevels.includes(jrl.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedJobRoleLevels([...selectedJobRoleLevels, jrl.id]);
                            } else {
                              setSelectedJobRoleLevels(selectedJobRoleLevels.filter((id) => id !== jrl.id));
                            }
                          }}
                          className="w-4 h-4 text-warning-600 bg-gray-100 border-gray-300 rounded focus:ring-warning-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-warning-800">{jrl.jobRoleLevelName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-warning-700">{jrl.jobRoleLevelLevel}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SectionPagination
            currentPage={pageJobRoleLevels}
            totalItems={jobRoleLevels.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageJobRoleLevels}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có thông tin vị trí</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật vị trí làm việc</p>
        </div>
          )}
        </div>

        {/* Edit Modal */}
        <TalentJobRoleLevelEditModal
          isOpen={isEditModalOpen}
          talentJobRoleLevelId={editingJobRoleLevelId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingJobRoleLevelId(null);
          }}
          onSuccess={() => {
            if (onRefreshJobRoleLevels) {
              onRefreshJobRoleLevels();
            }
          }}
        />
      </div>
    </div>
  );
}

