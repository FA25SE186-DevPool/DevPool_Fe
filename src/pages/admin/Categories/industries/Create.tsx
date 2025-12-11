import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { industryService, type IndustryPayload } from "../../../../services/Industry";
import { 
  Briefcase, 
  FileText, 
  ArrowLeft, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle,
  X
} from "lucide-react";

export default function CreateIndustry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<IndustryPayload>({
    name: "",
    code: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 🔁 Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 💾 Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.name.trim() || !form.code.trim()) {
      setError("⚠️ Vui lòng nhập đầy đủ Tên và Mã lĩnh vực!");
      return;
    }

    try {
      setLoading(true);
      await industryService.create(form);
      setSuccess(true);
      setTimeout(() => navigate("/admin/categories/industries"), 1500);
    } catch (err) {
      console.error("❌ Lỗi tạo lĩnh vực:", err);
      setError("Không thể tạo lĩnh vực. Vui lòng thử lại.");
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
              to="/admin/categories/industries"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo lĩnh vực mới</h1>
              <p className="text-neutral-600 mb-4">
                Thêm lĩnh vực kinh doanh vào hệ thống DevPool
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Tạo lĩnh vực mới
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
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin lĩnh vực</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tên lĩnh vực */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Tên lĩnh vực <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder="VD: Công nghệ thông tin, Tài chính..."
                />
              </div>

              {/* Mã lĩnh vực */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mã lĩnh vực <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder="VD: IT, FIN, EDU..."
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                  placeholder="Nhập mô tả ngắn về lĩnh vực..."
                />
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
                    ✅ Tạo lĩnh vực thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to="/admin/categories/industries"
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
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo lĩnh vực
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

