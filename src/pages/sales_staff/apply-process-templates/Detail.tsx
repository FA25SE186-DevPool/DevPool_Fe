import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { jobRequestService } from "../../../services/JobRequest";
import { Button } from "../../../components/ui/button";
import {
  Edit,
  Trash2,
  FileText,
  XCircle,
  AlertCircle,
  Plus,
  ListTodo,
} from "lucide-react";

export default function SalesApplyProcessTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ApplyProcessTemplate | null>(null);
  const [steps, setSteps] = useState<ApplyProcessStep[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isTemplateInUse, setIsTemplateInUse] = useState(false);
  const [templateUsageCount, setTemplateUsageCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const templateData = await applyProcessTemplateService.getById(Number(id));
        setTemplate(templateData);

        try {
          const stepsData = (await applyProcessStepService.getAll({ templateId: Number(id) })) as ApplyProcessStep[];
          const sorted = [...(stepsData ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
          setSteps(sorted);
        } catch (err) {
          console.error("❌ Lỗi tải steps:", err);
          setSteps([]);
        }

        // Kiểm tra xem template có đang được sử dụng không
        try {
          const jobRequests = await jobRequestService.getAll({
            applyProcessTemplateId: Number(id),
            excludeDeleted: true
          });

          let jobRequestCount = 0;
          if (Array.isArray(jobRequests)) {
            jobRequestCount = jobRequests.length;
          } else if (jobRequests?.data && Array.isArray(jobRequests.data)) {
            jobRequestCount = jobRequests.data.length;
          } else if (jobRequests?.items && Array.isArray(jobRequests.items)) {
            jobRequestCount = jobRequests.items.length;
          }

          setIsTemplateInUse(jobRequestCount > 0);
          setTemplateUsageCount(jobRequestCount);
        } catch (err) {
          console.error("❌ Lỗi kiểm tra job requests:", err);
          setIsTemplateInUse(false);
          setTemplateUsageCount(0);
        }
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết Apply Process Template:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa template này?");
    if (!confirm) return;

    try {
      await applyProcessTemplateService.delete(Number(id));
      alert("Đã xóa template thành công!");
      navigate("/sales/apply-process-templates");
    } catch (err: any) {
      console.error("❌ Lỗi khi xóa:", err);

      // Handle InvalidOperationException from backend
      if (err?.response?.status === 400 && err?.response?.data?.title?.includes("InvalidOperationException")) {
        const errorMessage = err.response.data.detail || "Không thể xóa template này vì đang được sử dụng bởi các job request hoặc apply process steps.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      alert("Không thể xóa template!");
    }
  };

  const handleDeleteSelectedSteps = async () => {
    if (selectedSteps.length === 0) {
      alert("⚠️ Vui lòng chọn ít nhất một bước để xóa!");
      return;
    }

    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedSteps.length} bước đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedSteps.map((stepId) => applyProcessStepService.deleteById(stepId)));
      alert("Đã xóa các bước thành công!");
      const remainingSteps = steps
        .filter((step) => !selectedSteps.includes(step.id))
        .sort((a, b) => a.stepOrder - b.stepOrder);
      await reindexSteps(remainingSteps);
      setSelectedSteps([]);
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa các bước!");
    }
  };

  const reindexSteps = async (orderedSteps: ApplyProcessStep[]) => {
    try {
      await Promise.all(
        orderedSteps.map((step, index) => {
          const targetOrder = index + 1;
          if (step.stepOrder === targetOrder) {
            return Promise.resolve();
          }
          return applyProcessStepService.update(step.id, {
            stepName: step.stepName,
            description: step.description,
            stepOrder: targetOrder,
            templateId: step.templateId ?? template?.id ?? Number(id),
          });
        })
      );
      setSteps(orderedSteps.map((step, index) => ({ ...step, stepOrder: index + 1 })));
    } catch (err) {
      console.error("❌ Lỗi cập nhật lại thứ tự bước:", err);
      alert("Không thể cập nhật lại thứ tự bước sau khi xóa!");
      setSteps(orderedSteps.map((step, index) => ({ ...step, stepOrder: index + 1 })));
    }
  };

  const toggleStepSelection = (stepId: number) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((item) => item !== stepId) : [...prev, stepId]
    );
  };

  const handleEdit = () => {
    navigate(`/sales/apply-process-templates/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy template</p>
            <Link
              to="/sales/apply-process-templates"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
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
            items={[
              { label: "Mẫu quy trình", to: "/sales/apply-process-templates" },
              { label: template.name }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
              <p className="text-neutral-600 mb-4">Thông tin chi tiết template quy trình tuyển dụng</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <FileText className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">Template #{template.id}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isTemplateInUse}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft transform ${
                  isTemplateInUse
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'hover:shadow-glow hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                }`}
                title={isTemplateInUse ? `Không thể xóa vì đang được sử dụng trong ${templateUsageCount} yêu cầu tuyển dụng` : 'Xóa template này'}
              >
                <Trash2 className={`w-4 h-4 ${isTemplateInUse ? '' : 'group-hover:scale-110'} transition-transform duration-300`} />
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === 'info'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === 'steps'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <ListTodo className="w-4 h-4" />
                Các bước quy trình
                {steps.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                    {steps.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: Thông tin chung */}
            {activeTab === 'info' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem label="Tên Template" value={template.name} icon={<FileText className="w-4 h-4" />} />
                  {template.description && (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-neutral-500 text-sm font-medium">Mô tả</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{template.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Các bước quy trình */}
            {activeTab === 'steps' && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Danh sách các bước quy trình</h3>
                    {selectedSteps.length > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Đã chọn: {selectedSteps.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSteps.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedSteps}
                        disabled={isTemplateInUse}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform ${
                          isTemplateInUse
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105'
                        }`}
                        title={isTemplateInUse ? 'Không thể xóa bước vì template đang được sử dụng' : 'Xóa các bước đã chọn'}
                      >
                        <Trash2 className={`w-4 h-4 ${isTemplateInUse ? '' : 'group-hover:scale-110'} transition-transform duration-300`} />
                        Xóa đã chọn
                      </button>
                    )}
                    {isTemplateInUse ? (
                      <button
                        disabled
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-gray-400 cursor-not-allowed opacity-60"
                        title="Không thể thêm bước vì template đang được sử dụng"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm bước
                      </button>
                    ) : (
                      <Link
                        to={`/sales/apply-process-steps/create?templateId=${template.id}`}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white transform hover:scale-105"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        Thêm bước
                      </Link>
                    )}
                  </div>
                </div>
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ListTodo className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500 text-lg font-medium">Chưa có bước nào</p>
                <p className="text-neutral-400 text-sm mt-1">Thêm bước để hoàn thiện quy trình</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps
                  .slice()
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step) => (
                    <div
                      key={step.id}
                      className={`p-5 border rounded-xl transition-all duration-300 bg-gradient-to-br from-white to-neutral-50 ${
                        selectedSteps.includes(step.id)
                          ? "border-red-300 bg-red-50"
                          : "border-neutral-200 hover:border-secondary-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSteps.includes(step.id)}
                            onChange={() => toggleStepSelection(step.id)}
                            disabled={isTemplateInUse}
                            className={`w-5 h-5 text-secondary-600 bg-white border-neutral-300 rounded focus:ring-secondary-500 focus:ring-2 ${
                              isTemplateInUse ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                            }`}
                            title={isTemplateInUse ? 'Không thể chọn vì template đang được sử dụng' : 'Chọn bước này'}
                          />
                          <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-700 font-bold">
                            {step.stepOrder}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{step.stepName}</h3>
                          </div>
                        </div>
                        <Link
                          to={`/sales/apply-process-steps/${step.id}`}
                          state={{ fromTemplate: `/sales/apply-process-templates/${template.id}` }}
                          className="group inline-flex items-center gap-1 px-3 py-2 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <AlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-medium">Chi tiết</span>
                        </Link>
                      </div>
                      {step.description && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <p className="text-sm text-neutral-700 leading-relaxed">{step.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}
