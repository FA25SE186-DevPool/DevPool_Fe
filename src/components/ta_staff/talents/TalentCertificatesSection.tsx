import { useState, useEffect } from 'react';
import { Plus, X, Award, Upload, Search, Calendar, Image as ImageIcon, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { SectionPagination } from './SectionPagination';
import { type TalentCertificateCreateModel } from '../../../services/Talent';
import { type CertificateType } from '../../../services/CertificateType';

interface TalentCertificatesSectionProps {
  talentCertificates: TalentCertificateCreateModel[];
  certificateTypes: CertificateType[];
  certificateTypeSearch: Record<number, string>;
  setCertificateTypeSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isCertificateTypeDropdownOpen: Record<number, boolean>;
  setIsCertificateTypeDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  certificateImageFiles: Record<number, File>;
  uploadingCertificateIndex: number | null;
  certificateUploadProgress: Record<number, number>;
  uploadedCertificateUrls: Record<number, string>;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentCertificateCreateModel, value: string | number | boolean | undefined) => void;
  onFileChange: (certIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadImage: (certIndex: number) => void;
  onDeleteImage?: (certIndex: number, imageUrl: string) => void;
}

/**
 * Component section quản lý chứng chỉ của Talent
 */
export function TalentCertificatesSection({
  talentCertificates,
  certificateTypes,
  certificateTypeSearch,
  setCertificateTypeSearch,
  isCertificateTypeDropdownOpen,
  setIsCertificateTypeDropdownOpen,
  certificateImageFiles,
  uploadingCertificateIndex,
  certificateUploadProgress,
  uploadedCertificateUrls,
  errors,
  onAdd,
  onRemove,
  onUpdate,
  onFileChange,
  onUploadImage,
  onDeleteImage,
}: TalentCertificatesSectionProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;

  // Description collapse state
  const [isDescriptionOpen, setIsDescriptionOpen] = useState<Record<number, boolean>>({});

  // Calculate pagination
  const totalPages = Math.ceil(talentCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCertificates = talentCertificates.slice(startIndex, endIndex);

  // Reset to page 1 when certificates list changes and current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [talentCertificates.length, currentPage, totalPages]);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <Award className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Chứng chỉ</h2>
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
            Thêm chứng chỉ
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {talentCertificates.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có chứng chỉ nào. Nhấn "Thêm chứng chỉ" để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedCertificates.map((cert, localIndex) => {
                const globalIndex = startIndex + localIndex;
                return (
                  <div key={globalIndex} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-neutral-700">Chứng chỉ #{globalIndex + 1}</span>
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
                        {/* Certificate Type */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Loại chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setIsCertificateTypeDropdownOpen((prev) => ({
                                  ...prev,
                                  [globalIndex]: !prev[globalIndex],
                                }))
                              }
                              className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left ${
                                errors[`certificate_${globalIndex}`]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-neutral-300 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Award className="w-4 h-4 text-neutral-400" />
                                <span>
                                  {cert.certificateTypeId
                                    ? certificateTypes.find((t) => t.id === cert.certificateTypeId)?.name ||
                                      'Chọn loại chứng chỉ'
                                    : 'Chọn loại chứng chỉ'}
                                </span>
                              </div>
                              <X
                                className={`w-4 h-4 text-neutral-400 transition-transform ${
                                  isCertificateTypeDropdownOpen[globalIndex] ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            {isCertificateTypeDropdownOpen[globalIndex] && (
                              <div
                                className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                onMouseLeave={() => {
                                  setIsCertificateTypeDropdownOpen((prev) => ({
                                    ...prev,
                                    [globalIndex]: false,
                                  }));
                                  setCertificateTypeSearch((prev) => ({
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
                                      value={certificateTypeSearch[globalIndex] || ''}
                                      onChange={(e) =>
                                        setCertificateTypeSearch((prev) => ({
                                          ...prev,
                                          [globalIndex]: e.target.value,
                                        }))
                                      }
                                      placeholder="Tìm loại chứng chỉ..."
                                      className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {certificateTypes
                                    .filter(
                                      (t) =>
                                        !certificateTypeSearch[globalIndex] ||
                                        t.name
                                          .toLowerCase()
                                          .includes(certificateTypeSearch[globalIndex].toLowerCase())
                                    )
                                    .map((type) => (
                                      <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => {
                                          onUpdate(globalIndex, 'certificateTypeId', type.id);
                                          setIsCertificateTypeDropdownOpen((prev) => ({
                                            ...prev,
                                            [globalIndex]: false,
                                          }));
                                          setCertificateTypeSearch((prev) => ({
                                            ...prev,
                                            [globalIndex]: '',
                                          }));
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          cert.certificateTypeId === type.id
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'hover:bg-neutral-50 text-neutral-700'
                                        }`}
                                      >
                                        {type.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {errors[`certificate_${globalIndex}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`certificate_${globalIndex}`]}</p>
                          )}
                        </div>

                        {/* Issued Date */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Ngày cấp
                          </label>
                          <Input
                            type="date"
                            value={cert.issuedDate || ''}
                            onChange={(e) =>
                              onUpdate(globalIndex, 'issuedDate', e.target.value || undefined)
                            }
                            className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Certificate Name */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          Tên chứng chỉ <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={cert.certificateName || ''}
                          onChange={(e) => onUpdate(globalIndex, 'certificateName', e.target.value)}
                          placeholder="Nhập tên chứng chỉ"
                          maxLength={255}
                          className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                            errors[`certificate_name_${globalIndex}`] ? 'border-red-500' : ''
                          }`}
                        />
                        {errors[`certificate_name_${globalIndex}`] && (
                          <p className="mt-1 text-sm text-red-500">{errors[`certificate_name_${globalIndex}`]}</p>
                        )}
                        <p className="mt-1 text-xs text-neutral-500">Tối đa 255 ký tự</p>
                      </div>

                      {/* Certificate Description */}
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
                            Mô tả chứng chỉ (tùy chọn)
                          </label>
                          {isDescriptionOpen[globalIndex] ? (
                            <ChevronUp className="w-4 h-4 text-neutral-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                          )}
                        </button>
                        {isDescriptionOpen[globalIndex] && (
                          <>
                            <textarea
                              value={cert.certificateDescription || ''}
                              onChange={(e) => onUpdate(globalIndex, 'certificateDescription', e.target.value)}
                              maxLength={1000}
                              rows={3}
                              placeholder="Nhập mô tả về chứng chỉ..."
                              className={`w-full px-3 py-2 border rounded-lg bg-white resize-none ${
                                errors[`certificate_description_${globalIndex}`]
                                  ? 'border-red-500'
                                  : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {errors[`certificate_description_${globalIndex}`] && (
                              <p className="mt-1 text-sm text-red-500">
                                {errors[`certificate_description_${globalIndex}`]}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-neutral-500">Tối đa 1000 ký tự</p>
                          </>
                        )}
                      </div>

                      {/* Image Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          URL hình ảnh{' '}
                          {cert.imageUrl && (
                            <span className="text-green-600 text-xs">(✓ Đã có)</span>
                          )}
                        </label>

                        {/* Upload Image Section */}
                        <div className="mb-2 p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 shadow-soft">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-primary-100 rounded-lg">
                              <Upload className="w-3.5 h-3.5 text-primary-600" />
                            </div>
                            <label className="block text-sm font-semibold text-neutral-700">
                              {certificateImageFiles[globalIndex] ? 'Upload ảnh lên Firebase' : 'Chọn file ảnh chứng chỉ'}
                            </label>
                          </div>

                          <div className="space-y-2">
                            {/* File Input */}
                            <div>
                              {!certificateImageFiles[globalIndex] && !(cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl) ? (
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`cert-image-input-${globalIndex}`}
                                  onChange={(e) => onFileChange(globalIndex, e)}
                                  disabled={uploadingCertificateIndex === globalIndex}
                                  className="w-full px-3 py-2 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              ) : certificateImageFiles[globalIndex] ? (
                                <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-neutral-200">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="p-1 bg-primary-50 rounded-lg">
                                      <ImageIcon className="w-3.5 h-3.5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-neutral-700 truncate">
                                        {certificateImageFiles[globalIndex].name}
                                      </p>
                                      <p className="text-xs text-neutral-500">
                                        {(certificateImageFiles[globalIndex].size / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  {!(cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Clear file from state
                                        const event = { target: { files: null, value: '' } } as any;
                                        onFileChange(globalIndex, event);
                                        // Reset input file
                                        const fileInput = document.getElementById(`cert-image-input-${globalIndex}`) as HTMLInputElement;
                                        if (fileInput) {
                                          fileInput.value = '';
                                        }
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Chọn lại</span>
                                    </button>
                                  )}
                                </div>
                              ) : cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl ? (
                                <div className="flex items-center justify-between gap-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                      <ImageIcon className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-green-700">
                                        ✓ Đã upload lên Firebase
                                      </p>
                                      <p className="text-xs text-green-600 truncate">
                                        {cert.imageUrl}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            {/* Upload Progress */}
                            {uploadingCertificateIndex === globalIndex && (
                              <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                                    style={{ width: `${certificateUploadProgress[globalIndex] || 0}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-center text-primary-700 font-medium">
                                  Đang upload... {certificateUploadProgress[globalIndex] || 0}%
                                </p>
                              </div>
                            )}

                            {/* Upload Button */}
                            <button
                              type="button"
                              onClick={() => onUploadImage(globalIndex)}
                              disabled={
                                !certificateImageFiles[globalIndex] ||
                                uploadingCertificateIndex === globalIndex ||
                                !!(cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl)
                              }
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                !certificateImageFiles[globalIndex] ||
                                uploadingCertificateIndex === globalIndex ||
                                (cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl)
                                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-700 hover:to-blue-700 shadow-glow hover:shadow-glow-lg transform hover:scale-[1.02] active:scale-[0.98]'
                              }`}
                            >
                              {uploadingCertificateIndex === globalIndex ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Đang upload...</span>
                                </>
                              ) : cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl ? (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Đã upload lên Firebase</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload ảnh lên Firebase</span>
                                </>
                              )}
                            </button>
                            {cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl && (
                              <p className="text-xs text-green-600 italic text-center">
                                ✓ File đã được upload lên Firebase, không thể upload lại
                              </p>
                            )}
                            {!certificateImageFiles[globalIndex] && !(cert.imageUrl && uploadedCertificateUrls[globalIndex] === cert.imageUrl) && (
                              <p className="text-xs text-neutral-500 italic text-center">
                                Vui lòng chọn file ảnh trước khi upload
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Manual URL Input */}
                        <div className="space-y-2">
                          <Input
                            type="url"
                            value={cert.imageUrl || ''}
                            onChange={(e) => onUpdate(globalIndex, 'imageUrl', e.target.value)}
                            placeholder="https://example.com/certificate.jpg"
                            disabled={
                              cert.imageUrl !== undefined &&
                              uploadedCertificateUrls[globalIndex] === cert.imageUrl
                            }
                            className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                              cert.imageUrl !== undefined &&
                              uploadedCertificateUrls[globalIndex] === cert.imageUrl
                                ? 'bg-neutral-100 cursor-not-allowed'
                                : ''
                            }`}
                          />
                          {cert.imageUrl &&
                            uploadedCertificateUrls[globalIndex] === cert.imageUrl &&
                            onDeleteImage && (
                              <button
                                type="button"
                                onClick={() => onDeleteImage(globalIndex, cert.imageUrl || '')}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Xóa ảnh từ Firebase</span>
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {talentCertificates.length > itemsPerPage && (
              <SectionPagination
                currentPage={currentPage}
                totalItems={talentCertificates.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="chứng chỉ"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

