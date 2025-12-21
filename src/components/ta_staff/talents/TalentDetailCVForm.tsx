/**
 * Component hiển thị form thêm CV mới trong Talent Detail page
 * 
 * Component này được tách từ Detail.tsx để dễ quản lý và bảo trì
 */

import {
  FileText,
  Eye,
  Workflow,
  Briefcase,
  CheckCircle,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { type TalentCV } from '../../../services/TalentCV';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type JobRole } from '../../../services/JobRole';

interface TalentDetailCVFormProps {
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
  setIsCVUploadedFromFirebase: (uploaded: boolean) => void;
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
  allTalentCVs?: (TalentCV & { jobRoleLevelName?: string })[]; // Tất cả CVs của talent để check vị trí đã có
  
  // Data
  lookupJobRoleLevels: JobRoleLevel[];
  jobRoles?: JobRole[]; // Danh sách job roles để filter
  
  // States
  isSubmitting: boolean;
  canEdit: boolean;
  
  // Handlers
  handleCVFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyzeCV: () => void;
  handleSubmitInlineCV: () => void;
  handleConfirmInlineCVAnalysis: () => void;
  handleCancelInlineCVAnalysis: () => void;
  validateCVVersion: (version: number, jobRoleLevelId: number) => string;
  isValueDifferent: (current: string | null | undefined, suggested: string | null | undefined) => boolean;
  setAnalysisResult?: (result: any) => void;
  setAnalysisResultCVId?: (cvId: number | null) => void;
  onShowCVFullFormChange?: (show: boolean) => void;
}

/**
 * Component form thêm CV mới
 */
