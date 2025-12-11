import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentProjectService, type TalentProjectCreate } from "../../../services/TalentProject";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { type ExtractedProject } from "../../../services/TalentCV";
import { 
  Plus, 
  Save, 
  Briefcase, 
  Target, 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  X
} from "lucide-react";

export default function TalentProjectCreatePage() {
  const [searchParams] = useSearchParams();
  const talentId = searchParams.get('talentId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TalentProjectCreate>({
    talentId: talentId ? Number(talentId) : 0,
    talentCVId: 0,
    projectName: "",
    position: "",
    technologies: "",
    description: "",
  });

  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [analysisProjects, setAnalysisProjects] = useState<ExtractedProject[]>([]);
  const analysisStorageKey = talentId ? `talent-analysis-prefill-projects-${talentId}` : null;
  const cvIdStorageKey = talentId ? `talent-analysis-prefill-cv-id-${talentId}` : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (talentId) {
          const cvs = await talentCVService.getAll({ 
            talentId: Number(talentId), 
            excludeDeleted: true 
          });
          setTalentCVs(cvs);
        }
      } catch (error) {
        console.error("❌ Error loading talent CVs", error);
      }
    };
    fetchData();
  }, [talentId]);

  useEffect(() => {
    if (!analysisStorageKey) return;
    try {
      const raw = sessionStorage.getItem(analysisStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExtractedProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAnalysisProjects(parsed);
      }
    } catch (error) {
      console.error("❌ Không thể đọc gợi ý dự án từ phân tích CV", error);
    }
  }, [analysisStorageKey]);

  // Tự động chọn CV đang được phân tích
  useEffect(() => {
    if (!cvIdStorageKey || !talentCVs.length) return;
    try {
      const raw = sessionStorage.getItem(cvIdStorageKey);
      if (!raw) return;
      const cvId = JSON.parse(raw) as number;
      if (cvId && talentCVs.some(cv => cv.id === cvId)) {
        setForm(prev => ({ ...prev, talentCVId: cvId }));
      }
    } catch (error) {
      console.error("❌ Không thể đọc CV ID từ phân tích", error);
    }
  }, [cvIdStorageKey, talentCVs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === "talentCVId" ? Number(value) : value 
    }));
  };

  const applyProjectSuggestion = (suggestion: ExtractedProject) => {
    if (!suggestion) return;
    setError("");
    setSuccess(false);
    setForm(prev => ({
      ...prev,
      projectName: suggestion.projectName ?? prev.projectName,
      position: suggestion.position ?? prev.position,
      technologies: suggestion.technologies ?? prev.technologies,
      description: suggestion.description ?? prev.description,
    }));
  };

  const clearProjectSuggestions = () => {
    if (analysisStorageKey) {
      sessionStorage.removeItem(analysisStorageKey);
    }
    setAnalysisProjects([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn thêm dự án cho nhân sự không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.talentCVId || form.talentCVId === 0) {
      setError("⚠️ Vui lòng chọn CV của nhân sự trước khi tạo.");
      setLoading(false);
      return;
    }

    if (!form.projectName.trim()) {
      setError("⚠️ Vui lòng nhập tên dự án.");
      setLoading(false);
      return;
    }

    if (!form.position.trim()) {
      setError("⚠️ Vui lòng nhập vị trí trong dự án.");
      setLoading(false);
      return;
    }

    try {
      await talentProjectService.create(form);
      clearProjectSuggestions();
      setSuccess(true);
      setTimeout(() => navigate(`/ta/developers/${talentId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Talent Project:", err);
      setError("Không thể tạo dự án cho nhân sự. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

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
              { label: "Thêm dự án" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm dự án cho nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm dự án mới cho nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Thêm dự án mới
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {analysisProjects.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-900">Gợi ý dự án từ CV</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Chọn một dự án bên dưới để tự động điền thông tin vào biểu mẫu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearProjectSuggestions}
                  className="text-xs font-medium text-purple-800 hover:text-purple-900 underline"
                >
                  Bỏ gợi ý
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {analysisProjects.map((project, index) => (
                  <div
                    key={`analysis-project-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-purple-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-semibold text-purple-900">{project.projectName}</p>
                      <p className="text-xs text-purple-700 mt-1">
                        Vai trò: {project.position ?? "Chưa rõ"}
                      </p>
                      {project.technologies && (
                        <p className="text-xs text-purple-600 mt-1">Công nghệ: {project.technologies}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyProjectSuggestion(project)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:from-purple-700 hover:to-purple-800"
                    >
                      <Plus className="w-4 h-4" />
                      Điền form
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin dự án</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* CV của nhân sự */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CV của nhân sự <span className="text-red-500">*</span>
                </label>
                <select
                  name="talentCVId"
                  value={form.talentCVId}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="0">-- Chọn CV --</option>
                  {talentCVs.map(cv => (
                    <option key={cv.id} value={cv.id}>v{cv.version}</option>
                  ))}
                </select>
                {form.talentCVId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Tóm tắt: <span className="font-medium text-neutral-700">
                      {talentCVs.find(cv => cv.id === form.talentCVId)?.summary || "Không có tóm tắt"}
                    </span>
                  </p>
                )}
              </div>

              {/* Tên dự án */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="VD: E-commerce Platform, Mobile Banking App..."
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vị trí trong dự án */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Vị trí trong dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="VD: Frontend Developer, Backend Lead..."
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>

                {/* Công nghệ sử dụng */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Công nghệ sử dụng
                  </label>
                  <input
                    name="technologies"
                    value={form.technologies}
                    onChange={handleChange}
                    placeholder="VD: React, Node.js, MongoDB..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>
              </div>

              {/* Mô tả dự án */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả dự án
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Nhập mô tả chi tiết về dự án..."
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
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
                    ✅ Thêm dự án thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/developers/${talentId}`}
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
                  Thêm dự án
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}