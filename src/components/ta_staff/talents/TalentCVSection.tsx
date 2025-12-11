import {
  FileText,
  Upload,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Target,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type JobRole } from '../../../services/JobRole';

interface TalentCVSectionProps {
  initialCVs: Partial<TalentCVCreate>[];
  cvFile: File | null;
  cvPreviewUrl?: string | null;
  jobRoleLevelsForCV: JobRoleLevel[];
  jobRoles: JobRole[];
  jobRoleLevelSearch: Record<number, string>;
  setJobRoleLevelSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isJobRoleLevelDropdownOpen: Record<number, boolean>;
  setIsJobRoleLevelDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  selectedJobRoleFilterId: Record<number, number | undefined>;
  setSelectedJobRoleFilterId: (filters: Record<number, number | undefined> | ((prev: Record<number, number | undefined>) => Record<number, number | undefined>)) => void;
  jobRoleFilterSearch: Record<number, string>;
  setJobRoleFilterSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isJobRoleFilterDropdownOpen: Record<number, boolean>;
  setIsJobRoleFilterDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  showCVSummary: Record<number, boolean>;
  setShowCVSummary: (show: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  uploadingCV: boolean;
  uploadingCVIndex: number | null;
  uploadProgress: number;
  isUploadedFromFirebase: boolean;
  uploadedCVUrl: string | null;
  errors: Record<string, string>;
  validateCVVersion?: (
    version: number,
    jobRoleLevelId: number,
    index: number,
    cvs: Partial<TalentCVCreate>[]
  ) => string;
  onFileChange: (file: File | null) => void;
  onUploadCV: (cvIndex: number) => void;
  onDeleteCVFile: (cvIndex: number) => void;
  onUpdateCV: (
    index: number,
    field: keyof TalentCVCreate,
    value: string | number | boolean | undefined
  ) => void;
  onCVUrlChange: (index: number, url: string) => void;
}

/**
 * Component section quản lý CV ban đầu của Talent
 */
export function TalentCVSection({
  initialCVs,
  cvFile,
  cvPreviewUrl: _cvPreviewUrl,
  jobRoleLevelsForCV,
  jobRoles,
  jobRoleLevelSearch,
  setJobRoleLevelSearch,
  isJobRoleLevelDropdownOpen,
  setIsJobRoleLevelDropdownOpen,
  selectedJobRoleFilterId,
  setSelectedJobRoleFilterId,
  jobRoleFilterSearch,
  setJobRoleFilterSearch,
  isJobRoleFilterDropdownOpen,
  setIsJobRoleFilterDropdownOpen,
  showCVSummary,
  setShowCVSummary,
  uploadingCV,
  uploadingCVIndex,
  uploadProgress,
  isUploadedFromFirebase,
  uploadedCVUrl,
  errors: _errors,
  validateCVVersion,
  onFileChange,
  onUploadCV,
  onDeleteCVFile,
  onUpdateCV,
  onCVUrlChange,
}: TalentCVSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            CV Ban Đầu <span className="text-red-500">*</span>
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {initialCVs.map((cv, index) => {
          const cvsSameJobRoleLevel = initialCVs.filter(
            (c, i) => i !== index && c.jobRoleLevelId === cv.jobRoleLevelId
          );
          const isFirstCVForJobRoleLevel = Boolean(
            cv.jobRoleLevelId &&
              cv.jobRoleLevelId > 0 &&
              cvsSameJobRoleLevel.length === 0
          );
          const versionError =
            cv.jobRoleLevelId && cv.version && validateCVVersion
              ? validateCVVersion(cv.version, cv.jobRoleLevelId, index, initialCVs)
              : '';

          return (
            <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-neutral-700">CV Ban Đầu</span>
              </div>

              {/* File Upload Section */}
              <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5 text-primary-600" />
                  <label className="block text-sm font-semibold text-neutral-700">
                    {cvFile ? 'Upload CV lên Firebase' : 'Chọn file CV (PDF)'}
                  </label>
                </div>

                <div className="space-y-3">
                  {!cvFile ? (
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onFileChange(file);
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  ) : (
                    <>
                      {/* File Info */}
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <FileText className="w-4 h-4" />
                        <span>
                          File đã chọn:{' '}
                          <span className="font-medium">{cvFile.name}</span> (
                          {(cvFile.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>

                      {/* Upload Progress */}
                      {uploadingCV && uploadingCVIndex === index && (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary-500 to-blue-500 h-3 rounded-full transition-all duration-300 animate-pulse"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-center text-primary-700 font-medium">
                            Đang upload... {uploadProgress}%
                          </p>
                        </div>
                      )}

                      {/* Upload Button */}
                      <Button
                        type="button"
                        onClick={() => onUploadCV(index)}
                        disabled={
                          !cvFile ||
                          uploadingCV ||
                          !cv.version ||
                          cv.version <= 0 ||
                          !cv.jobRoleLevelId ||
                          isUploadedFromFirebase
                        }
                        className="w-full flex items-center justify-center gap-2"
                        variant="primary"
                      >
                        {uploadingCV && uploadingCVIndex === index ? (
                          <>Đang upload...</>
                        ) : isUploadedFromFirebase ? (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Đã upload lên Firebase</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload CV lên Firebase</span>
                          </>
                        )}
                      </Button>
                      {isUploadedFromFirebase && (
                        <p className="text-xs text-green-600 italic">
                          ✓ File đã được upload lên Firebase, không thể upload lại
                        </p>
                      )}
                      {(!cv.version || cv.version <= 0) && !isUploadedFromFirebase && (
                        <p className="text-xs text-red-600 italic">
                          ⚠️ Vui lòng nhập version CV trước khi upload
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* CV Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Role Level */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Vị trí công việc <span className="text-red-500">*</span>
                  </label>

                  {/* Filter theo loại vị trí */}
                  <div className="relative mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIsJobRoleFilterDropdownOpen((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      disabled={isUploadedFromFirebase}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs border rounded-md transition-colors ${
                        isUploadedFromFirebase
                          ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                          : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="truncate">
                          {selectedJobRoleFilterId[index]
                            ? jobRoles.find((r) => r.id === selectedJobRoleFilterId[index])?.name ||
                              'Loại vị trí'
                            : 'Tất cả loại vị trí'}
                        </span>
                      </div>
                    </button>
                    {isJobRoleFilterDropdownOpen[index] && !isUploadedFromFirebase && (
                      <div
                        className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => {
                          setIsJobRoleFilterDropdownOpen((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                          setJobRoleFilterSearch((prev) => ({
                            ...prev,
                            [index]: '',
                          }));
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={jobRoleFilterSearch[index] || ''}
                              onChange={(e) =>
                                setJobRoleFilterSearch((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
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
                              setSelectedJobRoleFilterId((prev) => ({
                                ...prev,
                                [index]: undefined,
                              }));
                              setJobRoleFilterSearch((prev) => ({
                                ...prev,
                                [index]: '',
                              }));
                              setIsJobRoleFilterDropdownOpen((prev) => ({
                                ...prev,
                                [index]: false,
                              }));
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !selectedJobRoleFilterId[index]
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Tất cả loại vị trí
                          </button>
                          {jobRoles
                            .filter(
                              (role) =>
                                !jobRoleFilterSearch[index] ||
                                role.name
                                  .toLowerCase()
                                  .includes((jobRoleFilterSearch[index] || '').toLowerCase())
                            )
                            .map((role) => (
                              <button
                                type="button"
                                key={role.id}
                                onClick={() => {
                                  setSelectedJobRoleFilterId((prev) => ({
                                    ...prev,
                                    [index]: role.id,
                                  }));
                                  setJobRoleFilterSearch((prev) => ({
                                    ...prev,
                                    [index]: '',
                                  }));
                                  setIsJobRoleFilterDropdownOpen((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleFilterId[index] === role.id
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

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsJobRoleLevelDropdownOpen((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      disabled={isUploadedFromFirebase}
                      className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white/50 text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                        isUploadedFromFirebase
                          ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                          : 'border-neutral-300 focus:border-primary-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span>
                          {cv.jobRoleLevelId
                            ? jobRoleLevelsForCV.find((jrl) => jrl.id === cv.jobRoleLevelId)?.name ||
                              'Chọn vị trí'
                            : 'Chọn vị trí'}
                        </span>
                      </div>
                    </button>
                    {isJobRoleLevelDropdownOpen[index] && !isUploadedFromFirebase && (
                      <div
                        className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsJobRoleLevelDropdownOpen((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                          setJobRoleLevelSearch((prev) => ({
                            ...prev,
                            [index]: '',
                          }));
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={jobRoleLevelSearch[index] || ''}
                              onChange={(e) =>
                                setJobRoleLevelSearch((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
                              placeholder="Tìm vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const searchTerm = jobRoleLevelSearch[index] || '';
                            let filtered = searchTerm
                              ? jobRoleLevelsForCV.filter((jrl) =>
                                  jrl.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              : jobRoleLevelsForCV;
                            
                            // Filter theo loại vị trí nếu đã chọn
                            if (selectedJobRoleFilterId[index]) {
                              filtered = filtered.filter(
                                (jrl) => jrl.jobRoleId === selectedJobRoleFilterId[index]
                              );
                            }
                            if (filtered.length === 0) {
                              return (
                                <p className="px-4 py-3 text-sm text-neutral-500">
                                  Không tìm thấy vị trí nào
                                </p>
                              );
                            }
                            return filtered.map((jobRoleLevel) => (
                              <button
                                type="button"
                                key={jobRoleLevel.id}
                                onClick={() => {
                                  onUpdateCV(index, 'jobRoleLevelId', jobRoleLevel.id);
                                  setIsJobRoleLevelDropdownOpen((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                  setJobRoleLevelSearch((prev) => ({
                                    ...prev,
                                    [index]: '',
                                  }));

                                  // Tự động set version = 1 nếu đây là CV đầu tiên cho jobRoleLevelId này
                                  const cvsSameJobRoleLevel = initialCVs.filter(
                                    (c, i) => i !== index && c.jobRoleLevelId === jobRoleLevel.id
                                  );
                                  if (cvsSameJobRoleLevel.length === 0) {
                                    onUpdateCV(index, 'version', 1);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  cv.jobRoleLevelId === jobRoleLevel.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {jobRoleLevel.name}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  {!cv.jobRoleLevelId && !isUploadedFromFirebase && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Phải chọn vị trí công việc trước khi upload CV lên Firebase
                    </p>
                  )}
                  {isUploadedFromFirebase && (
                    <p className="text-xs text-green-600 mt-1">
                      File đã được upload lên Firebase, không thể thay đổi vị trí công việc
                    </p>
                  )}
                </div>

                {/* Version */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Version <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={cv.version || 1}
                    onChange={(e) => {
                      const newVersion = Number(e.target.value);
                      onUpdateCV(index, 'version', newVersion);
                    }}
                    placeholder="1"
                    min="1"
                    step="1"
                    required={!!cvFile}
                    disabled={isUploadedFromFirebase || isFirstCVForJobRoleLevel}
                    className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                      isUploadedFromFirebase || isFirstCVForJobRoleLevel
                        ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                        : versionError
                          ? 'border-red-500'
                          : ''
                    }`}
                  />
                  {(isUploadedFromFirebase || isFirstCVForJobRoleLevel) && (
                    <p className="text-xs text-green-600 mt-1">
                      {isUploadedFromFirebase
                        ? 'File đã được upload lên Firebase, không thể thay đổi version CV'
                        : 'Đây là CV đầu tiên cho vị trí công việc này, version mặc định là 1 và không thể thay đổi'}
                    </p>
                  )}
                  {versionError && !isUploadedFromFirebase && !isFirstCVForJobRoleLevel && (
                    <p className="text-xs text-red-500 mt-1">{versionError}</p>
                  )}
                  {cvFile &&
                    !isUploadedFromFirebase &&
                    !isFirstCVForJobRoleLevel &&
                    !versionError && (
                      <p className="text-xs text-neutral-500 mt-1">Bắt buộc nhập để upload CV</p>
                    )}
                  {cv.jobRoleLevelId &&
                    cvsSameJobRoleLevel.length > 0 &&
                    !isUploadedFromFirebase && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Các version hiện có cho vị trí này:{' '}
                        {cvsSameJobRoleLevel.map((c) => c.version || 'N/A').join(', ')}
                      </p>
                    )}
                </div>
              </div>

              {/* CV URL */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  URL file CV <span className="text-red-500">*</span>{' '}
                  {cv.cvFileUrl && (
                    <span className="text-green-600 text-xs">(✓ Đã có)</span>
                  )}
                </label>

                {/* Warning when URL is from Firebase */}
                {cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl && (
                  <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                      <span className="font-semibold">🔒</span>
                      <span>
                        URL này đã được upload từ Firebase và đã bị khóa. Không thể chỉnh sửa trực tiếp.
                        Để nhập URL thủ công, bạn PHẢI nhấn nút "Xóa" để xóa file trong Firebase trước.
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={cv.cvFileUrl || ''}
                    onChange={(e) => onCVUrlChange(index, e.target.value)}
                    placeholder="https://... hoặc upload từ file CV đã chọn"
                    disabled={
                      !!(cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl) ||
                      (uploadingCV && uploadingCVIndex === index)
                    }
                    className={`flex-1 border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                      cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl
                        ? 'bg-gray-100 cursor-not-allowed opacity-75 border-gray-300'
                        : isUploadedFromFirebase
                          ? 'border-green-300 bg-green-50'
                          : ''
                    }`}
                  />
                  {cv.cvFileUrl && (
                    <>
                      <a
                        href={cv.cvFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </a>
                      <Button
                        type="button"
                        onClick={() => onDeleteCVFile(index)}
                        disabled={uploadingCV && uploadingCVIndex === index}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        title={
                          uploadedCVUrl === cv.cvFileUrl
                            ? 'Xóa URL và file trong Firebase'
                            : 'Xóa URL'
                        }
                      >
                        <X className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowCVSummary((prev) => ({
                      ...prev,
                      [index]: !prev[index],
                    }))
                  }
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-2"
                >
                  {showCVSummary[index] ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ẩn mô tả/Tóm tắt
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Xem mô tả/Tóm tắt
                    </>
                  )}
                </button>
                {showCVSummary[index] && (
                  <textarea
                    value={cv.summary || ''}
                    onChange={(e) => onUpdateCV(index, 'summary', e.target.value)}
                    placeholder="Tóm tắt kinh nghiệm..."
                    rows={3}
                    className="w-full py-2 px-4 border rounded-lg bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

