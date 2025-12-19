import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Plus, Save, FileText, AlertCircle, CheckCircle, X } from "lucide-react";

export default function SalesApplyProcessTemplateCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo mẫu quy trình mới không?");
    if (!confirmed) return;

    if (!form.name.trim()) {
      setError("⚠️ Vui lòng nhập tên template!");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await applyProcessTemplateService.create({
        name: form.name,
        description: form.description || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/sales/apply-process-templates"), 1200);
    } catch (err) {
      console.error("❌ Error creating Apply Process Template:", err);
      setError("Không thể tạo template. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Mẫu quy trình", to: "/sales/apply-process-templates" },
              { label: "Thêm mới" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo mẫu quy trình mới</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin để tạo mẫu quy trình tuyển dụng
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">Tạo mẫu mới</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tên mẫu quy trình <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: Quy trình Onboarding khách hàng A"
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả
                </label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Nhập mô tả chi tiết về mẫu quy trình..."
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

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
                  <p className="text-green-700 font-medium">✅ Tạo template thành công! Đang chuyển hướng...</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <Link
              to="/sales/apply-process-templates"
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
