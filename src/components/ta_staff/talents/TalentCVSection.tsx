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
import { useState } from 'react';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';
import { type JobRole } from '../../../services/JobRole';
import { type TalentJobRoleLevelCreateModel } from '../../../services/Talent';

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
  errors: Record<string, string>;
  onFileChange: (file: File | null) => void;
  onUpdateCV: (
    index: number,
    field: keyof TalentCVCreate,
    value: string | number | boolean | undefined
  ) => void;
  // Level selection props
  selectedLevel: Record<number, number | undefined>;
  setSelectedLevel: (level: Record<number, number | undefined> | ((prev: Record<number, number | undefined>) => Record<number, number | undefined>)) => void;
  isLevelDropdownOpen: Record<number, boolean>;
  setIsLevelDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  getLevelText: (level: number) => string;
  // Talent Job Role Levels for level dropdown
  talentJobRoleLevels: TalentJobRoleLevelCreateModel[];
  jobRoleLevels: JobRoleLevel[];
  onUpdateTalentJobRoleLevel: (index: number, field: keyof TalentJobRoleLevelCreateModel, value: number | undefined) => void;
}

/**
 * Component section quản lý CV ban đầu của Talent
 */
export function TalentCVSection({
  initialCVs,
  cvFile,
  cvPreviewUrl,
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
  errors,
  onFileChange,
  onUpdateCV,
  selectedLevel,
  setSelectedLevel,
  isLevelDropdownOpen,
  setIsLevelDropdownOpen,
  getLevelText,
  talentJobRoleLevels,
  jobRoleLevels,
  onUpdateTalentJobRoleLevel,
}: TalentCVSectionProps) {
  const [showCVPreview, setShowCVPreview] = useState<Record<number, boolean>>({});

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
                      id={`cv-file-input-${index}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onFileChange(file);
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  ) : (
                    <>
                      {/* File Info */}
                      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="p-1.5 bg-primary-50 rounded-lg">
                            <FileText className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-700 truncate">
                              {cvFile.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {(cvFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        {!isUploadedFromFirebase && (
                          <button
                            type="button"
                            onClick={() => {
                              onFileChange(null);
                              // Reset input file để có thể chọn lại file giống nhau
                              const fileInput = document.getElementById(`cv-file-input-${index}`) as HTMLInputElement;
                              if (fileInput) {
                                fileInput.value = '';
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95"
                          >
                            <X className="w-4 h-4" />
                            <span>Chọn lại</span>
                          </button>
                        )}
                      </div>

                      {/* Upload Progress - Chỉ hiển thị khi đang upload */}
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
                      
                      {isUploadedFromFirebase && (
                        <p className="text-xs text-green-600 italic text-center">
                          ✓ File đã được upload lên Firebase
                        </p>
                      )}

                      {/* CV Preview */}
                      {(cvFile || cvPreviewUrl) && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCVPreview((prev) => ({
                                  ...prev,
                                  [index]: !prev[index],
                                }));
                              }}
                              className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-primary-600 transition-colors"
                            >
                              {showCVPreview[index] ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Ẩn xem trước CV
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Xem trước CV
                                </>
                              )}
                            </button>
                            {cvPreviewUrl && (
                              <a
                                href={cvPreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Mở trong tab mới
                              </a>
                            )}
                          </div>
                          {showCVPreview[index] && (
                            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                              {cvPreviewUrl ? (
                                <iframe
                                  src={cvPreviewUrl}
                                  className="w-full h-96"
                                  title="CV Preview"
                                />
                              ) : cvFile ? (
                                <iframe
                                  src={URL.createObjectURL(cvFile)}
                                  className="w-full h-96"
                                  title="CV Preview"
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* CV Details */}
              <div className="space-y-4">
                {/* Job Role Level - Chỉ hiển thị khi có file CV */}
                {(cvFile || cvPreviewUrl) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-700">
                      Vị trí công việc <span className="text-red-500">*</span>
                    </label>

                  {/* Filter theo loại vị trí và Cấp độ */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Filter theo loại vị trí */}
                    <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsJobRoleFilterDropdownOpen((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      disabled={isUploadedFromFirebase}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors ${
                        isUploadedFromFirebase
                          ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                          : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <span className="truncate">
                          {selectedJobRoleFilterId[index]
                            ? jobRoles.find((r) => r.id === selectedJobRoleFilterId[index])?.name ||
                              'Loại vị trí'
                            : 'Tất cả loại vị trí'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isJobRoleFilterDropdownOpen[index] ? 'rotate-180' : ''
                        }`}
                      />
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

                    {/* Cấp độ */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedJRL = jobRoleLevelsForCV.find((jrl) => jrl.id === cv.jobRoleLevelId);
                          if (selectedJRL) {
                            setIsLevelDropdownOpen((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }));
                          }
                        }}
                        disabled={isUploadedFromFirebase || !cv.jobRoleLevelId}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors ${
                          isUploadedFromFirebase || !cv.jobRoleLevelId
                            ? 'border-neutral-300 bg-neutral-50 cursor-not-allowed opacity-75'
                            : 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-neutral-500" />
                          <span className="truncate text-sm">
                            {cv.jobRoleLevelId
                              ? (selectedLevel[index] !== undefined
                                  ? getLevelText(selectedLevel[index]!)
                                  : 'Chọn cấp độ')
                              : 'Chọn vị trí trước'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 transition-transform ${
                            isLevelDropdownOpen[index] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isLevelDropdownOpen[index] && cv.jobRoleLevelId && !isUploadedFromFirebase && (
                        <div
                          className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => {
                            setIsLevelDropdownOpen((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }}
                        >
                          <div className="max-h-56 overflow-y-auto">
                            {(() => {
                              // Lấy vị trí từ talentJobRoleLevels (dropdown cấp độ phụ thuộc vào talentJobRoleLevels)
                              const talentJobRoleLevel = talentJobRoleLevels[0];
                              if (!talentJobRoleLevel || !talentJobRoleLevel.jobRoleLevelId) {
                                return (
                                  <p className="px-4 py-3 text-sm text-neutral-500">
                                    Vui lòng chọn vị trí công việc trước
                                  </p>
                                );
                              }

                              // Tìm jobRoleLevel từ talentJobRoleLevels
                              const selectedJRL = jobRoleLevels.find((jrl) => jrl.id === talentJobRoleLevel.jobRoleLevelId);
                              if (!selectedJRL) return null;
                              
                              // Lấy tất cả các cấp độ có cùng tên vị trí
                              const availableLevels = jobRoleLevels
                                .filter((jrl) => jrl.name === selectedJRL.name)
                                .map((jrl) => jrl.level)
                                .filter((level, idx, self) => self.indexOf(level) === idx);

                              if (availableLevels.length === 0) {
                                return (
                                  <p className="px-4 py-3 text-sm text-neutral-500">
                                    Không có cấp độ nào cho vị trí này
                                  </p>
                                );
                              }

                              return availableLevels.map((level) => {
                                const matchingJRL = jobRoleLevels.find(
                                  (jrl) => jrl.name === selectedJRL.name && jrl.level === level
                                );

                                if (!matchingJRL) {
                                  console.warn(`Không tìm thấy jobRoleLevel với name="${selectedJRL.name}" và level=${level}`);
                                  return null;
                                }

                                return (
                                  <button
                                    type="button"
                                    key={level}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (matchingJRL && matchingJRL.id && matchingJRL.id > 0) {
                                        setSelectedLevel((prev) => ({
                                          ...prev,
                                          [index]: level,
                                        }));
                                        // Chỉ cập nhật talentJobRoleLevels, KHÔNG cập nhật cv.jobRoleLevelId
                                        // Vì cùng tên vị trí, chỉ khác cấp độ
                                        onUpdateTalentJobRoleLevel(0, 'jobRoleLevelId', matchingJRL.id);
                                        setIsLevelDropdownOpen((prev) => ({
                                          ...prev,
                                          [index]: false,
                                        }));
                                      } else {
                                        console.error('matchingJRL không hợp lệ:', matchingJRL);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      talentJobRoleLevels[0]?.jobRoleLevelId === matchingJRL?.id
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                  >
                                    {getLevelText(level)}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown chọn vị trí */}
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
                      className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                        isUploadedFromFirebase
                          ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                          : errors[`cv_${index}_jobRoleLevelId`]
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className={cv.jobRoleLevelId ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                          {cv.jobRoleLevelId
                            ? jobRoleLevelsForCV.find((jrl) => jrl.id === cv.jobRoleLevelId)?.name ||
                              'Chọn vị trí'
                            : 'Chọn vị trí'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isJobRoleLevelDropdownOpen[index] ? 'rotate-180' : ''
                        }`}
                      />
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
                                  // Tự động set version = 1
                                  onUpdateCV(index, 'version', 1);
                                  setIsJobRoleLevelDropdownOpen((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                  setJobRoleLevelSearch((prev) => ({
                                    ...prev,
                                    [index]: '',
                                  }));
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
                  {isUploadedFromFirebase && (
                    <p className="text-xs text-green-600 mt-1">
                      File đã được upload lên Firebase, không thể thay đổi vị trí công việc
                    </p>
                  )}
                </div>
                )}

              </div>


              {/* Summary - Chỉ hiển thị khi có file CV */}
              {(cvFile || cvPreviewUrl) && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

