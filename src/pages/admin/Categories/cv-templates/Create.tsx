import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { cvTemplateService, type CVTemplatePayload } from "../../../../services/CVTemplate";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  FileText, 
  Link as LinkIcon,
  Star,
  AlertCircle, 
  CheckCircle,
  X,
  FileCode
} from "lucide-react";

export default function CVTemplateCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [form, setForm] = useState<CVTemplatePayload>({
    name: "",
    templateFilePath: "",
    isDefault: false,
    description: "",
  });

  const validateURL = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Validate URL khi thay đổi templateFilePath
    if (name === 'templateFilePath') {
      if (value.trim() && !validateURL(value)) {
        setUrlError("⚠️ Đường dẫn phải là URL hợp lệ (bắt đầu với http:// hoặc https://)");
      } else {
        setUrlError("");
      }
    }
    
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.name.trim()) {
      setError("⚠️ Vui lòng nhập tên template.");
      setLoading(false);
      return;
    }

    if (!form.templateFilePath.trim()) {
      setError("⚠️ Vui lòng nhập đường dẫn file template.");
      setLoading(false);
      return;
    }

    if (!validateURL(form.templateFilePath)) {
      setError("⚠️ Đường dẫn file template phải là URL hợp lệ (bắt đầu với http:// hoặc https://).");
      setLoading(false);
      return;
    }

    try {
      await cvTemplateService.create(form);
      setSuccess(true);
      setTimeout(() => navigate("/admin/categories/cv-templates"), 1500);
    } catch (err) {
      console.error("❌ Error creating CV Template:", err);
      setError("Không thể tạo CV Template. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/admin/categories/cv-templates"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo CV Template mới</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để tạo mẫu CV mới
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Tạo template mới
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
                  <FileCode className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin template</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tên template */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tên template <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: CV Standard Template, CV Creative Design..."
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                />
              </div>

              {/* Template File Path */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Đường dẫn file template <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="templateFilePath"
                  value={form.templateFilePath}
                  onChange={handleChange}
                  placeholder="VD: https://example.com/templates/cv-standard.docx"
                  required
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 bg-white font-mono ${
                    urlError ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-primary-500'
                  }`}
                />
                {urlError && (
                  <p className="text-xs text-red-600 mt-1">{urlError}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  URL hợp lệ bắt đầu với http:// hoặc https://
                </p>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Mô tả về template này..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                />
              </div>

              {/* Mặc định */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Đặt làm mẫu mặc định
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={form.isDefault}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">
                    {form.isDefault ? "Template mặc định" : "Template tùy chỉnh"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Template mặc định sẽ được sử dụng tự động khi tạo CV mới
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {(error || success) && (
            <div className="animate-fade-in">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    ✅ Tạo CV Template thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to="/admin/categories/cv-templates"
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

