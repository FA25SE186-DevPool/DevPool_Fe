import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Workflow,
  ChevronDown,
  ChevronUp,
  X,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { TalentDetailCVForm } from './TalentDetailCVForm';
import { TalentCVEditModal } from './TalentCVEditModal';
import { type TalentCV } from '../../../services/TalentCV';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type JobRole } from '../../../services/JobRole';

interface TalentDetailCVsSectionProps {
  // Data
  talentCVs: (TalentCV & { jobRoleLevelName?: string })[];
  selectedCVs: number[];
  setSelectedCVs: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageCVs: number;
  setPageCVs: (page: number) => void;
  itemsPerPage: number;

  // Inline form
  showInlineForm: boolean;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onDelete: () => void;

  // CV Analysis
  analysisResult?: CVAnalysisComparisonResponse | null;
  analysisResultCVId: number | null;
  analysisLoadingId: number | null;
  analysisError: string | null;
  onAnalyzeCV: (cv: TalentCV & { jobRoleLevelName?: string }) => void;
  onShowSuccessOverlay?: (message: string) => void;
  onCancelAnalysis: () => void;
  setAnalysisResult?: (result: any) => void;
  setAnalysisResultCVId?: (cvId: number | null) => void;
  expandedAnalysisDetail?: 'skills' | 'jobRoleLevels' | 'certificates' | 'projects' | 'experiences' | null;
  setExpandedAnalysisDetail?: (detail: 'skills' | 'jobRoleLevels' | 'certificates' | 'projects' | 'experiences' | null) => void;
  expandedBasicInfo?: boolean;
  setExpandedBasicInfo?: (expanded: boolean) => void;
  matchedSkillsNotInProfile?: Array<{
    skillId: number;
    skillName: string;
    cvLevel?: string;
    cvYearsExp?: string | number;
  }>;
  unmatchedSkillSuggestions?: Array<{
    skillName?: string;
    level?: string;
    yearsExp?: number | null;
  }>;
  jobRoleLevelsMatched?: Array<{
    suggestion: any;
    existing: any;
    system?: any;
  }>;
  matchedJobRoleLevelsNotInProfile?: Array<{
    jobRoleLevelId: number;
    position: string;
    level?: string | number;
    yearsOfExp?: number;
    ratePerMonth?: number;
  }>;
  jobRoleLevelsUnmatched?: any[];
  onQuickCreateSkill?: (skill: {
    skillId: number;
    skillName: string;
    cvLevel?: string;
    cvYearsExp?: string | number;
  }) => void;
  getLevelLabel?: (level: string | null | undefined) => string;
  getTalentLevelName?: (level: number | undefined) => string;
  isValueDifferent?: (current: string | null | undefined, suggested: string | null | undefined) => boolean;

  // Permissions
  canEdit: boolean;

