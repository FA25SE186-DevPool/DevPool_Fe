import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { applyProcessStepService } from "../../../services/ApplyProcessStep";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { jobRequestService } from "../../../services/JobRequest";
import { Button } from "../../../components/ui/button";
import {
  Edit,
  Trash2,
  FileText,
  Hash,
  Building2,
  AlertCircle,
  List,
} from "lucide-react";

interface ApplyProcessStepDetail {
  id: number;
  templateId: number;
  templateName?: string;
  stepOrder: number;
  stepName: string;
  description: string;
}

export default function SalesApplyProcessStepDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget =
    (location.state as { fromTemplate?: string } | null)?.fromTemplate ??
    "/sales/apply-process-steps";
  const [step, setStep] = useState<ApplyProcessStepDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [templateSteps, setTemplateSteps] = useState<any[]>([]);
  const [showDeleteSuccessOverlay, setShowDeleteSuccessOverlay] = useState(false);
  const [isTemplateInUse, setIsTemplateInUse] = useState(false);
  const [templateUsageCount, setTemplateUsageCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stepData = await applyProcessStepService.getById(Number(id));

        let templateName = "—";
        let steps: any[] = [];
        try {
          const template = await applyProcessTemplateService.getById(stepData.templateId);
          templateName = template.name;
          
          // Fetch all steps from the template
          try {
            const allSteps = await applyProcessStepService.getAll({
              templateId: stepData.templateId,
              excludeDeleted: true
            });
            steps = Array.isArray(allSteps) ? allSteps : (allSteps?.data || allSteps?.items || []);
            // Sort by stepOrder
            steps.sort((a, b) => a.stepOrder - b.stepOrder);
          } catch {}

          // Kiểm tra xem template có đang được sử dụng không
          try {
            const jobRequests = await jobRequestService.getAll({
              applyProcessTemplateId: stepData.templateId,
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
        } catch {}

        setStep({ ...stepData, templateName });
        setTemplateSteps(steps);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết Apply Process Step:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    if (isTemplateInUse) {
      alert(`⚠️ Không thể xóa bước này vì template đang được sử dụng trong ${templateUsageCount} yêu cầu tuyển dụng!`);
      return;
    }

    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa bước quy trình này?");
    if (!confirm) return;

    try {
      await applyProcessStepService.deleteById(Number(id));
      setShowDeleteSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi navigate
      setTimeout(() => {
        setShowDeleteSuccessOverlay(false);
        navigate(backTarget);
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa bước quy trình!");
    }
  };

  const handleEdit = () => {
    if (isTemplateInUse) {
      alert(`⚠️ Không thể sửa bước này vì template đang được sử dụng trong ${templateUsageCount} yêu cầu tuyển dụng!`);
      return;
    }

    const state =
      backTarget !== "/sales/apply-process-steps" ? { fromTemplate: backTarget } : undefined;
    navigate(`/sales/apply-process-steps/edit/${id}`, { state });
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu bước quy trình...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy bước quy trình</p>
            <Link
              to="/sales/apply-process-steps"
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
            items={
              backTarget !== "/sales/apply-process-steps"
                ? [
                    { label: "Mẫu quy trình", to: "/sales/apply-process-templates" },
                    { label: templateSteps.length > 0 ? templateSteps[0].templateName || "Template" : "Template", to: backTarget },
                    { label: step.stepName }
                  ]
                : [
                    { label: "Các bước quy trình", to: "/sales/apply-process-steps" },
                    { label: step.stepName }
                  ]
            }
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{step.stepName}</h1>
              <p className="text-neutral-600 mb-4">Thông tin chi tiết bước quy trình tuyển dụng</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Hash className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">Bước {step.stepOrder}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                disabled={isTemplateInUse}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft transform ${
                  isTemplateInUse
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'hover:shadow-glow hover:scale-105 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
                }`}
                title={isTemplateInUse ? `Không thể sửa vì template đang được sử dụng trong ${templateUsageCount} yêu cầu tuyển dụng` : 'Sửa bước này'}
              >
                <Edit className={`w-4 h-4 ${isTemplateInUse ? '' : 'group-hover:scale-110'} transition-transform duration-300`} />
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
                title={isTemplateInUse ? `Không thể xóa vì template đang được sử dụng trong ${templateUsageCount} yêu cầu tuyển dụng` : 'Xóa bước này'}
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
                onClick={() => setActiveTab('description')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === 'description'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Mô tả
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === 'steps'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <List className="w-4 h-4" />
                Các bước quy trình
                {templateSteps.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                    {templateSteps.length}
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
                  <InfoItem label="Tên bước" value={step.stepName} icon={<FileText className="w-4 h-4" />} />
                  <InfoItem
                    label="Mẫu quy trình"
                    value={step.templateName ?? "—"}
                    icon={<Building2 className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Thứ tự bước"
                    value={`Bước ${step.stepOrder}`}
                    icon={<Hash className="w-4 h-4" />}
                  />
                </div>
              </div>
            )}

            {/* Tab: Mô tả */}
            {activeTab === 'description' && (
              <div className="animate-fade-in">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {step.description || "Chưa có mô tả cho bước này"}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Các bước quy trình */}
            {activeTab === 'steps' && (
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách các bước trong mẫu quy trình</h3>
                {templateSteps.length > 0 ? (
                  <div className="space-y-3">
                    {templateSteps.map((s: any) => (
                      <div
                        key={s.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          s.id === step.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                              s.id === step.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}>
                              {s.stepOrder}
                            </div>
                            <div>
                              <p className={`font-semibold ${
                                s.id === step.id ? 'text-primary-900' : 'text-gray-900'
                              }`}>
                                {s.stepName}
                              </p>
                              {s.description && (
                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {s.id === step.id && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              Bước hiện tại
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <List className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                    <p>Chưa có bước nào trong mẫu quy trình này</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Success Overlay */}
      {showDeleteSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã xóa bước quy trình thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
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
