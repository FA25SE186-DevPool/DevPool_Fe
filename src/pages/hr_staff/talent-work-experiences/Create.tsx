import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentWorkExperienceService, type TalentWorkExperienceCreate } from "../../../services/TalentWorkExperience";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { type ExtractedWorkExperience } from "../../../services/TalentCV";
import { 
  Plus, 
  Save, 
  Workflow, 
  Building2, 
  Calendar, 
  FileText,
  AlertCircle, 
  CheckCircle,
  X,
  Search,
  Target
} from "lucide-react";

export default function TalentWorkExperienceCreatePage() {
  const [searchParams] = useSearchParams();
  const talentId = searchParams.get('talentId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TalentWorkExperienceCreate>({
    talentId: talentId ? Number(talentId) : 0,
    talentCVId: 0,
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [analysisExperiences, setAnalysisExperiences] = useState<ExtractedWorkExperience[]>([]);
  const analysisStorageKey = talentId ? `talent-analysis-prefill-experiences-${talentId}` : null;
  const cvIdStorageKey = talentId ? `talent-analysis-prefill-cv-id-${talentId}` : null;

  // Danh sách vị trí công việc
  const workExperiencePositions = [
    "Backend",
    "Frontend",
    "BA",
    "Fullstack Developer",
    "Mobile Developer (iOS/Android/Flutter/React Native)",
    "AI/ML Engineer",
    "Data Engineer",
    "Data Scientist",
    "DevOps Engineer",
    "Cloud Engineer",
    "QA/QC Engineer (Manual / Automation)",
    "Test Lead",
    "Solution Architect",
    "Technical Lead (Tech Lead)",
    "Software Architect"
  ];

  // State cho position dropdown
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (talentId) {
          const cvs = await talentCVService.getAll({ talentId: Number(talentId), excludeDeleted: true });
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
      const parsed = JSON.parse(raw) as ExtractedWorkExperience[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAnalysisExperiences(parsed);
      }
    } catch (error) {
      console.error("❌ Không thể đọc gợi ý kinh nghiệm từ phân tích CV", error);
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

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isPositionDropdownOpen && !target.closest('.position-dropdown-container')) {
        setIsPositionDropdownOpen(false);
      }
    };

    if (isPositionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isPositionDropdownOpen]);

  // Validate start date similar to talents/Create.tsx
  const validateStartDate = (date: string): boolean => {
    if (!date) return false;
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (startDate > today) return false;
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
    return startDate >= hundredYearsAgo;
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // realtime validation for dates
    if (name === 'startDate') {
      const newErrors = { ...fieldErrors };
      if (value && !validateStartDate(value)) {
        newErrors.startDate = 'Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước)';
      } else {
        delete newErrors.startDate;
        // if endDate exists, ensure end > start
        if (form.endDate) {
          if (new Date(form.endDate) <= new Date(value)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
          } else {
            delete newErrors.endDate;
          }
        }
      }
      setFieldErrors(newErrors);
    }

    if (name === 'endDate') {
      const newErrors = { ...fieldErrors };
      if (value && form.startDate) {
        if (new Date(value) <= new Date(form.startDate)) {
          newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        } else {
          delete newErrors.endDate;
        }
      } else {
        delete newErrors.endDate;
      }
      setFieldErrors(newErrors);
    }

    setForm(prev => ({ 
      ...prev, 
      [name]: name === "talentCVId" ? Number(value) : value 
    }));
  };

  const normalizeDateInput = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
    if (/present|hiện tại/i.test(trimmed)) return "";
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return "";
  };

  const applyExperienceSuggestion = (suggestion: ExtractedWorkExperience) => {
    if (!suggestion) return;
    setError("");
    setSuccess(false);
    const normalizedStart = normalizeDateInput(suggestion.startDate);
    const normalizedEnd = normalizeDateInput(suggestion.endDate);
    setFieldErrors({});
    setForm(prev => ({
      ...prev,
      company: suggestion.company ?? prev.company,
      position: suggestion.position ?? prev.position,
      startDate: normalizedStart || prev.startDate,
      endDate: normalizedEnd,
      description: suggestion.description ?? prev.description,
    }));
  };

  const clearExperienceSuggestions = () => {
    if (analysisStorageKey) {
      sessionStorage.removeItem(analysisStorageKey);
    }
    setAnalysisExperiences([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn thêm kinh nghiệm làm việc cho nhân sự không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.talentCVId || form.talentCVId === 0) {
      setError("⚠️ Vui lòng chọn CV trước khi tạo.");
      setLoading(false);
      return;
    }

    if (!form.company.trim()) {
      setError("⚠️ Vui lòng nhập tên công ty.");
      setLoading(false);
      return;
    }

    if (!form.position.trim()) {
      setError("⚠️ Vui lòng nhập vị trí làm việc.");
      setLoading(false);
      return;
    }

    if (!form.startDate) {
      setError("⚠️ Vui lòng chọn ngày bắt đầu.");
      setLoading(false);
      return;
    }
    if (!validateStartDate(form.startDate)) {
      setError("⚠️ Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước).");
      setLoading(false);
      return;
    }

    // Validate date logic
    if (form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      setError("⚠️ Ngày kết thúc phải sau ngày bắt đầu.");
      setLoading(false);
      return;
    }

    try {
      // Convert date strings to UTC ISO strings for PostgreSQL
      const formData = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };
      
      await talentWorkExperienceService.create(formData);
      clearExperienceSuggestions();
      setSuccess(true);
      setTimeout(() => navigate(`/ta/talents/${talentId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Talent Work Experience:", err);
      setError("Không thể tạo kinh nghiệm làm việc cho nhân sự. Vui lòng thử lại.");
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
              { label: "Nhân sự", to: "/ta/talents" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/talents/${talentId}` },
              { label: "Thêm kinh nghiệm" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm kinh nghiệm làm việc cho nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm kinh nghiệm làm việc mới cho nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Thêm kinh nghiệm làm việc mới
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {analysisExperiences.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-900">Gợi ý kinh nghiệm từ CV</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Chọn một gợi ý bên dưới để tự động điền thông tin vào biểu mẫu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearExperienceSuggestions}
                  className="text-xs font-medium text-blue-800 hover:text-blue-900 underline"
                >
                  Bỏ gợi ý
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {analysisExperiences.map((experience, index) => (
                  <div
                    key={`analysis-experience-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-sm font-semibold text-blue-900">{experience.position ?? "Vị trí chưa rõ"}</p>
                      <p className="text-xs text-blue-700 mt-1">{experience.company ?? "Công ty chưa rõ"}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {experience.startDate ?? "Không rõ"} - {experience.endDate ?? "Hiện tại"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyExperienceSuggestion(experience)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-800"
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
                  <Workflow className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin kinh nghiệm làm việc</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Công ty */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="VD: Google, Microsoft, Facebook..."
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                </div>

                {/* Vị trí */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    Vị trí <span className="text-red-500">*</span>
                  </label>
                  <div className="relative position-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsPositionDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className={form.position ? "text-neutral-800" : "text-neutral-500"}>
                          {form.position || "Chọn vị trí"}
                        </span>
                      </div>
                      <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                    </button>
                    {isPositionDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={positionSearch}
                              onChange={(e) => setPositionSearch(e.target.value)}
                              placeholder="Tìm vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filtered = positionSearch
                              ? workExperiencePositions.filter(p => p.toLowerCase().includes(positionSearch.toLowerCase()))
                              : workExperiencePositions;
                            if (filtered.length === 0) {
                              return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                            }
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm(prev => ({ ...prev, position: "" }));
                                    setPositionSearch("");
                                    setIsPositionDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    !form.position
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  Chọn vị trí
                                </button>
                                {filtered.map((position) => (
                                  <button
                                    type="button"
                                    key={position}
                                    onClick={() => {
                                      setForm(prev => ({ ...prev, position }));
                                      setPositionSearch("");
                                      setIsPositionDropdownOpen(false);
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors.position;
                                      setFieldErrors(newErrors);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      form.position === position
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {position}
                                  </button>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.position && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.position}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    const maxDate = today.toISOString().split('T')[0];
                    
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
                    const minDate = hundredYearsAgo.toISOString().split('T')[0];
                    
                    return (
                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        min={minDate}
                        max={maxDate}
                        required
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      />
                    );
                  })()}
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày kết thúc (tùy chọn)
                  </label>
                  {(() => {
                    // Tính ngày tối thiểu là ngày sau ngày bắt đầu
                    let minEndDate = '';
                    if (form.startDate) {
                      const startDate = new Date(form.startDate);
                      startDate.setDate(startDate.getDate() + 1); // Ngày sau ngày bắt đầu
                      minEndDate = startDate.toISOString().split('T')[0];
                    }
                    
                    return (
                      <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        min={minEndDate || undefined}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      />
                    );
                  })()}
                  <p className="text-xs text-neutral-500 mt-1">
                    Để trống nếu vẫn đang làm việc
                  </p>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả công việc (tùy chọn)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm và thành tựu..."
                  rows={4}
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
                    Thêm kinh nghiệm làm việc thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${talentId}`}
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
                  Thêm kinh nghiệm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}