  // Collapsed groups
  collapsedInactiveCVGroups: Set<string>;
  setCollapsedInactiveCVGroups: (groups: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

  // CV Tab control
  activeCVTab?: 'list' | 'analysis';
  setActiveCVTab?: (tab: 'list' | 'analysis') => void;

  // Refresh list after editing
  onRefreshCVs?: () => void | Promise<void>;

  // CV Form props (from useTalentDetailCVForm hook)
  cvForm?: {
    // Form data
    inlineCVForm: Partial<TalentCVCreate>;
    setInlineCVForm: (form: Partial<TalentCVCreate> | ((prev: Partial<TalentCVCreate>) => Partial<TalentCVCreate>)) => void;
    cvFormErrors: Record<string, string>;
    setCvFormErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    cvVersionError: string;
    setCvVersionError: (error: string) => void;
    
    // File states
    selectedCVFile: File | null;
    setSelectedCVFile: (file: File | null) => void;
    uploadingCV: boolean;
    cvUploadProgress: number;
    setCvUploadProgress: (progress: number) => void;
    isCVUploadedFromFirebase: boolean;
    setIsCVUploadedFromFirebase: (value: boolean) => void;
    uploadedCVUrl: string | null;
    setUploadedCVUrl: (url: string | null) => void;
    cvPreviewUrl: string | null;
    setCvPreviewUrl: (url: string | null) => void;

    // Analysis states
    extractingCV: boolean;
    inlineCVAnalysisResult: CVAnalysisComparisonResponse | null;
    setInlineCVAnalysisResult: (result: CVAnalysisComparisonResponse | null) => void;
    showInlineCVAnalysisModal: boolean;
    setShowInlineCVAnalysisModal: (show: boolean) => void;
    showCVFullForm: boolean;
    
    // Validation
    existingCVsForValidation: TalentCV[];

    // Success overlay states
    showDeleteCVSuccessOverlay: boolean;
    showCreateCVSuccessOverlay: boolean;

    // Data
    lookupJobRoleLevels: JobRoleLevel[];
    
    // Handlers
    handleCVFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAnalyzeCV: () => void;
    handleDeleteCVFile: () => void;
    handleCVFileUpload: () => void;
    handleSubmitInlineCV: () => void;
    handleConfirmInlineCVAnalysis: () => void;
    handleCancelInlineCVAnalysis: () => void;
    validateCVVersion: (version: number, jobRoleLevelId: number) => string;
    isValueDifferent: (current: string | null | undefined, suggested: string | null | undefined) => boolean;
  };
  jobRoles?: JobRole[];
}

/**
 * Component section hiển thị và quản lý CV trong Talent Detail page
 */
export function TalentDetailCVsSection({
  talentCVs,
  selectedCVs,
  pageCVs,
  setPageCVs,
  itemsPerPage,
  showInlineForm,
  isSubmitting,
  onOpenForm,
  onDelete,
  analysisResult,
  analysisResultCVId,
  analysisLoadingId,
  analysisError,
  onAnalyzeCV,
  onCancelAnalysis,
  setAnalysisResult,
  setAnalysisResultCVId,
  canEdit,
  collapsedInactiveCVGroups,
  setCollapsedInactiveCVGroups,
  onRefreshCVs,
  cvForm,
  expandedAnalysisDetail,
  setExpandedAnalysisDetail,
  expandedBasicInfo = true,
  setExpandedBasicInfo,
  matchedSkillsNotInProfile = [],
  unmatchedSkillSuggestions = [],
  jobRoleLevelsMatched: _jobRoleLevelsMatched = [],
  matchedJobRoleLevelsNotInProfile = [],
  jobRoleLevelsUnmatched = [],
  onQuickCreateSkill,
  getLevelLabel,
  getTalentLevelName: _getTalentLevelName,
  isValueDifferent,
  jobRoles,
  activeCVTab = 'list',
  setActiveCVTab,
}: TalentDetailCVsSectionProps) {
  const [isCVsExpanded] = useState(true);
  const [isEditCVModalOpen, setIsEditCVModalOpen] = useState(false);
  const [editingCVId, setEditingCVId] = useState<number | null>(null);
  const [isCVFormInFullMode, setIsCVFormInFullMode] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Wrapper function to show loading overlay when analyzing CV
  const handleAnalyzeCV = async (cv: TalentCV & { jobRoleLevelName?: string }) => {
    // Don't show loading overlay here - let the hook handle it after dialog confirm
    await onAnalyzeCV(cv);
  };


  const openEditCVModal = (cvId: number) => {
    setEditingCVId(cvId);
    setIsEditCVModalOpen(true);
  };

  // Group CVs by jobRoleLevelName
  const groupedCVs = new Map<string, (TalentCV & { jobRoleLevelName?: string })[]>();
  talentCVs.forEach((cv) => {
    const key = cv.jobRoleLevelName || 'Chưa xác định';
    if (!groupedCVs.has(key)) {
      groupedCVs.set(key, []);
    }
    groupedCVs.get(key)!.push(cv);
  });

  const sortedGroups = Array.from(groupedCVs.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Get CVs for current page
  const startIndex = (pageCVs - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  let currentIndex = 0;
  const rows: React.ReactNode[] = [];

  sortedGroups.forEach(([jobRoleLevelName, cvs]) => {
    // Sort CVs: active first (version desc), inactive after (version desc)
    const sortedCVs = [...cvs].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return b.version - a.version;
    });

    const activeCVs = sortedCVs.filter((cv) => cv.isActive);
    const inactiveCVs = sortedCVs.filter((cv) => !cv.isActive);
    const isCollapsed = collapsedInactiveCVGroups.has(jobRoleLevelName);

    // Display active CVs
    activeCVs.forEach((cv, index) => {
      if (currentIndex >= startIndex && currentIndex < endIndex) {
        const isLoading = analysisLoadingId === cv.id;
        const isCurrentAnalysis = analysisResultCVId === cv.id && !!analysisResult;
        const hasOtherAnalysis = !!analysisResult && analysisResultCVId !== null && analysisResultCVId !== cv.id;
        const canAnalyze = !hasOtherAnalysis;

        const analysisControls = isLoading ? null : isCurrentAnalysis ? (
          // Có kết quả phân tích - hiển thị nút Hủy để xóa kết quả
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCancelAnalysis();
            }}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-neutral-500 to-neutral-600 hover:from-neutral-600 hover:to-neutral-700 text-white text-xs"
          >
            <Workflow className="w-3 h-3" />
            Hủy
          </Button>
        ) : null;

        // Collapse button for newest version if there are old versions
        const isNewestVersion = index === 0 && inactiveCVs.length > 0;
        const collapseButton = isNewestVersion ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsedInactiveCVGroups((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(jobRoleLevelName)) {
                  newSet.delete(jobRoleLevelName);
                } else {
                  newSet.add(jobRoleLevelName);
                }
                return newSet;
              });
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors duration-200"
            title={isCollapsed ? `Hiển thị ${inactiveCVs.length} phiên bản cũ` : `Ẩn ${inactiveCVs.length} phiên bản cũ`}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <span className="text-xs">({inactiveCVs.length})</span>
          </button>
        ) : null;

        rows.push(
          <tr
            key={cv.id}
            className="hover:bg-accent-50 transition-colors duration-200 cursor-pointer"
            onClick={() => openEditCVModal(cv.id)}
          >
            {/* Checkbox đã bị ẩn */}
            {/* <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedCVs.includes(cv.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  if (e.target.checked) {
                    setSelectedCVs([...selectedCVs, cv.id]);
                  } else {
                    setSelectedCVs(selectedCVs.filter((id) => id !== cv.id));
                  }
                }}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
            </td> */}
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm font-medium text-accent-800">{cv.jobRoleLevelName || 'Chưa xác định'}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm text-accent-700">v{cv.version}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Đang hoạt động</span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                {analysisControls}
                {collapseButton}
                {/* Dropdown Menu */}
                <div className="relative dropdown-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === cv.id ? null : cv.id);
                    }}
                    className="group flex items-center gap-1.5 px-2 py-1.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg transition-all duration-300"
                    title="Tùy chọn"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openDropdownId === cv.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10 dropdown-menu">
                      <div className="py-1">

                        {/* Phân tích - chỉ hiển thị khi chưa phân tích và form CV không ở giai đoạn đầy đủ */}
                        {!isCVFormInFullMode && (
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleAnalyzeCV(cv);
                            }}
                            disabled={!canAnalyze || !canEdit}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              !canAnalyze || !canEdit
                                ? 'text-neutral-400 cursor-not-allowed'
                                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                            title={
                              !canEdit
                                ? 'Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.'
                                : !canAnalyze
                                ? 'Vui lòng hủy phân tích CV đang hiển thị trước khi phân tích CV khác'
                                : 'Phân tích CV để xem kỹ năng, kinh nghiệm và chứng chỉ'
                            }
                          >
                            <Workflow className="w-4 h-4" />
                            Phân tích
                          </button>
                        )}

                        {/* Hủy phân tích - chỉ hiển thị khi có kết quả phân tích */}
                        {analysisResult && analysisResultCVId === cv.id && (
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              onCancelAnalysis();
                            }}
                            disabled={!canEdit || isCVFormInFullMode}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              !canEdit || isCVFormInFullMode
                                ? 'text-neutral-400 cursor-not-allowed'
                                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                            title={
                              !canEdit
                                ? 'Bạn không có quyền hủy phân tích CV. Chỉ TA đang quản lý nhân sự này mới được hủy phân tích.'
                                : isCVFormInFullMode
                                ? 'Không thể hủy phân tích khi form CV đang ở giai đoạn đầy đủ. Hãy hoàn thành hoặc hủy form CV trước.'
                                : ''
                            }
                          >
                            <X className="w-4 h-4" />
                            Hủy phân tích
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        );
      }
      currentIndex++;
    });

    // Display inactive CVs if not collapsed
    if (inactiveCVs.length > 0) {
      if (!isCollapsed) {
        inactiveCVs.forEach((cv) => {
          if (currentIndex >= startIndex && currentIndex < endIndex) {
            rows.push(
              <tr
                key={cv.id}
                className="hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-neutral-50/50"
                onClick={() => openEditCVModal(cv.id)}
              >
                {/* Checkbox đã bị ẩn */}
                {/* <td className="px-4 py-3 whitespace-nowrap pl-8" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedCVs.includes(cv.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedCVs([...selectedCVs, cv.id]);
                      } else {
                        setSelectedCVs(selectedCVs.filter((id) => id !== cv.id));
                      }
                    }}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </td> */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-neutral-600">{cv.jobRoleLevelName || 'Chưa xác định'}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-neutral-500">v{cv.version}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Không hoạt động</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {/* Dropdown Menu cho CV không hoạt động */}
                  <div className="relative dropdown-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === cv.id ? null : cv.id);
                      }}
                      className="group flex items-center gap-1.5 px-2 py-1.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg transition-all duration-300"
                      title="Tùy chọn"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openDropdownId === cv.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10 dropdown-menu">
                        <div className="py-1">
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          }
          currentIndex++;
        });
      } else {
        // If collapsed, still count for pagination
        currentIndex += inactiveCVs.length;
      }
    }
  });

  return (
    <div className="space-y-6">
      <TalentCVEditModal
        isOpen={isEditCVModalOpen}
        cvId={editingCVId}
        canEdit={canEdit}
        onClose={() => {
          setIsEditCVModalOpen(false);
          setEditingCVId(null);
        }}
        onSaved={onRefreshCVs}
      />
      {/* CV Analysis Error */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-semibold">Lỗi phân tích CV</p>
          <p className="text-sm mt-1">{analysisError}</p>
        </div>
      )}

      {/* Tab Headers */}
      <div className="bg-white rounded-xl shadow-soft border border-neutral-100">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveCVTab?.('list')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                activeCVTab === 'list'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              CV của nhân sự
            </button>
            {analysisResult && (
              <button
                type="button"
                onClick={() => setActiveCVTab?.('analysis')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeCVTab === 'analysis'
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Workflow className="w-4 h-4" />
                Kết quả phân tích CV
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab: CV List */}
          {activeCVTab === 'list' && (
            <div className="space-y-6">
              {/* CV List Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-100 rounded-lg">
                      <FileText className="w-5 h-5 text-accent-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">CV của nhân sự</h2>
                  </div>
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
                              : 'Thêm CV'
                        }
                      >
                        <Upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </Button>
                    )}
                    {/* Nút xóa CV đã bị vô hiệu hóa */}
                    {false && selectedCVs.length > 0 && (
                      <Button
                        onClick={onDelete}
                        disabled={!canEdit}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                          !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        Xóa CV ({selectedCVs.length})
                      </Button>
                    )}
                  </div>
                </div>
                {isCVsExpanded && (
                  <div>
                    {/* Inline CV Form */}
                    {showInlineForm && cvForm && (
                      <TalentDetailCVForm
                        inlineCVForm={cvForm.inlineCVForm}
                        setInlineCVForm={cvForm.setInlineCVForm}
                        cvFormErrors={cvForm.cvFormErrors}
                        setCvFormErrors={cvForm.setCvFormErrors}
                        cvVersionError={cvForm.cvVersionError}
                        setCvVersionError={cvForm.setCvVersionError}
                        selectedCVFile={cvForm.selectedCVFile}
                        setSelectedCVFile={cvForm.setSelectedCVFile}
                        uploadingCV={cvForm.uploadingCV}
                        cvUploadProgress={cvForm.cvUploadProgress}
                        setCvUploadProgress={cvForm.setCvUploadProgress}
                        isCVUploadedFromFirebase={cvForm.isCVUploadedFromFirebase}
                        setIsCVUploadedFromFirebase={cvForm.setIsCVUploadedFromFirebase}
                        uploadedCVUrl={cvForm.uploadedCVUrl}
                        setUploadedCVUrl={cvForm.setUploadedCVUrl}
                        cvPreviewUrl={cvForm.cvPreviewUrl}
                        setCvPreviewUrl={cvForm.setCvPreviewUrl}
                        extractingCV={cvForm.extractingCV}
                        inlineCVAnalysisResult={cvForm.inlineCVAnalysisResult}
                        setInlineCVAnalysisResult={cvForm.setInlineCVAnalysisResult}
                        showInlineCVAnalysisModal={cvForm.showInlineCVAnalysisModal}
                        setShowInlineCVAnalysisModal={cvForm.setShowInlineCVAnalysisModal}
                        showCVFullForm={cvForm.showCVFullForm}
                        existingCVsForValidation={cvForm.existingCVsForValidation}
                        allTalentCVs={talentCVs}
                        lookupJobRoleLevels={cvForm.lookupJobRoleLevels}
                        jobRoles={jobRoles}
                        isSubmitting={isSubmitting}
                        canEdit={canEdit}
                        handleCVFileSelect={cvForm.handleCVFileSelect}
                        handleAnalyzeCV={cvForm.handleAnalyzeCV}
                        handleSubmitInlineCV={cvForm.handleSubmitInlineCV}
                        handleConfirmInlineCVAnalysis={cvForm.handleConfirmInlineCVAnalysis}
                        handleCancelInlineCVAnalysis={cvForm.handleCancelInlineCVAnalysis}
                        validateCVVersion={cvForm.validateCVVersion}
                        isValueDifferent={cvForm.isValueDifferent}
                        setAnalysisResult={setAnalysisResult}
                        setAnalysisResultCVId={setAnalysisResultCVId}
                        onShowCVFullFormChange={setIsCVFormInFullMode}
                      />
                    )}

                    {/* CV List */}
                    {talentCVs.length > 0 ? (
                      <>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Danh sách CV</h3>
                          <p className="text-sm text-neutral-600 mt-1">Quản lý các phiên bản CV của nhân sự</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-neutral-50 border-b border-neutral-200">
                                {/* Checkbox column đã bị ẩn */}
                                {/* <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selectedCVs.length ===
                                        talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).length &&
                                      talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).length > 0
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const currentPageItems = talentCVs
                                          .slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage)
                                          .map((cv) => cv.id);
                                        setSelectedCVs([...new Set([...selectedCVs, ...currentPageItems])]);
                                      } else {
                                        const currentPageItems = talentCVs
                                          .slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage)
                                          .map((cv) => cv.id);
                                        setSelectedCVs(selectedCVs.filter((id) => !currentPageItems.includes(id)));
                                      }
                                    }}
                                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                  />
                                </th> */}
                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Phiên bản</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">{rows}</tbody>
                          </table>
                        </div>
                        <SectionPagination
                          currentPage={pageCVs}
                          totalItems={talentCVs.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setPageCVs}
                        />
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Chưa có CV nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa upload CV</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Analysis Result */}
          {activeCVTab === 'analysis' && analysisResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Workflow className="w-4 h-4 text-primary-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Kết quả phân tích CV</h2>
                  </div>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
                  <div 
                    className={`p-2.5 rounded-lg border border-primary-100 bg-primary-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-primary-300 ${expandedBasicInfo ? "ring-1 ring-primary-400" : ""}`}
                    onClick={() => setExpandedBasicInfo?.(!expandedBasicInfo)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-primary-600 font-semibold">Thông tin cơ bản</p>
                      <ChevronDown className={`w-3 h-3 text-primary-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-primary-900">{analysisResult.basicInfo.hasChanges ? "Có thay đổi" : "Không"}</p>
                  </div>
                  <div 
                    className={`p-2.5 rounded-lg border border-amber-100 bg-amber-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-amber-300 ${expandedAnalysisDetail === "skills" ? "ring-1 ring-amber-400" : ""}`}
                    onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "skills" ? null : "skills")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold">Kỹ năng</p>
                      <ChevronDown className={`w-3 h-3 text-amber-600 transition-transform ${expandedAnalysisDetail === "skills" ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-amber-900">
                      {matchedSkillsNotInProfile.length + unmatchedSkillSuggestions.length}
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      {matchedSkillsNotInProfile.length} mới · {unmatchedSkillSuggestions.length} chưa có
                    </p>
                  </div>
                  <div 
                    className={`p-2.5 rounded-lg border border-green-100 bg-green-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-green-300 ${expandedAnalysisDetail === "jobRoleLevels" ? "ring-1 ring-green-400" : ""}`}
                    onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "jobRoleLevels" ? null : "jobRoleLevels")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-green-600 font-semibold">Vị trí</p>
                      <ChevronDown className={`w-3 h-3 text-green-600 transition-transform ${expandedAnalysisDetail === "jobRoleLevels" ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-green-900">
                      {matchedJobRoleLevelsNotInProfile.length + jobRoleLevelsUnmatched.length}
                    </p>
                    <p className="text-[10px] text-green-700 mt-0.5">
                      {matchedJobRoleLevelsNotInProfile.length} mới · {jobRoleLevelsUnmatched.length} chưa có
                    </p>
                  </div>
                  <div 
                    className={`p-2.5 rounded-lg border border-purple-100 bg-purple-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-purple-300 ${expandedAnalysisDetail === "projects" ? "ring-1 ring-purple-400" : ""}`}
                    onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "projects" ? null : "projects")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-purple-600 font-semibold">Dự án</p>
                      <ChevronDown className={`w-3 h-3 text-purple-600 transition-transform ${expandedAnalysisDetail === "projects" ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-purple-900">{analysisResult.projects.newEntries.length}</p>
                  </div>
                  <div 
                    className={`p-2.5 rounded-lg border border-blue-100 bg-blue-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-blue-300 ${expandedAnalysisDetail === "experiences" ? "ring-1 ring-blue-400" : ""}`}
                    onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "experiences" ? null : "experiences")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-blue-600 font-semibold">Kinh nghiệm</p>
                      <ChevronDown className={`w-3 h-3 text-blue-600 transition-transform ${expandedAnalysisDetail === "experiences" ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-blue-900">{analysisResult.workExperiences.newEntries.length}</p>
                  </div>
                  <div 
                    className={`p-2.5 rounded-lg border border-rose-100 bg-rose-50/70 cursor-pointer transition-all hover:shadow-sm hover:border-rose-300 ${expandedAnalysisDetail === "certificates" ? "ring-1 ring-rose-400" : ""}`}
                    onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "certificates" ? null : "certificates")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide text-rose-600 font-semibold">Chứng chỉ</p>
                      <ChevronDown className={`w-3 h-3 text-rose-600 transition-transform ${expandedAnalysisDetail === "certificates" ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm font-bold text-rose-900">
                      {analysisResult.certificates?.newFromCV?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Chi tiết phân tích - Skills */}
                {expandedAnalysisDetail === "skills" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-amber-900">Kỹ năng</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {matchedSkillsNotInProfile.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-amber-800 mb-1">Cần tạo mới ({matchedSkillsNotInProfile.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedSkillsNotInProfile.map((skill, index) => (
                          <div key={`skill-matched-notin-${index}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-200 rounded text-[11px] text-amber-900">
                            <span>{skill.skillName}</span>
                            {onQuickCreateSkill && (
                              <button
                                onClick={() => onQuickCreateSkill({
                                  skillId: skill.skillId,
                                  skillName: skill.skillName,
                                  cvLevel: skill.cvLevel,
                                  cvYearsExp: skill.cvYearsExp ?? undefined,
                                })}
                                className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-[10px] font-medium"
                              >
                                Gợi ý
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {unmatchedSkillSuggestions.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-amber-800 mb-1">Chưa có trong hệ thống ({unmatchedSkillSuggestions.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {unmatchedSkillSuggestions.map((skill, index) => (
                          <span key={`skill-unmatched-${index}`} className="inline-flex items-center px-2 py-0.5 bg-white border border-amber-200 rounded text-[11px] text-amber-900">
                            {skill.skillName}
                            {skill.level && getLevelLabel && <span className="ml-1 text-amber-600">· {getLevelLabel(skill.level)}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedSkillsNotInProfile.length === 0 && unmatchedSkillSuggestions.length === 0 && (
                    <p className="text-[11px] text-amber-700">Không có gợi ý kỹ năng nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - JobRoleLevels */}
            {expandedAnalysisDetail === "jobRoleLevels" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-green-900">Vị trí</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {matchedJobRoleLevelsNotInProfile.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-green-800 mb-1">Cần tạo mới ({matchedJobRoleLevelsNotInProfile.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedJobRoleLevelsNotInProfile.map((jobRole, index) => (
                          <span key={`jobrole-matched-notin-${index}`} className="inline-flex items-center px-2 py-0.5 bg-white border border-green-200 rounded text-[11px] text-green-900">
                            {jobRole.position}
                            {jobRole.level && <span className="ml-1 text-green-600">· L{jobRole.level}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobRoleLevelsUnmatched.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-green-800 mb-1">Chưa có trong hệ thống ({jobRoleLevelsUnmatched.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {jobRoleLevelsUnmatched.map((suggestion, index) => (
                          <span key={`jobrole-unmatched-${index}`} className="inline-flex items-center px-2 py-0.5 bg-white border border-green-200 rounded text-[11px] text-green-900">
                            {suggestion.position ?? "Vị trí chưa rõ"}
                            {suggestion.level && <span className="ml-1 text-green-600">· L{suggestion.level}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedJobRoleLevelsNotInProfile.length === 0 && jobRoleLevelsUnmatched.length === 0 && (
                    <p className="text-[11px] text-green-700">Không có gợi ý vị trí nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - Certificates */}
            {expandedAnalysisDetail === "certificates" && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-rose-900">Chứng chỉ</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {analysisResult.certificates?.newFromCV && analysisResult.certificates.newFromCV.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold text-rose-800 mb-1">Cần tạo loại chứng chỉ ({analysisResult.certificates.newFromCV.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.certificates.newFromCV.map((cert, index) => (
                          <span key={`cert-all-${index}`} className="inline-flex items-center px-2 py-0.5 bg-white border border-rose-200 rounded text-[11px] text-rose-900">
                            {cert.certificateName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-700">Không có gợi ý chứng chỉ nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - Projects */}
            {expandedAnalysisDetail === "projects" && analysisResult.projects && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-purple-900">Chi tiết Dự án</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {analysisResult.projects.newEntries.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-purple-900 mb-1.5">Dự án mới ({analysisResult.projects.newEntries.length})</h4>
                    <div className="space-y-1.5">
                      {analysisResult.projects.newEntries.map((project, index) => (
                        <div key={`project-new-${index}`} className="bg-white p-2 rounded border border-purple-200">
                          <p className="font-medium text-[12px] text-purple-900">{project.projectName}</p>
                          {project.position && <p className="text-[11px] text-purple-700 mt-0.5">Vị trí: {project.position}</p>}
                          {project.technologies && <p className="text-[11px] text-purple-700">Công nghệ: {project.technologies}</p>}
                          {project.description && <p className="text-[11px] text-purple-600 mt-0.5 line-clamp-2">{project.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.projects.potentialDuplicates && analysisResult.projects.potentialDuplicates.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-purple-900 mb-1.5">Có thể trùng ({analysisResult.projects.potentialDuplicates.length})</h4>
                    <div className="space-y-2">
                      {analysisResult.projects.potentialDuplicates.map((dup, index) => (
                        <div key={`project-dup-${index}`} className="bg-white p-2 rounded border border-purple-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-700">
                            <div>
                              <p className="font-medium text-neutral-900 mb-1">Hiện tại</p>
                              <ul className="space-y-0.5">
                                <li>Tên: {dup.existing.projectName ?? "—"}</li>
                                <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                <li>Công nghệ: {dup.existing.technologies ?? "—"}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 mb-1">Từ CV</p>
                              <ul className="space-y-0.5">
                                <li>Tên: {dup.fromCV.projectName ?? "—"}</li>
                                <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                <li>Công nghệ: {dup.fromCV.technologies ?? "—"}</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-purple-200">
                            <p className="text-[10px] text-purple-700">
                              <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.projects.newEntries.length === 0 && (!analysisResult.projects.potentialDuplicates || analysisResult.projects.potentialDuplicates.length === 0) && (
                  <p className="text-[11px] text-purple-700">Không có gợi ý dự án nào</p>
                )}
              </div>
            )}

            {/* Chi tiết phân tích - Experiences */}
            {expandedAnalysisDetail === "experiences" && analysisResult.workExperiences && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-blue-900">Chi tiết Kinh nghiệm</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {analysisResult.workExperiences.newEntries.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-blue-900 mb-1.5">Kinh nghiệm mới ({analysisResult.workExperiences.newEntries.length})</h4>
                    <div className="space-y-1.5">
                      {analysisResult.workExperiences.newEntries.map((exp, index) => (
                        <div key={`exp-new-${index}`} className="bg-white p-2 rounded border border-blue-200">
                          <p className="font-medium text-[12px] text-blue-900">{exp.position}</p>
                          <p className="text-[11px] text-blue-700 mt-0.5">Công ty: {exp.company}</p>
                          <p className="text-[11px] text-blue-700">{exp.startDate ?? "—"} - {exp.endDate ?? "Hiện tại"}</p>
                          {exp.description && <p className="text-[11px] text-blue-600 mt-0.5 line-clamp-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.workExperiences.potentialDuplicates && analysisResult.workExperiences.potentialDuplicates.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-blue-900 mb-1.5">Có thể trùng ({analysisResult.workExperiences.potentialDuplicates.length})</h4>
                    <div className="space-y-2">
                      {analysisResult.workExperiences.potentialDuplicates.map((dup, index) => (
                        <div key={`exp-dup-${index}`} className="bg-white p-2 rounded border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-700">
                            <div>
                              <p className="font-medium text-neutral-900 mb-1">Hiện tại</p>
                              <ul className="space-y-0.5">
                                <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                <li>Công ty: {dup.existing.company ?? "—"}</li>
                                <li>Thời gian: {dup.existing.startDate ? new Date(dup.existing.startDate).toLocaleDateString("vi-VN") : "—"} - {dup.existing.endDate ? new Date(dup.existing.endDate).toLocaleDateString("vi-VN") : "Hiện tại"}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 mb-1">Từ CV</p>
                              <ul className="space-y-0.5">
                                <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                <li>Công ty: {dup.fromCV.company ?? "—"}</li>
                                <li>Thời gian: {dup.fromCV.startDate ?? "—"} - {dup.fromCV.endDate ?? "Hiện tại"}</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-blue-200">
                            <p className="text-[10px] text-blue-700">
                              <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.workExperiences.newEntries.length === 0 && (!analysisResult.workExperiences.potentialDuplicates || analysisResult.workExperiences.potentialDuplicates.length === 0) && (
                  <p className="text-[11px] text-blue-700">Không có gợi ý kinh nghiệm nào</p>
                )}
              </div>
            )}

            {/* So sánh thông tin cơ bản */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200">
              <div 
                className="p-3 cursor-pointer flex items-center justify-between hover:bg-neutral-100 transition-colors rounded-lg"
                onClick={() => setExpandedBasicInfo?.(!expandedBasicInfo)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">So sánh thông tin cơ bản</h3>
                  <p className="text-xs text-neutral-600">
                    <span className="font-medium">Thay đổi:</span> {analysisResult.basicInfo.hasChanges ? "Có" : "Không"}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
              </div>
              {expandedBasicInfo && isValueDifferent && (
                <div className="px-3 pb-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-900 mb-1.5 text-xs">Hiện tại</p>
                      <ul className="space-y-1 bg-white p-2 rounded border border-neutral-200">
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Họ tên:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.fullName ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Email:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.email ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Điện thoại:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.phone ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Nơi ở:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.locationName ?? "—"}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-1.5 text-xs">Gợi ý</p>
                      <ul className="space-y-1 bg-blue-50 p-2 rounded border border-blue-200">
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Họ tên:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.fullName ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Email:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.email ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Điện thoại:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.phone ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between py-0.5 ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 px-1.5 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500 text-xs">Nơi ở:</span>
                          <span className={`font-medium text-xs ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.locationName ?? "—"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
              </div>
            )}
        </div>
      </div>

      {/* Delete CV Success Overlay */}
      {cvForm?.showDeleteCVSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã xóa file CV thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Create CV Success Overlay */}
      {cvForm?.showCreateCVSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã tạo CV thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

