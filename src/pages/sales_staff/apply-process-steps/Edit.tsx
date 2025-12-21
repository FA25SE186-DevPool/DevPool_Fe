import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import Breadcrumb from "../../../components/common/Breadcrumb";
import {
  applyProcessStepService,
  type ApplyProcessStep,
  type ApplyProcessStepCreate,
} from "../../../services/ApplyProcessStep";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import { Button } from "../../../components/ui/button";
import {
  Save,
  X,
  FileText,
  Hash,
  Building2,
  AlertCircle,
} from "lucide-react";

export default function SalesApplyProcessStepEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fromTemplate } = (location.state as { fromTemplate?: string } | null) ?? {};
  const isTemplateLocked = Boolean(fromTemplate);
  const [templates, setTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [templateSteps, setTemplateSteps] = useState<ApplyProcessStep[]>([]);
  const [orderError, setOrderError] = useState("");
  const [showUpdateSuccessOverlay, setShowUpdateSuccessOverlay] = useState(false);
  const [formData, setFormData] = useState<ApplyProcessStepCreate>({
    templateId: 0,
    stepOrder: 1,
    stepName: "",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const step = await applyProcessStepService.getById(Number(id));
        setFormData({
          templateId: step.templateId,
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          description: step.description,
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu bước:", err);
        alert("Không thể tải thông tin bước quy trình!");
      } finally {
        setLoading(false);
      }
    };

    const fetchTemplates = async () => {
      try {
        const templatesData = await applyProcessTemplateService.getAll();
        setTemplates(templatesData);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách templates:", err);
      }
    };

    fetchData();
    fetchTemplates();
  }, [id]);

  useEffect(() => {
    const fetchStepsByTemplate = async () => {
      if (!formData.templateId) {
        setTemplateSteps([]);
        setOrderError("");
        return;
      }
      try {
        setIsCheckingOrder(true);
        const steps = await applyProcessStepService.getAll({
          templateId: formData.templateId,
          excludeDeleted: true,
        });
        setTemplateSteps((steps ?? []) as ApplyProcessStep[]);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách bước theo template:", err);
        setTemplateSteps([]);
      } finally {
        setIsCheckingOrder(false);
      }
    };

    void fetchStepsByTemplate();
  }, [formData.templateId]);

  useEffect(() => {
    if (!formData.templateId) {
      setOrderError("");
      return;
    }
    const currentStepId = Number(id);
    const hasDuplicate = templateSteps.some(
      (step) => step.id !== currentStepId && step.stepOrder === formData.stepOrder,
    );
    setOrderError(hasDuplicate ? "⚠️ Thứ tự bước đã tồn tại trong template này. Vui lòng chọn thứ tự khác." : "");
  }, [formData.stepOrder, templateSteps, id, formData.templateId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["templateId", "stepOrder"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) return;

    if (!formData.templateId || formData.templateId === 0) {
      alert("⚠️ Vui lòng chọn mẫu quy trình trước khi lưu!");
      return;
    }

    if (!formData.stepName.trim()) {
      alert("⚠️ Vui lòng nhập tên bước trước khi lưu!");
      return;
    }
    if (orderError) {
      return;
    }

    try {
      await applyProcessStepService.update(Number(id), formData);
      setShowUpdateSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi navigate
      setTimeout(() => {
        setShowUpdateSuccessOverlay(false);
        navigate(`/sales/apply-process-steps/${id}`, {
          state: fromTemplate ? { fromTemplate } : undefined,
        });
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật bước quy trình!");
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={
              fromTemplate
                ? [
                    { label: "Mẫu quy trình", to: "/sales/apply-process-templates" },
                    { label: "Template", to: fromTemplate },
                    { label: formData.stepName || "Bước", to: `/sales/apply-process-steps/${id}` },
                    { label: "Chỉnh sửa" }
                  ]
                : [
                    { label: "Các bước quy trình", to: "/sales/apply-process-steps" },
                    { label: formData.stepName || "Bước", to: `/sales/apply-process-steps/${id}` },
                    { label: "Chỉnh sửa" }
                  ]
            }
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa bước quy trình</h1>
              <p className="text-neutral-600 mb-4">Cập nhật thông tin bước quy trình tuyển dụng</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Chỉnh sửa bước quy trình</span>
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
                  Mẫu quy trình
                </label>
                <select
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  disabled={isTemplateLocked}
                  className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 ${
                    isTemplateLocked ? "bg-neutral-100 cursor-not-allowed" : "bg-white"
                  }`}
                >
                  <option value="0">-- Chọn mẫu quy trình --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>            
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tên bước
                  </label>
                  <input
                    name="stepName"
                    value={formData.stepName}
                    onChange={handleChange}
                    placeholder="Nhập tên bước..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    name="stepOrder"
                    value={formData.stepOrder}
                    onChange={handleChange}
                    min={1}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                  <p className={`text-xs mt-2 ${orderError ? "text-red-600" : "text-neutral-500"}`}>
                    {orderError ||
                      (isCheckingOrder
                        ? "Đang kiểm tra thứ tự khả dụng..."
                        : "Mỗi bước trong cùng mẫu quy trình phải có thứ tự duy nhất.")}
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
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Nhập mô tả chi tiết về bước quy trình..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/sales/apply-process-steps/${id}`}
              state={fromTemplate ? { fromTemplate } : undefined}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              disabled={!!orderError}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>

      {/* Update Success Overlay */}
      {showUpdateSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật bước quy trình thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
