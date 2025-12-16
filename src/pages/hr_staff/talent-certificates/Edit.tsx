import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentCertificateService, type TalentCertificateCreate } from "../../../services/TalentCertificate";
import { certificateTypeService, type CertificateType } from "../../../services/CertificateType";
import { uploadFile } from "../../../utils/firebaseStorage";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../../../config/firebase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  Award, 
  Calendar,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  Search
} from "lucide-react";

function TalentCertificateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allCertificateTypes, setAllCertificateTypes] = useState<CertificateType[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentCertificateCreate>({
    talentId: 0,
    certificateTypeId: 0,
    certificateName: "",
    certificateDescription: "",
    issuedDate: "",
    isVerified: false,
    imageUrl: "",
  });

  const [loading, setLoading] = useState(true);

  // State cho certificate type dropdown
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState(false);
  const [certificateTypeSearch, setCertificateTypeSearch] = useState("");

  // Firebase upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // 🧭 Load dữ liệu Talent Certificate
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentCertificateService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          certificateTypeId: data.certificateTypeId,
          certificateName: data.certificateName || "",
          certificateDescription: data.certificateDescription || "",
          issuedDate: data.issuedDate ? data.issuedDate.split('T')[0] : "", // Convert to date format
          isVerified: data.isVerified,
          imageUrl: data.imageUrl,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin chứng chỉ!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Certificate Types
  useEffect(() => {
    const fetchCertificateTypes = async () => {
      try {
        const certificateTypes = await certificateTypeService.getAll({ excludeDeleted: true });
        setAllCertificateTypes(certificateTypes);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách loại chứng chỉ:", err);
      }
    };
    fetchCertificateTypes();
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCertificateTypeDropdownOpen && !target.closest('.certificate-type-dropdown-container')) {
        setIsCertificateTypeDropdownOpen(false);
      }
    };

    if (isCertificateTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCertificateTypeDropdownOpen]);

  // Extract Firebase Storage path from download URL
  const extractFirebasePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        // Decode the path (Firebase encodes spaces and special chars)
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        alert("⚠️ Vui lòng chọn file ảnh (jpg, png, gif, etc.)");
        e.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("⚠️ Kích thước file không được vượt quá 10MB");
        e.target.value = '';
        return;
      }

      setSelectedImageFile(file);
      setImageLoadError(false); // Reset lỗi khi chọn file mới
    }
  };

  // Handle image upload to Firebase
  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      alert("Vui lòng chọn file ảnh trước!");
      return;
    }

    if (!talentId || talentId === 0) {
      alert("⚠️ Không tìm thấy ID nhân sự.");
      return;
    }

    // Xác nhận trước khi upload
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload ảnh "${selectedImageFile.name}" lên Firebase không?\n\n` +
      `Kích thước file: ${(selectedImageFile.size / 1024).toFixed(2)} KB`
    );

    if (!confirmed) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to certificates folder
      const timestamp = Date.now();
      const sanitizedFileName = selectedImageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const fileName = `cert_${talentId}_${timestamp}_${sanitizedFileName}`;
      const filePath = `certificates/${fileName}`;

      const downloadURL = await uploadFile(
        selectedImageFile,
        filePath,
        (progress) => setUploadProgress(progress)
      );

      // Update form with the download URL
      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      setUploadedImageUrl(downloadURL);

      // Clear the file from state after successful upload
      setSelectedImageFile(null);
      setImageLoadError(false); // Reset lỗi khi upload thành công
      if (document.getElementById('certificate-image-input') as HTMLInputElement) {
        (document.getElementById('certificate-image-input') as HTMLInputElement).value = '';
      }

      alert("✅ Upload ảnh chứng chỉ thành công!");
    } catch (err: any) {
      console.error("❌ Error uploading certificate image:", err);
      alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete image from Firebase
  const handleDeleteImage = async () => {
    const currentUrl = formData.imageUrl;
    if (!currentUrl) {
      return;
    }

    const uploadedUrl = uploadedImageUrl;
    if (!uploadedUrl || uploadedUrl !== currentUrl) {
      // URL không phải từ Firebase upload, chỉ cần xóa URL
      setFormData(prev => ({ ...prev, imageUrl: "" }));
      setUploadedImageUrl(null);
      return;
    }

    // Xác nhận xóa file từ Firebase
    const confirmed = window.confirm(
      "⚠️ Bạn có chắc chắn muốn xóa ảnh chứng chỉ này?\n\n" +
      "File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
      "Bạn có muốn tiếp tục không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }

      // Xóa URL khỏi form
      setFormData(prev => ({ ...prev, imageUrl: "" }));
      setUploadedImageUrl(null);
      setSelectedImageFile(null);
      setImageLoadError(false); // Reset lỗi khi xóa
      if (document.getElementById('certificate-image-input') as HTMLInputElement) {
        (document.getElementById('certificate-image-input') as HTMLInputElement).value = '';
      }

      alert("✅ Đã xóa ảnh chứng chỉ thành công!");
    } catch (err: any) {
      console.error("❌ Error deleting certificate image:", err);
      // Vẫn xóa URL khỏi form dù không xóa được file
      setFormData(prev => ({ ...prev, imageUrl: "" }));
      setUploadedImageUrl(null);
      alert("⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.");
    }
  };

  // Khởi tạo uploadedImageUrl nếu imageUrl là URL Firebase
  useEffect(() => {
    if (formData.imageUrl) {
      const firebasePath = extractFirebasePath(formData.imageUrl);
      if (firebasePath) {
        setUploadedImageUrl(formData.imageUrl);
      }
    }
  }, [formData.imageUrl]);

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Nếu user nhập URL thủ công, reset flag Firebase upload
    if (name === "imageUrl") {
      setUploadedImageUrl(null);
      setImageLoadError(false); // Reset lỗi khi thay đổi URL
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === "certificateTypeId" ? Number(value) : value,
    }));
  };

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!formData.certificateTypeId || formData.certificateTypeId === 0) {
      alert("⚠️ Vui lòng chọn loại chứng chỉ trước khi lưu!");
      return;
    }

    if (!formData.certificateName || formData.certificateName.trim() === "") {
      alert("⚠️ Vui lòng nhập tên chứng chỉ trước khi lưu!");
      return;
    }

    if (formData.certificateName.length > 255) {
      alert("⚠️ Tên chứng chỉ không được vượt quá 255 ký tự!");
      return;
    }

    if (formData.certificateDescription && formData.certificateDescription.length > 1000) {
      alert("⚠️ Mô tả chứng chỉ không được vượt quá 1000 ký tự!");
      return;
    }

    const imageUrl = formData.imageUrl.trim();

    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("invalid protocol");
        }
      } catch {
        alert("⚠️ URL hình ảnh không hợp lệ!");
        return;
      }
    }

    try {
      console.log("Payload gửi đi:", formData);
      await talentCertificateService.update(Number(id), {
        ...formData,
        imageUrl: imageUrl || "",
        issuedDate: formData.issuedDate ? formData.issuedDate : undefined,
      });

      alert("✅ Cập nhật chứng chỉ thành công!");
      navigate(`/ta/developers/${talentId}`, { state: { tab: 'certificates' } });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật chứng chỉ!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/developers" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/developers/${talentId}` },
              { label: "Chỉnh sửa chứng chỉ" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa chứng chỉ</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin chứng chỉ của talent
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa chứng chỉ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Award className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin chứng chỉ</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Loại chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Loại chứng chỉ <span className="text-red-500">*</span>
                </label>
                <div className="relative certificate-type-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsCertificateTypeDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Award className="w-4 h-4 text-neutral-400" />
                      <span className={formData.certificateTypeId ? "text-neutral-800" : "text-neutral-500"}>
                        {formData.certificateTypeId
                          ? allCertificateTypes.find(ct => ct.id === formData.certificateTypeId)?.name || "Chọn loại chứng chỉ"
                          : "Chọn loại chứng chỉ"}
                      </span>
                    </div>
                    <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                  </button>
                  {isCertificateTypeDropdownOpen && (
                    <div 
                      className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setIsCertificateTypeDropdownOpen(false);
                        setCertificateTypeSearch("");
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
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {(() => {
                          const filtered = certificateTypeSearch
                            ? allCertificateTypes.filter(ct =>
                              ct.name.toLowerCase().includes(certificateTypeSearch.toLowerCase())
                            )
                            : allCertificateTypes;

                          if (filtered.length === 0) {
                            return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại chứng chỉ phù hợp</p>;
                          }

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, certificateTypeId: 0 }));
                                  setCertificateTypeSearch("");
                                  setIsCertificateTypeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  !formData.certificateTypeId
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                Chọn loại chứng chỉ
                              </button>
                              {filtered.map(certType => (
                                <button
                                  type="button"
                                  key={certType.id}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, certificateTypeId: certType.id }));
                                    setCertificateTypeSearch("");
                                    setIsCertificateTypeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    formData.certificateTypeId === certType.id
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  {certType.name}
                                </button>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                {formData.certificateTypeId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Đã chọn: <span className="font-medium text-neutral-700">
                      {allCertificateTypes.find(ct => ct.id === formData.certificateTypeId)?.name || "Không xác định"}
                    </span>
                  </p>
                )}
              </div>

              {/* Tên chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tên chứng chỉ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="certificateName"
                  value={formData.certificateName}
                  onChange={handleChange}
                  maxLength={255}
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  placeholder="Nhập tên chứng chỉ"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Tối đa 255 ký tự
                </p>
              </div>

              {/* Mô tả chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả chứng chỉ (tùy chọn)
                </label>
                <textarea
                  name="certificateDescription"
                  value={formData.certificateDescription || ""}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                  placeholder="Nhập mô tả về chứng chỉ..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Tối đa 1000 ký tự
                </p>
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
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Để trống nếu chưa có ngày cấp cụ thể
                  </p>
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
                      checked={formData.isVerified}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">
                      {formData.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Đánh dấu nếu chứng chỉ đã được xác thực
                  </p>
                </div>
              </div>

              {/* URL hình ảnh */}
              <div>
                <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  URL hình ảnh chứng chỉ (tùy chọn)
                </label>
                
                {/* File upload section */}
                <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Upload className="w-4 h-4 text-primary-600" />
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">
                      Upload Ảnh Chứng Chỉ
                    </label>
                  </div>

                  <div className="space-y-3">
                    {/* Image Preview */}
                    {(selectedImageFile || formData.imageUrl) && (
                      <div className="relative w-full max-w-xs mx-auto">
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

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-center text-primary-700 font-medium">
                          Đang upload... {uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* File Input and Upload Button */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label
                        htmlFor="certificate-image-input"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          uploading || uploadedImageUrl
                            ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                            : 'border-primary-300 bg-white hover:border-primary-500 hover:bg-primary-50'
                        }`}
                      >
                        <Upload className={`w-5 h-5 ${uploading || uploadedImageUrl ? 'text-neutral-400' : 'text-primary-600'}`} />
                        <span className={`text-sm font-medium ${uploading || uploadedImageUrl ? 'text-neutral-400' : 'text-neutral-700'}`}>
                          {selectedImageFile ? 'Chọn file khác' : 'Chọn file ảnh'}
                        </span>
                      </label>
                      <input
                        id="certificate-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading || !!uploadedImageUrl}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={!selectedImageFile || uploading || !!uploadedImageUrl}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                    {uploadedImageUrl && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          File đã được upload lên Firebase, không thể upload lại
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* URL Input */}
                <div className="space-y-2">
                  {formData.imageUrl && uploadedImageUrl === formData.imageUrl && (
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700 flex items-center gap-1.5">
                        <span className="font-semibold">🔒</span>
                        <span>URL này đã được upload từ Firebase và đã bị khóa. Không thể chỉnh sửa trực tiếp. Để nhập URL thủ công, bạn PHẢI nhấn nút "Xóa" để xóa file trong Firebase trước.</span>
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/certificate-image.jpg hoặc tự động từ Firebase"
                      className={`flex-1 ${
                        uploadedImageUrl === formData.imageUrl 
                          ? 'border-green-300 bg-green-50 cursor-not-allowed' 
                          : 'border-neutral-200 focus:border-primary-500'
                      }`}
                      readOnly={uploading || uploadedImageUrl === formData.imageUrl}
                    />
                    {formData.imageUrl && (
                      <>
                        <a
                          href={formData.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-3 bg-primary-100 text-primary-700 rounded-xl hover:bg-primary-200 transition-all text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Xem
                        </a>
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={uploading}
                          className="flex items-center gap-1.5 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          title={uploadedImageUrl === formData.imageUrl ? "Xóa URL và file trong Firebase" : "Xóa URL"}
                        >
                          <X className="w-4 h-4" />
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                  {!uploadedImageUrl && !formData.imageUrl && (
                    <p className="text-xs text-neutral-500">
                      Nhập URL nếu muốn đính kèm hình ảnh chứng chỉ hoặc upload từ file
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/developers/${talentId}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TalentCertificateEditPage;
