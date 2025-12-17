import { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, CheckCircle, ExternalLink, FileText, Save, Search, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { talentCertificateService, type TalentCertificateCreate } from '../../../services/TalentCertificate';
import { certificateTypeService, type CertificateType } from '../../../services/CertificateType';
import { uploadFile } from '../../../utils/firebaseStorage';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from '../../../config/firebase';

export interface TalentCertificateEditModalProps {
  isOpen: boolean;
  certificateId: number | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

export function TalentCertificateEditModal({
  isOpen,
  certificateId,
  canEdit,
  onClose,
  onSaved,
}: TalentCertificateEditModalProps) {
  const [allCertificateTypes, setAllCertificateTypes] = useState<CertificateType[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentCertificateCreate>({
    talentId: 0,
    certificateTypeId: 0,
    certificateName: '',
    certificateDescription: '',
    issuedDate: '',
    isVerified: false,
    imageUrl: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Dropdown state
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState(false);
  const [certificateTypeSearch, setCertificateTypeSearch] = useState('');

  // Firebase upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const filteredCertificateTypes = useMemo(() => {
    if (!certificateTypeSearch) return allCertificateTypes;
    const q = certificateTypeSearch.toLowerCase();
    return allCertificateTypes.filter((ct) => ct.name.toLowerCase().includes(q));
  }, [allCertificateTypes, certificateTypeSearch]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Click-outside for dropdown
  useEffect(() => {
    if (!isCertificateTypeDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.certificate-type-dropdown-container')) {
        setIsCertificateTypeDropdownOpen(false);
        setCertificateTypeSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCertificateTypeDropdownOpen]);

  // Extract Firebase path from download URL
  const extractFirebasePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) return decodeURIComponent(pathMatch[1]);
      return null;
    } catch {
      return null;
    }
  };

  // Load certificate types
  useEffect(() => {
    if (!isOpen) return;
    const fetchCertificateTypes = async () => {
      try {
        const types = await certificateTypeService.getAll({ excludeDeleted: true });
        setAllCertificateTypes(types);
      } catch (err) {
        console.error('❌ Lỗi tải danh sách loại chứng chỉ:', err);
      }
    };
    fetchCertificateTypes();
  }, [isOpen]);

  // Load certificate data
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !certificateId) return;
      setLoading(true);
      try {
        const data = await talentCertificateService.getById(Number(certificateId));
        setFormData({
          talentId: data.talentId,
          certificateTypeId: data.certificateTypeId,
          certificateName: data.certificateName || '',
          certificateDescription: data.certificateDescription || '',
          issuedDate: data.issuedDate ? data.issuedDate.split('T')[0] : '',
          isVerified: !!data.isVerified,
          imageUrl: data.imageUrl || '',
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu chứng chỉ:', err);
        alert('Không thể tải thông tin chứng chỉ!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, certificateId]);

  // Initialize uploadedImageUrl if current imageUrl is Firebase
  useEffect(() => {
    if (!formData.imageUrl) {
      setUploadedImageUrl(null);
      return;
    }
    const firebasePath = extractFirebasePath(formData.imageUrl);
    if (firebasePath) setUploadedImageUrl(formData.imageUrl);
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'imageUrl') {
      setUploadedImageUrl(null);
      setImageLoadError(false);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('⚠️ Vui lòng chọn file ảnh (jpg, png, gif, etc.)');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ Kích thước file không được vượt quá 10MB');
      e.target.value = '';
      return;
    }
    setSelectedImageFile(file);
    setImageLoadError(false);
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      alert('Vui lòng chọn file ảnh trước!');
      return;
    }
    if (!talentId || talentId === 0) {
      alert('⚠️ Không tìm thấy ID nhân sự.');
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload ảnh "${selectedImageFile.name}" lên Firebase không?\n\n` +
        `Kích thước file: ${(selectedImageFile.size / 1024).toFixed(2)} KB`
    );
    if (!confirmed) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const timestamp = Date.now();
      const sanitizedFileName = selectedImageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const fileName = `cert_${talentId}_${timestamp}_${sanitizedFileName}`;
      const filePath = `certificates/${fileName}`;
      const downloadURL = await uploadFile(selectedImageFile, filePath, (progress) => setUploadProgress(progress));
      setFormData((prev) => ({ ...prev, imageUrl: downloadURL }));
      setUploadedImageUrl(downloadURL);
      setSelectedImageFile(null);
      setImageLoadError(false);
      alert('✅ Upload ảnh chứng chỉ thành công!');
    } catch (err: any) {
      console.error('❌ Error uploading certificate image:', err);
      alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async () => {
    const currentUrl = formData.imageUrl;
    if (!currentUrl) return;

    const uploadedUrl = uploadedImageUrl;
    if (!uploadedUrl || uploadedUrl !== currentUrl) {
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
      setUploadedImageUrl(null);
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Bạn có chắc chắn muốn xóa ảnh chứng chỉ này?\n\n' +
        'File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n' +
        'Bạn có muốn tiếp tục không?'
    );
    if (!confirmed) return;

    try {
      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
      setUploadedImageUrl(null);
      setSelectedImageFile(null);
      setImageLoadError(false);
      alert('✅ Đã xóa ảnh chứng chỉ thành công!');
    } catch (err: any) {
      console.error('❌ Error deleting certificate image:', err);
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
      setUploadedImageUrl(null);
      alert('⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId) return;
    if (!canEdit) return;

    const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
    if (!confirmed) return;

    if (!formData.certificateTypeId || formData.certificateTypeId === 0) {
      alert('⚠️ Vui lòng chọn loại chứng chỉ trước khi lưu!');
      return;
    }
    if (!formData.certificateName || formData.certificateName.trim() === '') {
      alert('⚠️ Vui lòng nhập tên chứng chỉ trước khi lưu!');
      return;
    }
    if (formData.certificateName.length > 255) {
      alert('⚠️ Tên chứng chỉ không được vượt quá 255 ký tự!');
      return;
    }
    if (formData.certificateDescription && formData.certificateDescription.length > 1000) {
      alert('⚠️ Mô tả chứng chỉ không được vượt quá 1000 ký tự!');
      return;
    }
    const imageUrl = (formData.imageUrl || '').trim();
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
      } catch {
        alert('⚠️ URL hình ảnh không hợp lệ!');
        return;
      }
    }

    setSaving(true);
    try {
      await talentCertificateService.update(Number(certificateId), {
        ...formData,
        imageUrl: imageUrl || '',
        issuedDate: formData.issuedDate ? formData.issuedDate : undefined,
      });
      alert('✅ Cập nhật chứng chỉ thành công!');
      await onSaved?.();
      onClose();
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật chứng chỉ:', err);
      alert('Không thể cập nhật chứng chỉ!');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa chứng chỉ</h3>
              <p className="text-xs text-neutral-500" title={formData.certificateName || undefined}>
                {formData.certificateName?.trim() ? formData.certificateName : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!canEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>Bạn không có quyền chỉnh sửa chứng chỉ này.</span>
                </div>
              )}

              {/* Loại chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Loại chứng chỉ <span className="text-red-500">*</span>
                </label>
                <div className="relative certificate-type-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsCertificateTypeDropdownOpen((prev) => !prev)}
                    className="w-full h-10 flex items-center justify-between px-3 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all border-neutral-300"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Award className="w-4 h-4 text-neutral-400" />
                      <span className={formData.certificateTypeId ? 'text-neutral-800' : 'text-neutral-500'}>
                        {formData.certificateTypeId
                          ? allCertificateTypes.find((ct) => ct.id === formData.certificateTypeId)?.name || 'Chọn loại chứng chỉ'
                          : 'Chọn loại chứng chỉ'}
                      </span>
                    </div>
                    <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                  </button>
                  {isCertificateTypeDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={certificateTypeSearch}
                            onChange={(e) => setCertificateTypeSearch(e.target.value)}
                            placeholder="Tìm loại chứng chỉ..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredCertificateTypes.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại chứng chỉ phù hợp</p>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, certificateTypeId: 0 }));
                                setCertificateTypeSearch('');
                                setIsCertificateTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                !formData.certificateTypeId
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Chọn loại chứng chỉ
                            </button>
                            {filteredCertificateTypes.map((certType) => (
                              <button
                                key={certType.id}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, certificateTypeId: certType.id }));
                                  setCertificateTypeSearch('');
                                  setIsCertificateTypeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  formData.certificateTypeId === certType.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {certType.name}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tên chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tên chứng chỉ <span className="text-red-500">*</span>
                </label>
                <Input
                  name="certificateName"
                  value={formData.certificateName}
                  onChange={handleChange}
                  disabled={!canEdit}
                  maxLength={255}
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  placeholder="Nhập tên chứng chỉ"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả chứng chỉ (tùy chọn)
                </label>
                <textarea
                  name="certificateDescription"
                  value={formData.certificateDescription || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  maxLength={1000}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none disabled:bg-neutral-50"
                  placeholder="Nhập mô tả về chứng chỉ..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ngày cấp */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày cấp (tùy chọn)
                  </label>
                  <Input
                    type="date"
                    name="issuedDate"
                    value={formData.issuedDate}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>

                {/* Trạng thái xác thực */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Trạng thái xác thực
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={!!formData.isVerified}
                      onChange={handleChange}
                      disabled={!canEdit}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700">{formData.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                  </div>
                </div>
              </div>

              {/* Ảnh chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  URL hình ảnh chứng chỉ (tùy chọn)
                </label>

                <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Upload className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-700">Upload Ảnh Chứng Chỉ</div>
                  </div>

                  {(selectedImageFile || formData.imageUrl) && (
                    <div className="relative w-full max-w-xs mx-auto mb-3">
                      <div className="aspect-video bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300 overflow-hidden flex items-center justify-center">
                        {selectedImageFile ? (
                          <img
                            src={URL.createObjectURL(selectedImageFile)}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={() => setImageLoadError(true)}
                          />
                        ) : formData.imageUrl && !imageLoadError ? (
                          <img
                            src={formData.imageUrl}
                            alt="Certificate"
                            className="w-full h-full object-contain"
                            onError={() => setImageLoadError(true)}
                          />
                        ) : (
                          <div className="text-neutral-400 text-sm flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8" />
                            <span>Không thể tải ảnh</span>
                          </div>
                        )}
                      </div>
                      {selectedImageFile && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-neutral-600">
                            <span className="font-medium">{selectedImageFile.name}</span> ({(selectedImageFile.size / 1024).toFixed(2)} KB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {uploading && (
                    <div className="space-y-2 mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-primary-700 font-medium">Đang upload... {uploadProgress}%</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl transition-all ${
                        !canEdit || uploading || uploadedImageUrl
                          ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                          : 'border-primary-300 bg-white hover:border-primary-500 hover:bg-primary-50 cursor-pointer'
                      }`}
                    >
                      <Upload className={`w-5 h-5 ${!canEdit || uploading || uploadedImageUrl ? 'text-neutral-400' : 'text-primary-600'}`} />
                      <span className={`text-sm font-medium ${!canEdit || uploading || uploadedImageUrl ? 'text-neutral-400' : 'text-neutral-700'}`}>
                        {selectedImageFile ? 'Chọn file khác' : 'Chọn file ảnh'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!canEdit || uploading || !!uploadedImageUrl}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={!canEdit || !selectedImageFile || uploading || !!uploadedImageUrl}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload lên Firebase
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      disabled={!canEdit || uploading || uploadedImageUrl === formData.imageUrl}
                      placeholder="https://example.com/certificate-image.jpg hoặc tự động từ Firebase"
                      className={`flex-1 ${
                        uploadedImageUrl === formData.imageUrl ? 'border-green-300 bg-green-50' : 'border-neutral-200 focus:border-primary-500'
                      }`}
                    />
                    {formData.imageUrl && (
                      <>
                        <a
                          href={formData.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-3 bg-primary-100 text-primary-700 rounded-xl hover:bg-primary-200 transition-all text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Xem
                        </a>
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={!canEdit || uploading}
                          className="flex items-center gap-1.5 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          title={uploadedImageUrl === formData.imageUrl ? 'Xóa URL và file trong Firebase' : 'Xóa URL'}
                        >
                          <X className="w-4 h-4" />
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform bg-white font-medium"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Hủy
                </button>
                <Button
                  type="submit"
                  disabled={saving || !canEdit}
                  className={`group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                    saving || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


