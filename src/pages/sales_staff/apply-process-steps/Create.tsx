import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import {
  applyProcessStepService,
  type ApplyProcessStepCreate,
  type ApplyProcessStep,
} from "../../../services/ApplyProcessStep";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import {
  ArrowLeft,
  Plus,
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Hash,
  Building2,
} from "lucide-react";

export default function SalesApplyProcessStepCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [isFetchingSteps, setIsFetchingSteps] = useState(false);

  const [form, setForm] = useState({
    templateId: templateIdFromUrl ? Number(templateIdFromUrl) : 0,
    stepOrder: 1,
    stepName: "",
    description: "",
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await applyProcessTemplateService.getAll();
        setTemplates(templatesData);
      } catch (err) {
        console.error("❌ Error loading templates", err);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const fetchStepsForTemplate = async () => {
      if (!form.templateId) {
        setForm((prev) => ({ ...prev, stepOrder: 1 }));
        return;
      }

      try {
        setIsFetchingSteps(true);
        const steps = await applyProcessStepService.getAll({ templateId: form.templateId, excludeDeleted: true });
        const castSteps = (steps ?? []) as ApplyProcessStep[];
        if (castSteps.length === 0) {
          setForm((prev) => ({ ...prev, stepOrder: 1 }));
        } else {
          const takenOrders = new Set(castSteps.map((step) => step.stepOrder).filter((n) => n > 0));
          let candidate = 1;
          while (takenOrders.has(candidate)) {
            candidate += 1;
          }
          setForm((prev) => ({ ...prev, stepOrder: candidate }));
        }
      } catch (err) {
        console.error("❌ Error loading steps for template", err);
        setForm((prev) => ({ ...prev, stepOrder: 1 }));
      } finally {
        setIsFetchingSteps(false);
      }
    };

    void fetchStepsForTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.templateId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "templateId") {
      setForm((prev) => ({ ...prev, templateId: Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo bước quy trình mới không?");
    if (!confirmed) return;

    if (!form.templateId || form.templateId === 0) {
      setError("⚠️ Vui lòng chọn mẫu quy trình.");
      return;
    }

    if (!form.stepName.trim()) {
      setError("⚠️ Vui lòng nhập tên bước.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload: ApplyProcessStepCreate = {
        templateId: Number(form.templateId),
        stepOrder: Number(form.stepOrder),
        stepName: form.stepName,
        description: form.description,
      };

      await applyProcessStepService.create(payload);
      setSuccess(true);
      const redirectPath = form.templateId
        ? `/sales/apply-process-templates/${form.templateId}`
        : "/sales/apply-process-steps";
      setTimeout(() => navigate(redirectPath), 1200);
    } catch (err) {
      console.error("❌ Error creating Apply Process Step:", err);
      setError("Không thể tạo bước quy trình. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to={form.templateId ? `/sales/apply-process-templates/${form.templateId}` : "/sales/apply-process-steps"}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">
                {form.templateId ? "Quay lại chi tiết mẫu quy trình" : "Quay lại danh sách"}
              </span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo bước quy trình mới</h1>
              <p className="text-neutral-600 mb-4">Nhập thông tin chi tiết để tạo bước quy trình tuyển dụng</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">Tạo bước quy trình mới</span>
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
                  <Building2 className="w-4 h-4" />
                  Mẫu quy trình <span className="text-red-500">*</span>
                </label>
                <select
                  name="templateId"
                  value={form.templateId}
                  onChange={handleChange}
                  disabled={!!templateIdFromUrl}
                  className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 ${
                    templateIdFromUrl ? "bg-neutral-100 cursor-not-allowed" : "bg-white"
                  }`}
                  required
                >
                  <option value="0">-- Chọn mẫu quy trình --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id.toString()}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tên bước <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="stepName"
                    value={form.stepName}
                    onChange={handleChange}
                    placeholder="VD: Sàng lọc CV ban đầu"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Thứ tự <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stepOrder"
                    value={form.stepOrder}
                    onChange={handleChange}
                    min={1}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    {isFetchingSteps ? "Đang tính toán thứ tự kế tiếp..." : "Thứ tự được xác định tự động."}
                  </p>
                </div>

              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Mô tả</h3>
              </div>
            </div>
            <div className="p-6">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                placeholder="Nhập mô tả chi tiết về bước quy trình này..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
              />
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
                  <p className="text-green-700 font-medium">✅ Tạo bước quy trình thành công! Đang chuyển hướng...</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={form.templateId ? `/sales/apply-process-templates/${form.templateId}` : "/sales/apply-process-steps"}
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
                  Tạo bước quy trình
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