export function TalentDetailCVForm({
  inlineCVForm,
  setInlineCVForm,
  cvFormErrors,
  setCvFormErrors,
  cvVersionError,
  setCvVersionError,
  selectedCVFile,
  setSelectedCVFile,
  uploadingCV,
  cvUploadProgress,
  setCvUploadProgress,
  isCVUploadedFromFirebase,
  setIsCVUploadedFromFirebase,
  setUploadedCVUrl,
  cvPreviewUrl,
  setCvPreviewUrl,
  extractingCV,
  inlineCVAnalysisResult,
  setInlineCVAnalysisResult,
  showInlineCVAnalysisModal,
  setShowInlineCVAnalysisModal,
  showCVFullForm,
  existingCVsForValidation,
  allTalentCVs,
  lookupJobRoleLevels,
  jobRoles,
  isSubmitting,
  canEdit,
  handleCVFileSelect,
  handleAnalyzeCV,
  handleSubmitInlineCV,
  handleConfirmInlineCVAnalysis,
  handleCancelInlineCVAnalysis,
  validateCVVersion,
  isValueDifferent,
  setAnalysisResult,
  setAnalysisResultCVId,
  onShowCVFullFormChange,
}: TalentDetailCVFormProps) {
  // State cho filter "Loại vị trí"
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>('');
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  
  // State cho job role level dropdown
  const [isJobRoleLevelDropdownOpen, setIsJobRoleLevelDropdownOpen] = useState(false);
  const [jobRoleLevelSearch, setJobRoleLevelSearch] = useState<string>('');

  // State để control việc hiển thị preview CV (mặc định đóng)
  const [showCVPreview, setShowCVPreview] = useState(false);

  // Notify parent when showCVFullForm changes
  useEffect(() => {
    onShowCVFullFormChange?.(showCVFullForm);
  }, [showCVFullForm, onShowCVFullFormChange]);

  return (
    <div className="bg-white rounded-xl border-2 border-accent-200 p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Thêm CV mới</h3>
        {/* Bỏ nút X - chỉ đóng khi hủy phân tích CV */}
      </div>

      {/* Giai đoạn 1: Chọn file CV (giống Create.tsx) */}
      {!showCVFullForm && (
        <div className="space-y-4">
          {/* File Input - Giống Create.tsx */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-neutral-700">Chọn file CV (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleCVFileSelect}
              className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {selectedCVFile && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                <FileText className="w-4 h-4" />
                <span>File đã chọn: <span className="font-medium">{selectedCVFile.name}</span> ({(selectedCVFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          {/* Preview và nút Phân tích - Hiện khi đã chọn file */}
          {selectedCVFile && cvPreviewUrl && (
            <div className="space-y-4">
              {/* CV Preview - Ở trên */}
              <div className="border-2 border-primary-200 rounded-xl overflow-hidden bg-white shadow-md">
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 flex items-center justify-between border-b border-primary-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <span className="text-xs font-semibold text-primary-800">Xem trước CV</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(cvPreviewUrl, '_blank')}
                    className="px-2 py-1 text-xs text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    Mở toàn màn hình
                  </button>
                </div>
                <div className="bg-white w-full" style={{ height: '500px' }}>
                  <iframe
                    src={cvPreviewUrl}
                    className="w-full h-full border-0"
                    title="CV Preview"
                  />
                </div>
              </div>

              {/* Nút Phân tích - Ở dưới */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      '⚠️ PHÂN TÍCH CV\n\n' +
                      'Bạn có chắc chắn muốn phân tích CV?\n\n' +
                      '• Quá trình phân tích có thể mất vài giây\n' +
                      '• Kết quả sẽ được hiển thị trong tab "Kết quả phân tích CV"\n\n' +
                      'Bạn có muốn tiếp tục không?'
                    );

                    if (confirmed) {
                      handleAnalyzeCV();
                    }
                  }}
                  disabled={extractingCV || !canEdit}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-sm px-4 py-3"
                  title={!canEdit ? "Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV." : ""}
                >
                  {extractingCV ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Workflow className="w-4 h-4" />
                      Phân tích CV
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Giai đoạn 2: Form đầy đủ - Chỉ hiện sau khi xác nhận phân tích */}
      {showCVFullForm && (
        <div className="space-y-6">
          {/* File đã chọn và Preview */}
          {selectedCVFile && (
            <div>
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>File đã chọn: <span className="font-medium">{selectedCVFile.name}</span> ({(selectedCVFile.size / 1024).toFixed(2)} KB)</span>
                </div>
                {cvPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => setShowCVPreview(!showCVPreview)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    {showCVPreview ? 'Ẩn preview' : 'Xem preview'}
                  </button>
                )}
              </div>

              {/* Preview CV */}
              {cvPreviewUrl && showCVPreview && (
                <div className="space-y-4">
                  {/* CV Preview */}
                  <div className="border-2 border-primary-200 rounded-xl overflow-hidden bg-white shadow-md">
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 flex items-center justify-between border-b border-primary-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <span className="text-xs font-semibold text-primary-800">Xem trước CV</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(cvPreviewUrl, '_blank')}
                        className="px-2 py-1 text-xs text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        Mở toàn màn hình
                      </button>
                    </div>
                    <div className="bg-white w-full" style={{ height: '500px' }}>
                      <iframe
                        src={cvPreviewUrl}
                        className="w-full h-full border-0"
                        title="CV Preview"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vị trí công việc */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vị trí công việc <span className="text-red-500">*</span>
            </label>
            {cvFormErrors.jobRoleLevelId && (
              <p className="text-xs text-red-600 mb-1">{cvFormErrors.jobRoleLevelId}</p>
            )}
            
            {/* Filter theo loại vị trí */}
            {jobRoles && jobRoles.length > 0 && (
              <div className="mb-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsJobRoleFilterDropdownOpen(prev => !prev)}
                    disabled={isCVUploadedFromFirebase}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border rounded-lg transition-colors ${
                      isCVUploadedFromFirebase
                        ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                        : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-neutral-500" />
                      <span className="truncate">
                        {selectedJobRoleFilterId
                          ? jobRoles.find((r) => r.id === selectedJobRoleFilterId)?.name || 'Loại vị trí'
                          : 'Tất cả loại vị trí'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${
                        isJobRoleFilterDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isJobRoleFilterDropdownOpen && !isCVUploadedFromFirebase && (
                    <div
                      className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
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
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
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
                              ? 'bg-primary-50 text-primary-700'
                              : 'hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          Tất cả loại vị trí
                        </button>
                        {jobRoles
                          .filter(
                            (role) =>
                              !jobRoleFilterSearch ||
                              role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
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
                                  ? 'bg-primary-50 text-primary-700'
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
            
            {/* Dropdown Vị trí công việc với tìm kiếm */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsJobRoleLevelDropdownOpen(prev => !prev)}
                disabled={isCVUploadedFromFirebase}
                className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  isCVUploadedFromFirebase
                    ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                    : cvFormErrors.jobRoleLevelId
                    ? 'border-red-500 bg-red-50'
                    : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Briefcase className="w-4 h-4 text-neutral-400" />
                  <span className={inlineCVForm.jobRoleLevelId ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                    {inlineCVForm.jobRoleLevelId
                      ? lookupJobRoleLevels.find((jrl) => jrl.id === inlineCVForm.jobRoleLevelId)?.name ||
                        'Chọn vị trí'
                      : '-- Chọn vị trí công việc --'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    isJobRoleLevelDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isJobRoleLevelDropdownOpen && !isCVUploadedFromFirebase && (
                <div
                  className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                  onMouseLeave={() => {
                    setIsJobRoleLevelDropdownOpen(false);
                    setJobRoleLevelSearch('');
                  }}
                >
                  <div className="p-3 border-b border-neutral-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        type="text"
                        value={jobRoleLevelSearch}
                        onChange={(e) => setJobRoleLevelSearch(e.target.value)}
                        placeholder="Tìm vị trí..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {(() => {
                      // Filter jobRoleLevels theo selectedJobRoleFilterId nếu có
                      let filteredJobRoleLevels = lookupJobRoleLevels;
                      if (selectedJobRoleFilterId) {
                        filteredJobRoleLevels = lookupJobRoleLevels.filter(
                          jrl => jrl.jobRoleId === selectedJobRoleFilterId
                        );
                      }

                      // Group by name và lấy item có level thấp nhất cho mỗi name
                      const groupedByName = new Map<string, JobRoleLevel>();
                      filteredJobRoleLevels.forEach(jobRoleLevel => {
                        const existing = groupedByName.get(jobRoleLevel.name || '');
                        if (!existing || (jobRoleLevel.level ?? 999) < (existing.level ?? 999)) {
                          groupedByName.set(jobRoleLevel.name || '', jobRoleLevel);
                        }
                      });
                      
                      let groupedJobRoleLevels = Array.from(groupedByName.values())
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                      
                      // Filter theo search term
                      if (jobRoleLevelSearch) {
                        groupedJobRoleLevels = groupedJobRoleLevels.filter(jrl =>
                          jrl.name?.toLowerCase().includes(jobRoleLevelSearch.toLowerCase())
                        );
                      }
                      
                      if (groupedJobRoleLevels.length === 0) {
                        return (
                          <p className="px-4 py-3 text-sm text-neutral-500">
                            Không tìm thấy vị trí nào
                          </p>
                        );
                      }
                      
                      // Sử dụng allTalentCVs nếu có, nếu không thì dùng existingCVsForValidation
                      const cvArrayForCheck = Array.isArray(allTalentCVs) && allTalentCVs.length > 0
                        ? allTalentCVs
                        : (Array.isArray(existingCVsForValidation) ? existingCVsForValidation : []);
                      
                      return groupedJobRoleLevels.map(jobRoleLevel => {
                        // Kiểm tra xem có CV nào có cùng name với jobRoleLevel này không (chỉ để hiển thị thông báo)
                        const hasExistingCV = cvArrayForCheck.some(cv => {
                          // Nếu CV có jobRoleLevelName, so sánh trực tiếp theo name
                          if ((cv as any).jobRoleLevelName) {
                            return (cv as any).jobRoleLevelName === jobRoleLevel.name;
                          }
                          // Nếu không, tìm jobRoleLevel trong lookupJobRoleLevels có cùng id với CV
                          const cvJobRoleLevel = lookupJobRoleLevels.find(jrl => jrl.id === cv.jobRoleLevelId);
                          // So sánh theo name
                          return cvJobRoleLevel?.name === jobRoleLevel.name;
                        });
                        
                        return (
                          <button
                            key={jobRoleLevel.id}
                            type="button"
                            onClick={() => {
                              setInlineCVForm({ ...inlineCVForm, jobRoleLevelId: jobRoleLevel.id });
                              const newErrors = { ...cvFormErrors };
                              delete newErrors.jobRoleLevelId;
                              setCvFormErrors(newErrors);
                              setCvVersionError("");
                              setIsJobRoleLevelDropdownOpen(false);
                              setJobRoleLevelSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              inlineCVForm.jobRoleLevelId === jobRoleLevel.id
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            } ${hasExistingCV ? 'text-neutral-600' : ''}`}
                          >
                            {jobRoleLevel.name}{hasExistingCV ? ' (đã có CV)' : ''}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Version */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Version CV <span className="text-red-500">*</span>
            </label>
            {(cvFormErrors.version || cvVersionError) && !isCVUploadedFromFirebase && (
              <p className="text-xs text-red-600 mb-1">{cvFormErrors.version || cvVersionError}</p>
            )}
            <input
              type="number"
              value={inlineCVForm.version || 1}
              onChange={(e) => {
                const versionNum = Number(e.target.value);
                setInlineCVForm({ ...inlineCVForm, version: versionNum });
                const jobRoleLevelId = inlineCVForm.jobRoleLevelId || 0;
                // Nếu chưa có CV nào và version = 1, không có lỗi
                if (jobRoleLevelId > 0 && existingCVsForValidation.length === 0 && versionNum === 1) {
                  setCvVersionError("");
                  const newErrors = { ...cvFormErrors };
                  delete newErrors.version;
                  setCvFormErrors(newErrors);
                } else {
                  const error = validateCVVersion(versionNum, jobRoleLevelId);
                  setCvVersionError(error);
                  const newErrors = { ...cvFormErrors };
                  if (error) {
                    newErrors.version = error;
                  } else {
                    delete newErrors.version;
                  }
                  setCvFormErrors(newErrors);
                }
              }}
              placeholder="VD: 1, 2, 3..."
              min="1"
              step="1"
              required
              disabled={isCVUploadedFromFirebase || (inlineCVForm.jobRoleLevelId ? inlineCVForm.jobRoleLevelId > 0 && existingCVsForValidation.length === 0 : false)}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-accent-500 bg-white ${
                isCVUploadedFromFirebase || (inlineCVForm.jobRoleLevelId ? inlineCVForm.jobRoleLevelId > 0 && existingCVsForValidation.length === 0 : false)
                  ? 'border-green-300 bg-green-50 cursor-not-allowed'
                  : cvVersionError || cvFormErrors.version
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-neutral-200 focus:border-accent-500'
              }`}
            />
            {existingCVsForValidation.length > 0 && !isCVUploadedFromFirebase && (
              <p className="text-xs text-neutral-500 mt-1">
                Các version hiện có: {existingCVsForValidation.map((cv: TalentCV) => cv.version || 'N/A').join(', ')}
              </p>
            )}
          </div>


          {/* Tóm tắt CV */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tóm tắt CV
            </label>
            <textarea
              value={inlineCVForm.summary || ""}
              onChange={(e) => setInlineCVForm({ ...inlineCVForm, summary: e.target.value })}
              placeholder="Mô tả ngắn gọn về nội dung CV, bao gồm: tên ứng viên, vị trí công việc, kinh nghiệm làm việc, kỹ năng chính, dự án nổi bật, chứng chỉ (nếu có)..."
              rows={4}
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-accent-500 focus:ring-accent-500 bg-white resize-none"
            />
          </div>

          {/* Error messages */}
          {cvFormErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{cvFormErrors.submit}</p>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex flex-col gap-3">
            {/* Upload Progress - Hiển thị khi đang upload */}
            {uploadingCV && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-blue-500 h-3 rounded-full transition-all duration-300 animate-pulse"
                    style={{ width: `${cvUploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center text-accent-700 font-medium">
                  Đang upload file CV lên Firebase... {cvUploadProgress}%
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  const confirmed = window.confirm(
                    '⚠️ HỦY THÊM CV\n\n' +
                    'Bạn có chắc chắn muốn hủy?\n\n' +
                    '• Kết quả phân tích CV sẽ bị xóa\n' +
                    '• Bạn sẽ phải chọn lại file CV mới\n' +
                    '• Form sẽ được reset\n\n' +
                    'Bạn có muốn tiếp tục không?'
                  );

                  if (confirmed) {
                    // Xóa kết quả phân tích CV từ cả 2 hooks
                    if (setAnalysisResult) {
                      setAnalysisResult(null);
                    }
                    if (setAnalysisResultCVId) {
                      setAnalysisResultCVId(null);
                    }
                    handleCancelInlineCVAnalysis();
                  }
                }}
                disabled={isSubmitting || uploadingCV}
                className={`px-4 py-2 rounded-lg bg-neutral-600 hover:bg-neutral-700 text-white transition-all flex items-center gap-2 ${(isSubmitting || uploadingCV) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <X className="w-4 h-4" />
                Hủy
              </Button>

              <Button
                onClick={handleSubmitInlineCV}
                disabled={isSubmitting || uploadingCV || !selectedCVFile}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white transition-all flex items-center gap-2 ${(isSubmitting || uploadingCV || !selectedCVFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {(isSubmitting || uploadingCV) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {uploadingCV ? `Đang upload... ${cvUploadProgress}%` : 'Đang lưu...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Thêm CV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân tích CV inline */}
      {showInlineCVAnalysisModal && inlineCVAnalysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* Bỏ logic đóng modal khi click outside - chỉ đóng khi hủy phân tích */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Workflow className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Kết quả phân tích CV</h2>
              </div>
              {/* Bỏ nút X - chỉ đóng khi hủy phân tích CV */}
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-neutral-600">
                Hệ thống đã so sánh CV mới với dữ liệu hiện có của nhân sự.
              </p>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">So sánh thông tin cơ bản</h3>
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-medium">Có thay đổi:</span> {inlineCVAnalysisResult.basicInfo.hasChanges ? "Có" : "Không"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                  <div>
                    <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                    <ul className="space-y-2 bg-white p-3 rounded-lg border border-neutral-200">
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Họ tên:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : ''}`}>
                          {inlineCVAnalysisResult.basicInfo.current.fullName ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Email:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'text-red-700' : ''}`}>
                          {inlineCVAnalysisResult.basicInfo.current.email ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Điện thoại:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'text-red-700' : ''}`}>
                          {inlineCVAnalysisResult.basicInfo.current.phone ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Nơi ở:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : ''}`}>
                          {inlineCVAnalysisResult.basicInfo.current.locationName ?? "—"}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 mb-2">Gợi ý từ CV</p>
                    <ul className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Họ tên:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : 'text-blue-700'}`}>
                          {inlineCVAnalysisResult.basicInfo.suggested.fullName ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Email:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'text-red-700' : 'text-blue-700'}`}>
                          {inlineCVAnalysisResult.basicInfo.suggested.email ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Điện thoại:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'text-red-700' : 'text-blue-700'}`}>
                          {inlineCVAnalysisResult.basicInfo.suggested.phone ?? "—"}
                        </span>
                      </li>
                      <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                        <span className="text-neutral-500">Nơi ở:</span>
                        <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : 'text-blue-700'}`}>
                          {inlineCVAnalysisResult.basicInfo.suggested.locationName ?? "—"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button
                  onClick={() => {
                    // Xóa kết quả phân tích CV và đóng popup
                    setInlineCVAnalysisResult(null);
                    setShowInlineCVAnalysisModal(false);

                    // Xóa file đã chọn và các state liên quan
                    setSelectedCVFile(null);
                    setCvPreviewUrl(null);
                    if (cvPreviewUrl) {
                      URL.revokeObjectURL(cvPreviewUrl);
                    }
                    setCvUploadProgress(0);
                    setIsCVUploadedFromFirebase(false);
                    setUploadedCVUrl(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-neutral-600 hover:bg-neutral-700 text-white transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </Button>
                {inlineCVAnalysisResult.basicInfo.hasChanges && (
                  <Button
                    onClick={handleConfirmInlineCVAnalysis}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tiếp tục
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

