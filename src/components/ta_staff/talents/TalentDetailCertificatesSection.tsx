import { Plus, Trash2, Award, X, Save, Upload, Eye, FileText, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { SectionPagination } from './SectionPagination';
import { type TalentCertificate } from '../../../services/TalentCertificate';
import { type TalentCertificateCreateModel } from '../../../services/Talent';
import { type CertificateType } from '../../../services/CertificateType';
import { type CVAnalysisComparisonResponse } from '../../../services/TalentCV';
import { TalentCertificateEditModal } from './TalentCertificateEditModal';

interface TalentDetailCertificatesSectionProps {
  // Data
  certificates: (TalentCertificate & { certificateTypeName: string })[];
  selectedCertificates: number[];
  setSelectedCertificates: (ids: number[] | ((prev: number[]) => number[])) => void;
  pageCertificates: number;
  setPageCertificates: (page: number) => void;
  itemsPerPage: number;

  // Lookup data
  lookupCertificateTypes: CertificateType[];

  // Inline form
  showInlineForm: boolean;
  inlineCertificateForm: Partial<TalentCertificateCreateModel>;
  setInlineCertificateForm: (form: Partial<TalentCertificateCreateModel> | ((prev: any) => Partial<TalentCertificateCreateModel>)) => void;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: () => void;
  onDelete: () => void;

  // Form errors
  certificateFormErrors: Record<string, string>;
  setCertificateFormErrors: (errors: Record<string, string>) => void;

  // Certificate type selection
  certificateTypeSearch: string;
  setCertificateTypeSearch: (search: string) => void;
  isCertificateTypeDropdownOpen: boolean;
  setIsCertificateTypeDropdownOpen: (open: boolean) => void;

  // File upload
  certificateImageFile: File | null;
  setCertificateImageFile: (file: File | null) => void;
  uploadingCertificateImage: boolean;
  certificateUploadProgress: number;
  uploadedCertificateUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadImage: () => void;
  onDeleteImage: () => void;

  // CV Analysis suggestions
  analysisResult?: CVAnalysisComparisonResponse | null;
  certificatesRecognized: Array<{ suggestion: any; system: CertificateType }>;
  certificatesUnmatched: any[];

  // Permissions
  canEdit: boolean;

  // Validation
  validateIssuedDate: (date: string) => boolean;

  // Refresh
  onRefreshCertificates?: () => void | Promise<void>;
}

/**
 * Component section hiển thị và quản lý chứng chỉ trong Talent Detail page
 */
export function TalentDetailCertificatesSection({
  certificates,
  selectedCertificates,
  setSelectedCertificates,
  pageCertificates,
  setPageCertificates,
  itemsPerPage,
  lookupCertificateTypes,
  showInlineForm,
  inlineCertificateForm,
  setInlineCertificateForm,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
  onDelete,
  certificateFormErrors,
  setCertificateFormErrors,
  certificateTypeSearch,
  setCertificateTypeSearch,
  isCertificateTypeDropdownOpen,
  setIsCertificateTypeDropdownOpen,
  certificateImageFile,
  setCertificateImageFile: _setCertificateImageFile,
  uploadingCertificateImage,
  certificateUploadProgress,
  uploadedCertificateUrl,
  onFileChange,
  onUploadImage,
  onDeleteImage,
  analysisResult: _analysisResult,
  certificatesRecognized,
  certificatesUnmatched,
  canEdit,
  validateIssuedDate,
  onRefreshCertificates,
}: TalentDetailCertificatesSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCertificateId, setEditingCertificateId] = useState<number | null>(null);

  // Filter certificate types
  const filteredCertificateTypes = lookupCertificateTypes.filter((type) => {
    if (!certificateTypeSearch) return true;
    return (
      type.name.toLowerCase().includes(certificateTypeSearch.toLowerCase()) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      {/* CV Analysis Suggestions */}
      {(certificatesRecognized.length > 0 || certificatesUnmatched.length > 0) && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-rose-900 uppercase tracking-wide">Đề xuất chứng chỉ</h3>
            <span className="text-xs text-rose-700">
              {certificatesRecognized.length} đề xuất thêm · {certificatesUnmatched.length} cần tạo mới
            </span>
          </div>
          {(certificatesRecognized.length > 0 || certificatesUnmatched.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-3">
              {certificatesRecognized.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Cần tạo loại chứng chỉ theo tên các chứng chỉ ({certificatesRecognized.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {certificatesRecognized.map(({ suggestion, system }, index) => (
                      <span key={`certificate-recognized-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                        {system.name}
                        {suggestion.issuedDate && <span className="ml-1.5 text-amber-600">· {suggestion.issuedDate}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {certificatesUnmatched.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Cần tạo loại chứng chỉ ({certificatesUnmatched.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {certificatesUnmatched.map((suggestion, index) => (
                      <span key={`certificate-unmatched-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                        {suggestion.certificateName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline Certificate Form */}
      {showInlineForm && (
        <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thêm chứng chỉ mới</h3>
            <button
              onClick={onCloseForm}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Certificate Type */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Loại chứng chỉ <span className="text-red-500">*</span>
              </label>
              {certificateFormErrors.certificateTypeId && (
                <p className="text-xs text-red-600 mb-1">{certificateFormErrors.certificateTypeId}</p>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCertificateTypeDropdownOpen(!isCertificateTypeDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all border-neutral-300 focus:border-primary-500"
                >
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Award className="w-4 h-4 text-neutral-400" />
                    <span>
                      {inlineCertificateForm.certificateTypeId && inlineCertificateForm.certificateTypeId > 0
                        ? lookupCertificateTypes.find((t) => t.id === inlineCertificateForm.certificateTypeId)?.name ||
                          'Chọn loại chứng chỉ'
                        : 'Chọn loại chứng chỉ'}
                    </span>
                  </div>
                </button>
                {isCertificateTypeDropdownOpen && (
                  <div
                    className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                    onMouseLeave={() => {
                      setIsCertificateTypeDropdownOpen(false);
                      setCertificateTypeSearch('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={certificateTypeSearch}
                          onChange={(e) => setCertificateTypeSearch(e.target.value)}
                          placeholder="Tìm loại chứng chỉ..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredCertificateTypes.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại chứng chỉ nào</p>
                      ) : (
                        filteredCertificateTypes.map((type) => (
                          <button
                            type="button"
                            key={type.id}
                            onClick={() => {
                              setInlineCertificateForm({ ...inlineCertificateForm, certificateTypeId: type.id });
                              setIsCertificateTypeDropdownOpen(false);
                              setCertificateTypeSearch('');
                              const newErrors = { ...certificateFormErrors };
                              delete newErrors.certificateTypeId;
                              setCertificateFormErrors(newErrors);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              inlineCertificateForm.certificateTypeId === type.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            {type.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Name */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Tên chứng chỉ <span className="text-red-500">*</span>
              </label>
              {certificateFormErrors.certificateName && (
                <p className="text-xs text-red-600 mb-1">{certificateFormErrors.certificateName}</p>
              )}
              <input
                type="text"
                value={inlineCertificateForm.certificateName || ''}
                onChange={(e) => {
                  setInlineCertificateForm({ ...inlineCertificateForm, certificateName: e.target.value });
                  const newErrors = { ...certificateFormErrors };
                  delete newErrors.certificateName;
                  setCertificateFormErrors(newErrors);
                }}
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-lg bg-white ${
                  certificateFormErrors.certificateName
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                }`}
                placeholder="Nhập tên chứng chỉ"
              />
            </div>

            {/* Issued Date and Image URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày cấp</label>
                <input
                  type="date"
                  value={inlineCertificateForm.issuedDate || ''}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    setInlineCertificateForm({ ...inlineCertificateForm, issuedDate: value });
                    const newErrors = { ...certificateFormErrors };
                    if (value && !validateIssuedDate(value)) {
                      newErrors.issuedDate = '⚠️ Ngày cấp không được là ngày trong tương lai.';
                    } else {
                      delete newErrors.issuedDate;
                    }
                    setCertificateFormErrors(newErrors);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white ${
                    certificateFormErrors.issuedDate
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                />
                {certificateFormErrors.issuedDate && (
                  <p className="text-xs text-red-600 mt-1">{certificateFormErrors.issuedDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">URL hình ảnh</label>
                <input
                  type="url"
                  value={inlineCertificateForm.imageUrl || ''}
                  onChange={(e) => {
                    if (!uploadedCertificateUrl || uploadedCertificateUrl !== inlineCertificateForm.imageUrl) {
                      setInlineCertificateForm({ ...inlineCertificateForm, imageUrl: e.target.value });
                    }
                  }}
                  disabled={!!(inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white ${
                    inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl
                      ? 'bg-gray-100 cursor-not-allowed opacity-75 border-gray-300'
                      : 'border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                  placeholder="https://... hoặc upload từ file ảnh đã chọn"
                />
                {inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    URL này được upload từ Firebase. Để thay đổi, hãy xóa và upload ảnh mới.
                  </p>
                )}
              </div>
            </div>

            {/* Upload Certificate Image */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Upload ảnh chứng chỉ</label>
              <div className="space-y-2">
                {/* File Input */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    disabled={uploadingCertificateImage}
                    className="w-full text-xs py-1.5 px-2 border rounded-lg bg-white border-neutral-300 focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {certificateImageFile && (
                    <div className="flex items-center gap-2 text-xs text-neutral-600 mt-1">
                      <FileText className="w-3 h-3" />
                      <span>
                        Đã chọn: <span className="font-medium">{certificateImageFile.name}</span> (
                        {(certificateImageFile.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadingCertificateImage && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: `${certificateUploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-primary-700 font-medium">
                      Đang upload... {certificateUploadProgress}%
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={onUploadImage}
                  disabled={!certificateImageFile || uploadingCertificateImage}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {uploadingCertificateImage ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload ảnh lên Firebase
                    </>
                  )}
                </button>
              </div>
              {inlineCertificateForm.imageUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={onDeleteImage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs"
                    title={uploadedCertificateUrl === inlineCertificateForm.imageUrl ? 'Xóa URL và file trong Firebase' : 'Xóa URL'}
                  >
                    <X className="w-3.5 h-3.5" />
                    Xóa ảnh
                  </button>
                  <a
                    href={inlineCertificateForm.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem ảnh
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
              <textarea
                value={inlineCertificateForm.certificateDescription || ''}
                onChange={(e) => setInlineCertificateForm({ ...inlineCertificateForm, certificateDescription: e.target.value })}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                placeholder="Nhập mô tả về chứng chỉ..."
              />
            </div>

            {/* Error messages */}
            {(certificateFormErrors.certificateTypeId ||
              certificateFormErrors.certificateName ||
              certificateFormErrors.issuedDate) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {certificateFormErrors.certificateTypeId && (
                  <p className="text-sm text-red-700">{certificateFormErrors.certificateTypeId}</p>
                )}
                {certificateFormErrors.certificateName && (
                  <p className="text-sm text-red-700">{certificateFormErrors.certificateName}</p>
                )}
                {certificateFormErrors.issuedDate && (
                  <p className="text-sm text-red-700">{certificateFormErrors.issuedDate}</p>
                )}
              </div>
            )}

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
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2 ${
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

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Chứng chỉ</h3>
        <div className="flex gap-2">
          {!showInlineForm && (
            <Button
              onClick={onOpenForm}
              disabled={isSubmitting || !canEdit}
              className={`group flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                isSubmitting || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                !canEdit
                  ? 'Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                  : isSubmitting
                    ? 'Đang xử lý...'
                    : 'Thêm chứng chỉ'
              }
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>
          )}
          {selectedCertificates.length > 0 && (
            <Button
              onClick={onDelete}
              disabled={!canEdit}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!canEdit ? 'Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa.' : ''}
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Xóa chứng chỉ ({selectedCertificates.length})
            </Button>
          )}
        </div>
      </div>

      {/* Certificates List */}
      {certificates.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedCertificates.length ===
                          certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage)
                            .length &&
                        certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage).length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentPageItems = certificates
                            .slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage)
                            .map((cert) => cert.id);
                          setSelectedCertificates([...new Set([...selectedCertificates, ...currentPageItems])]);
                        } else {
                          const currentPageItems = certificates
                            .slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage)
                            .map((cert) => cert.id);
                          setSelectedCertificates(selectedCertificates.filter((id) => !currentPageItems.includes(id)));
                        }
                      }}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Loại chứng chỉ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Tên chứng chỉ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Ngày cấp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {certificates
                  .slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage)
                  .map((cert) => (
                    <tr
                      key={cert.id}
                      className="hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        setEditingCertificateId(cert.id);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(cert.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedCertificates([...selectedCertificates, cert.id]);
                            } else {
                              setSelectedCertificates(selectedCertificates.filter((id) => id !== cert.id));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-800">{cert.certificateTypeName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-800">{cert.certificateName || '—'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-primary-700">
                          {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            cert.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {cert.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {cert.imageUrl && (
                          <a
                            href={cert.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Xem
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SectionPagination
            currentPage={pageCertificates}
            totalItems={certificates.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageCertificates}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-lg font-medium">Chưa có chứng chỉ nào</p>
          <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa upload chứng chỉ</p>
        </div>
      )}

      {isEditModalOpen && (
        <TalentCertificateEditModal
          isOpen={isEditModalOpen}
          certificateId={editingCertificateId}
          canEdit={canEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCertificateId(null);
          }}
          onSaved={onRefreshCertificates}
        />
      )}
    </div>
  );
}

