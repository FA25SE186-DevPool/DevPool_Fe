import { Plus, X, Award, Upload, FileText, Search, Calendar, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
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
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Chứng chỉ</h2>
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
            Thêm chứng chỉ
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {talentCertificates.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có chứng chỉ nào. Nhấn "Thêm chứng chỉ" để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {talentCertificates.map((cert, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-neutral-700">Chứng chỉ #{index + 1}</span>
                  <Button
                    type="button"
                    onClick={() => onRemove(index)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Certificate Type */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Loại chứng chỉ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsCertificateTypeDropdownOpen((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left ${
                            errors[`certificate_${index}`]
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
                              isCertificateTypeDropdownOpen[index] ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {isCertificateTypeDropdownOpen[index] && (
                          <div
                            className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                            onMouseLeave={() => {
                              setIsCertificateTypeDropdownOpen((prev) => ({
                                ...prev,
                                [index]: false,
                              }));
                              setCertificateTypeSearch((prev) => ({
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
                                  value={certificateTypeSearch[index] || ''}
                                  onChange={(e) =>
                                    setCertificateTypeSearch((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }))
                                  }
                                  placeholder="Tìm loại chứng chỉ..."
                                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {certificateTypes
                                .filter(
                                  (t) =>
                                    !certificateTypeSearch[index] ||
                                    t.name
                                      .toLowerCase()
                                      .includes(certificateTypeSearch[index].toLowerCase())
                                )
                                .map((type) => (
                                  <button
                                    type="button"
                                    key={type.id}
                                    onClick={() => {
                                      onUpdate(index, 'certificateTypeId', type.id);
                                      setIsCertificateTypeDropdownOpen((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      }));
                                      setCertificateTypeSearch((prev) => ({
                                        ...prev,
                                        [index]: '',
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
                      {errors[`certificate_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`certificate_${index}`]}</p>
                      )}
                    </div>

                    {/* Issued Date */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Ngày cấp
                      </label>
                      <Input
                        type="date"
                        value={cert.issuedDate || ''}
                        onChange={(e) =>
                          onUpdate(index, 'issuedDate', e.target.value || undefined)
                        }
                        className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Certificate Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tên chứng chỉ <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={cert.certificateName || ''}
                      onChange={(e) => onUpdate(index, 'certificateName', e.target.value)}
                      placeholder="Nhập tên chứng chỉ"
                      maxLength={255}
                      className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                        errors[`certificate_name_${index}`] ? 'border-red-500' : ''
                      }`}
                    />
                    {errors[`certificate_name_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`certificate_name_${index}`]}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">Tối đa 255 ký tự</p>
                  </div>

                  {/* Certificate Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Mô tả chứng chỉ (tùy chọn)
                    </label>
                    <textarea
                      value={cert.certificateDescription || ''}
                      onChange={(e) => onUpdate(index, 'certificateDescription', e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Nhập mô tả về chứng chỉ..."
                      className={`w-full px-3 py-2.5 border rounded-lg bg-white resize-none ${
                        errors[`certificate_description_${index}`]
                          ? 'border-red-500'
                          : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                    />
                    {errors[`certificate_description_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors[`certificate_description_${index}`]}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">Tối đa 1000 ký tự</p>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      URL hình ảnh{' '}
                      {cert.imageUrl && (
                        <span className="text-green-600 text-xs">(✓ Đã có)</span>
                      )}
                    </label>

                    {/* Upload Image Section */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-4 h-4 text-primary-600" />
                        <label className="block text-xs font-semibold text-neutral-700">
                          Upload ảnh chứng chỉ
                        </label>
                      </div>

                      <div className="space-y-2">
                        {/* File Input */}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onFileChange(index, e)}
                            disabled={uploadingCertificateIndex === index}
                            className="w-full text-xs py-1.5 px-2 border rounded-lg bg-white border-neutral-300 focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {certificateImageFiles[index] && (
                            <div className="flex items-center gap-2 text-xs text-neutral-600 mt-1">
                              <FileText className="w-3 h-3" />
                              <span>
                                Đã chọn:{' '}
                                <span className="font-medium">{certificateImageFiles[index].name}</span> (
                                {(certificateImageFiles[index].size / 1024).toFixed(2)} KB)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Upload Progress */}
                        {uploadingCertificateIndex === index && (
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                                style={{ width: `${certificateUploadProgress[index] || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-center text-primary-700 font-medium">
                              Đang upload... {certificateUploadProgress[index] || 0}%
                            </p>
                          </div>
                        )}

                        {/* Upload Button */}
                        <Button
                          type="button"
                          onClick={() => onUploadImage(index)}
                          disabled={!certificateImageFiles[index] || uploadingCertificateIndex === index}
                          className="w-full"
                          variant="primary"
                        >
                          {uploadingCertificateIndex === index ? (
                            <>Đang upload...</>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-2" />
                              Upload ảnh lên Firebase
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Manual URL Input */}
                    <div className="space-y-2">
                      {cert.imageUrl && uploadedCertificateUrls[index] === cert.imageUrl && (
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-xs text-orange-700 flex items-center gap-1.5">
                            <span className="font-semibold">🔒</span>
                            <span>
                              URL này đã được upload từ Firebase và đã bị khóa. Không thể chỉnh sửa trực tiếp.
                              Để nhập URL thủ công, bạn PHẢI nhấn nút "Xóa" để xóa file trong Firebase trước.
                            </span>
                          </p>
                        </div>
                      )}
                      <Input
                        type="url"
                        value={cert.imageUrl || ''}
                        onChange={(e) => onUpdate(index, 'imageUrl', e.target.value)}
                        placeholder="https://example.com/certificate.jpg"
                        disabled={
                          cert.imageUrl !== undefined &&
                          uploadedCertificateUrls[index] === cert.imageUrl
                        }
                        className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg ${
                          cert.imageUrl !== undefined &&
                          uploadedCertificateUrls[index] === cert.imageUrl
                            ? 'bg-neutral-100 cursor-not-allowed'
                            : ''
                        }`}
                      />
                      {cert.imageUrl &&
                        uploadedCertificateUrls[index] === cert.imageUrl &&
                        onDeleteImage && (
                          <Button
                            type="button"
                            onClick={() => onDeleteImage(index, cert.imageUrl || '')}
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Xóa ảnh từ Firebase
                          </Button>
                        )}
                    </div>
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

