import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Workflow,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { TalentDetailCVForm } from './TalentDetailCVForm';
import { type TalentCV } from '../../../services/TalentCV';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';

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
  onCancelAnalysis: () => void;
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
    uploadingCV: boolean;
    cvUploadProgress: number;
    isCVUploadedFromFirebase: boolean;
    setIsCVUploadedFromFirebase: (value: boolean) => void;
    uploadedCVUrl: string | null;
    setUploadedCVUrl: (url: string | null) => void;
    cvPreviewUrl: string | null;
    
    // Analysis states
    extractingCV: boolean;
    inlineCVAnalysisResult: CVAnalysisComparisonResponse | null;
    showInlineCVAnalysisModal: boolean;
    showCVFullForm: boolean;
    
    // Validation
    existingCVsForValidation: TalentCV[];
    
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
}

/**
 * Component section hiển thị và quản lý CV trong Talent Detail page
 */
export function TalentDetailCVsSection({
  talentCVs,
  selectedCVs,
  setSelectedCVs,
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
  canEdit,
  collapsedInactiveCVGroups,
  setCollapsedInactiveCVGroups,
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
}: TalentDetailCVsSectionProps) {
  const navigate = useNavigate();
  const [isCVsExpanded, setIsCVsExpanded] = useState(true);

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

        const analysisControls = isCurrentAnalysis ? (
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
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzeCV(cv);
            }}
            disabled={isLoading || !canAnalyze || !canEdit}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 text-xs ${
              isLoading || !canAnalyze || !canEdit
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
            title={
              !canEdit
                ? 'Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.'
                : !canAnalyze
                  ? 'Vui lòng hủy phân tích CV đang hiển thị trước khi phân tích CV khác'
                  : ''
            }
          >
            <Workflow className="w-3 h-3" />
            {isLoading ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        );

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
            onClick={() => navigate(`/ta/talent-cvs/edit/${cv.id}`)}
          >
            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
            </td>
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
                <a
                  href={cv.cvFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Xem PDF
                </a>
                {analysisControls}
                {collapseButton}
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
                onClick={() => navigate(`/ta/talent-cvs/edit/${cv.id}`)}
              >
                <td className="px-4 py-3 whitespace-nowrap pl-8" onClick={(e) => e.stopPropagation()}>
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
                </td>
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
                  <div className="flex items-center gap-2">
                    <a
                      href={cv.cvFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Xem PDF
                    </a>
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
      {/* CV Analysis Error */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-semibold">Lỗi phân tích CV</p>
          <p className="text-sm mt-1">{analysisError}</p>
        </div>
      )}

      {/* CV Analysis Result - TODO: Tạo component riêng cho CV Analysis Result */}
      {analysisResult && (
        <div className="bg-white rounded-2xl shadow-soft border border-primary-100 animate-fade-in">
          <div className="p-6 border-b border-primary-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Workflow className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Kết quả phân tích CV</h2>
            </div>
            <Button
              onClick={onCancelAnalysis}
              disabled={!canEdit}
              className={`px-4 py-2 rounded-xl bg-neutral-600 text-white hover:bg-neutral-700 transition-all duration-300 ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền hủy phân tích CV. Chỉ TA đang quản lý nhân sự này mới được hủy phân tích.' : ''}
            >
              Hủy phân tích
            </Button>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-neutral-600">
              Hệ thống đã so sánh CV mới với dữ liệu hiện có của nhân sự. Các gợi ý chi tiết được hiển thị ngay trong từng phần bên dưới để bạn thao tác nhanh chóng.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div 
                className={`p-4 rounded-xl border border-primary-100 bg-primary-50/70 cursor-pointer transition-all hover:shadow-md hover:border-primary-300 ${expandedBasicInfo ? "ring-2 ring-primary-400" : ""}`}
                onClick={() => setExpandedBasicInfo?.(!expandedBasicInfo)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Thông tin cơ bản</p>
                  <ChevronDown className={`w-4 h-4 text-primary-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-primary-900">{analysisResult.basicInfo.hasChanges ? "Có thay đổi" : "Không thay đổi"}</p>
                <p className="mt-2 text-xs text-primary-700 cursor-pointer hover:text-primary-900 underline">Xem chi tiết</p>
              </div>
              <div 
                className={`p-4 rounded-xl border border-amber-100 bg-amber-50/70 cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${expandedAnalysisDetail === "skills" ? "ring-2 ring-amber-400" : ""}`}
                onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "skills" ? null : "skills")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">Kỹ năng</p>
                  <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform ${expandedAnalysisDetail === "skills" ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-amber-900">
                  {matchedSkillsNotInProfile.length + unmatchedSkillSuggestions.length}
                </p>
                <p className="mt-2 text-xs text-amber-700 cursor-pointer hover:text-amber-900">
                  {matchedSkillsNotInProfile.length} cần tạo mới · {unmatchedSkillSuggestions.length} chưa có trong hệ thống
                  <span className="ml-2 text-amber-600 underline">(Nhấp để xem chi tiết)</span>
                </p>
              </div>
              <div 
                className={`p-4 rounded-xl border border-green-100 bg-green-50/70 cursor-pointer transition-all hover:shadow-md hover:border-green-300 ${expandedAnalysisDetail === "jobRoleLevels" ? "ring-2 ring-green-400" : ""}`}
                onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "jobRoleLevels" ? null : "jobRoleLevels")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">Vị trí</p>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${expandedAnalysisDetail === "jobRoleLevels" ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-green-900">
                  {matchedJobRoleLevelsNotInProfile.length + jobRoleLevelsUnmatched.length}
                </p>
                <p className="mt-2 text-xs text-green-700 cursor-pointer hover:text-green-900">
                  {matchedJobRoleLevelsNotInProfile.length} cần tạo mới · {jobRoleLevelsUnmatched.length} chưa có trong hệ thống
                  <span className="ml-2 text-green-600 underline">(Nhấp để xem chi tiết)</span>
                </p>
              </div>
              <div 
                className={`p-4 rounded-xl border border-purple-100 bg-purple-50/70 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 ${expandedAnalysisDetail === "projects" ? "ring-2 ring-purple-400" : ""}`}
                onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "projects" ? null : "projects")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold">Dự án</p>
                  <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${expandedAnalysisDetail === "projects" ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-purple-900">{analysisResult.projects.newEntries.length}</p>
                <p className="mt-2 text-xs text-purple-700 cursor-pointer hover:text-purple-900">
                  Dự án mới cần xem xét
                  <span className="ml-2 text-purple-600 underline">(Nhấp để xem chi tiết)</span>
                </p>
              </div>
              <div 
                className={`p-4 rounded-xl border border-blue-100 bg-blue-50/70 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${expandedAnalysisDetail === "experiences" ? "ring-2 ring-blue-400" : ""}`}
                onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "experiences" ? null : "experiences")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Kinh nghiệm</p>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${expandedAnalysisDetail === "experiences" ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-blue-900">{analysisResult.workExperiences.newEntries.length}</p>
                <p className="mt-2 text-xs text-blue-700 cursor-pointer hover:text-blue-900">
                  Kinh nghiệm làm việc mới phát hiện
                  <span className="ml-2 text-blue-600 underline">(Nhấp để xem chi tiết)</span>
                </p>
              </div>
              <div 
                className={`p-4 rounded-xl border border-rose-100 bg-rose-50/70 cursor-pointer transition-all hover:shadow-md hover:border-rose-300 ${expandedAnalysisDetail === "certificates" ? "ring-2 ring-rose-400" : ""}`}
                onClick={() => setExpandedAnalysisDetail?.(expandedAnalysisDetail === "certificates" ? null : "certificates")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">Chứng chỉ</p>
                  <ChevronDown className={`w-4 h-4 text-rose-600 transition-transform ${expandedAnalysisDetail === "certificates" ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-1 text-lg font-bold text-rose-900">
                  {analysisResult.certificates?.newFromCV?.length || 0}
                </p>
                <p className="mt-2 text-xs text-rose-700 cursor-pointer hover:text-rose-900">
                  Cần tạo loại chứng chỉ theo tên các chứng chỉ
                  <span className="ml-2 text-rose-600 underline">(Nhấp để xem chi tiết)</span>
                </p>
              </div>
            </div>

            {/* Chi tiết phân tích - Skills */}
            {expandedAnalysisDetail === "skills" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-amber-900">Kỹ năng</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {matchedSkillsNotInProfile.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-1.5">Cần tạo mới từ cv có ({matchedSkillsNotInProfile.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkillsNotInProfile.map((skill, index) => (
                          <div key={`skill-matched-notin-${index}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                            <span>{skill.skillName}</span>
                            {onQuickCreateSkill && (
                              <button
                                onClick={() => onQuickCreateSkill({
                                  skillId: skill.skillId,
                                  skillName: skill.skillName,
                                  cvLevel: skill.cvLevel,
                                  cvYearsExp: skill.cvYearsExp ?? undefined,
                                })}
                                className="px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-medium"
                              >
                                Tạo nhanh
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {unmatchedSkillSuggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-1.5">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({unmatchedSkillSuggestions.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {unmatchedSkillSuggestions.map((skill, index) => (
                          <span key={`skill-unmatched-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                            {skill.skillName}
                            {skill.level && getLevelLabel && <span className="ml-1.5 text-amber-600">· {getLevelLabel(skill.level)}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedSkillsNotInProfile.length === 0 && unmatchedSkillSuggestions.length === 0 && (
                    <p className="text-xs text-amber-700">Không có gợi ý kỹ năng nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - JobRoleLevels */}
            {expandedAnalysisDetail === "jobRoleLevels" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-green-900">Vị trí</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {matchedJobRoleLevelsNotInProfile.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-800 mb-1.5">Cần tạo mới từ cv có ({matchedJobRoleLevelsNotInProfile.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedJobRoleLevelsNotInProfile.map((jobRole, index) => (
                          <span key={`jobrole-matched-notin-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                            {jobRole.position}
                            {jobRole.level && <span className="ml-1.5 text-green-600">· Level {jobRole.level}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobRoleLevelsUnmatched.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-800 mb-1.5">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({jobRoleLevelsUnmatched.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobRoleLevelsUnmatched.map((suggestion, index) => (
                          <span key={`jobrole-unmatched-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                            {suggestion.position ?? "Vị trí chưa rõ"}
                            {suggestion.level && <span className="ml-1.5 text-green-600">· Level {suggestion.level}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedJobRoleLevelsNotInProfile.length === 0 && jobRoleLevelsUnmatched.length === 0 && (
                    <p className="text-xs text-green-700">Không có gợi ý vị trí nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - Certificates */}
            {expandedAnalysisDetail === "certificates" && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-rose-900">Chứng chỉ</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {analysisResult.certificates?.newFromCV && analysisResult.certificates.newFromCV.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-rose-800 mb-1.5">Cần tạo loại chứng chỉ theo tên các chứng chỉ ({analysisResult.certificates.newFromCV.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.certificates.newFromCV.map((cert, index) => (
                          <span key={`cert-all-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-xs text-rose-900">
                            {cert.certificateName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-700">Không có gợi ý chứng chỉ nào</p>
                  )}
                </div>
              </div>
            )}

            {/* Chi tiết phân tích - Projects */}
            {expandedAnalysisDetail === "projects" && analysisResult.projects && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-purple-900">Chi tiết Dự án</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {analysisResult.projects.newEntries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">Dự án mới ({analysisResult.projects.newEntries.length})</h4>
                    <div className="space-y-2">
                      {analysisResult.projects.newEntries.map((project, index) => (
                        <div key={`project-new-${index}`} className="bg-white p-3 rounded-lg border border-purple-200">
                          <p className="font-medium text-purple-900">{project.projectName}</p>
                          {project.position && <p className="text-xs text-purple-700 mt-1">Vị trí: {project.position}</p>}
                          {project.technologies && <p className="text-xs text-purple-700">Công nghệ: {project.technologies}</p>}
                          {project.description && <p className="text-xs text-purple-600 mt-1 line-clamp-2">{project.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.projects.potentialDuplicates && analysisResult.projects.potentialDuplicates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-900 mb-3">Có thể trùng ({analysisResult.projects.potentialDuplicates.length})</h4>
                    <div className="space-y-4">
                      {analysisResult.projects.potentialDuplicates.map((dup, index) => (
                        <div key={`project-dup-${index}`} className="bg-white p-4 rounded-lg border border-purple-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                            <div>
                              <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                              <ul className="space-y-1">
                                <li>Tên dự án: {dup.existing.projectName ?? "—"}</li>
                                <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                <li>Công nghệ: {dup.existing.technologies ?? "—"}</li>
                                <li>Mô tả: {dup.existing.description ? (dup.existing.description.length > 100 ? `${dup.existing.description.substring(0, 100)}...` : dup.existing.description) : "—"}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 mb-2">Từ CV</p>
                              <ul className="space-y-1">
                                <li>Tên dự án: {dup.fromCV.projectName ?? "—"}</li>
                                <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                <li>Công nghệ: {dup.fromCV.technologies ?? "—"}</li>
                                <li>Mô tả: {dup.fromCV.description ? (dup.fromCV.description.length > 100 ? `${dup.fromCV.description.substring(0, 100)}...` : dup.fromCV.description) : "—"}</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <p className="text-xs text-purple-700">
                              <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                              {dup.differencesSummary && dup.differencesSummary.length > 0 && (
                                <span className="block mt-1 text-purple-600">
                                  Khác biệt: {dup.differencesSummary.join(", ")}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.projects.newEntries.length === 0 && (!analysisResult.projects.potentialDuplicates || analysisResult.projects.potentialDuplicates.length === 0) && (
                  <p className="text-sm text-purple-700">Không có gợi ý dự án nào</p>
                )}
              </div>
            )}

            {/* Chi tiết phân tích - Experiences */}
            {expandedAnalysisDetail === "experiences" && analysisResult.workExperiences && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-900">Chi tiết Kinh nghiệm</h3>
                  <button
                    onClick={() => setExpandedAnalysisDetail?.(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {analysisResult.workExperiences.newEntries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Kinh nghiệm mới ({analysisResult.workExperiences.newEntries.length})</h4>
                    <div className="space-y-2">
                      {analysisResult.workExperiences.newEntries.map((exp, index) => (
                        <div key={`exp-new-${index}`} className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="font-medium text-blue-900">{exp.position}</p>
                          <p className="text-xs text-blue-700 mt-1">Công ty: {exp.company}</p>
                          <p className="text-xs text-blue-700">{exp.startDate ?? "—"} - {exp.endDate ?? "Hiện tại"}</p>
                          {exp.description && <p className="text-xs text-blue-600 mt-1 line-clamp-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.workExperiences.potentialDuplicates && analysisResult.workExperiences.potentialDuplicates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Có thể trùng ({analysisResult.workExperiences.potentialDuplicates.length})</h4>
                    <div className="space-y-4">
                      {analysisResult.workExperiences.potentialDuplicates.map((dup, index) => (
                        <div key={`exp-dup-${index}`} className="bg-white p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                            <div>
                              <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                              <ul className="space-y-1">
                                <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                <li>Công ty: {dup.existing.company ?? "—"}</li>
                                <li>Thời gian: {dup.existing.startDate ? new Date(dup.existing.startDate).toLocaleDateString("vi-VN") : "—"} - {dup.existing.endDate ? new Date(dup.existing.endDate).toLocaleDateString("vi-VN") : "Hiện tại"}</li>
                                <li>Mô tả: {dup.existing.description ? (dup.existing.description.length > 100 ? `${dup.existing.description.substring(0, 100)}...` : dup.existing.description) : "—"}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 mb-2">Từ CV</p>
                              <ul className="space-y-1">
                                <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                <li>Công ty: {dup.fromCV.company ?? "—"}</li>
                                <li>Thời gian: {dup.fromCV.startDate ?? "—"} - {dup.fromCV.endDate ?? "Hiện tại"}</li>
                                <li>Mô tả: {dup.fromCV.description ? (dup.fromCV.description.length > 100 ? `${dup.fromCV.description.substring(0, 100)}...` : dup.fromCV.description) : "—"}</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                              {dup.differencesSummary && dup.differencesSummary.length > 0 && (
                                <span className="block mt-1 text-blue-600">
                                  Khác biệt: {dup.differencesSummary.join(", ")}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.workExperiences.newEntries.length === 0 && (!analysisResult.workExperiences.potentialDuplicates || analysisResult.workExperiences.potentialDuplicates.length === 0) && (
                  <p className="text-sm text-blue-700">Không có gợi ý kinh nghiệm nào</p>
                )}
              </div>
            )}

            {/* So sánh thông tin cơ bản */}
            <div className="bg-neutral-50 rounded-xl border border-neutral-200">
              <div 
                className="p-4 cursor-pointer flex items-center justify-between hover:bg-neutral-100 transition-colors rounded-xl"
                onClick={() => setExpandedBasicInfo?.(!expandedBasicInfo)}
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">So sánh thông tin cơ bản</h3>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium">Có thay đổi:</span> {analysisResult.basicInfo.hasChanges ? "Có" : "Không"}
                  </p>
                </div>
                <ChevronDown className={`w-5 h-5 text-neutral-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
              </div>
              {expandedBasicInfo && isValueDifferent && (
                <div className="px-4 pb-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                      <ul className="space-y-2 bg-white p-3 rounded-lg border border-neutral-200">
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Họ tên:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.fullName ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Email:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.email ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Điện thoại:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.phone ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Nơi ở:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : ''}`}>
                            {analysisResult.basicInfo.current.locationName ?? "—"}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-2">Gợi ý</p>
                      <ul className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Họ tên:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.fullName ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Email:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.email ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Điện thoại:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : 'text-blue-700'}`}>
                            {analysisResult.basicInfo.suggested.phone ?? "—"}
                          </span>
                        </li>
                        <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                          <span className="text-neutral-500">Nơi ở:</span>
                          <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : 'text-blue-700'}`}>
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
        </div>
      )}

      {/* CV List Section */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setIsCVsExpanded(!isCVsExpanded)}>
              <button className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                {isCVsExpanded ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : <ChevronUp className="w-5 h-5 text-neutral-600" />}
              </button>
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
              {selectedCVs.length > 0 && (
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
        </div>
        {isCVsExpanded && (
          <div className="p-6">
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
                uploadingCV={cvForm.uploadingCV}
                cvUploadProgress={cvForm.cvUploadProgress}
                isCVUploadedFromFirebase={cvForm.isCVUploadedFromFirebase}
                setIsCVUploadedFromFirebase={cvForm.setIsCVUploadedFromFirebase}
                uploadedCVUrl={cvForm.uploadedCVUrl}
                setUploadedCVUrl={cvForm.setUploadedCVUrl}
                cvPreviewUrl={cvForm.cvPreviewUrl}
                extractingCV={cvForm.extractingCV}
                inlineCVAnalysisResult={cvForm.inlineCVAnalysisResult}
                showInlineCVAnalysisModal={cvForm.showInlineCVAnalysisModal}
                showCVFullForm={cvForm.showCVFullForm}
                existingCVsForValidation={cvForm.existingCVsForValidation}
                lookupJobRoleLevels={cvForm.lookupJobRoleLevels}
                isSubmitting={isSubmitting}
                canEdit={canEdit}
                handleCVFileSelect={cvForm.handleCVFileSelect}
                handleAnalyzeCV={cvForm.handleAnalyzeCV}
                handleDeleteCVFile={cvForm.handleDeleteCVFile}
                handleCVFileUpload={cvForm.handleCVFileUpload}
                handleSubmitInlineCV={cvForm.handleSubmitInlineCV}
                handleConfirmInlineCVAnalysis={cvForm.handleConfirmInlineCVAnalysis}
                handleCancelInlineCVAnalysis={cvForm.handleCancelInlineCVAnalysis}
                validateCVVersion={cvForm.validateCVVersion}
                isValueDifferent={cvForm.isValueDifferent}
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
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
                        </th>
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
  );
}

