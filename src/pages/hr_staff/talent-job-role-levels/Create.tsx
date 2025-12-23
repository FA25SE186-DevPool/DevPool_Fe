import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentJobRoleLevelService, type TalentJobRoleLevelCreate, type TalentJobRoleLevel } from "../../../services/TalentJobRoleLevel";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel as TalentLevelEnum, TalentLevel } from "../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import { type ExtractedJobRoleLevel } from "../../../services/TalentCV";
import { 
  Plus, 
  Save, 
  Target, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  X,
  Search,
  Filter
} from "lucide-react";

export default function TalentJobRoleLevelCreatePage() {
  const [searchParams] = useSearchParams();
  const talentId = searchParams.get('talentId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TalentJobRoleLevelCreate>({
    talentId: talentId ? Number(talentId) : 0,
    jobRoleLevelId: 0,
    yearsOfExp: 0,
  });

  const [allJobRoleLevels, setAllJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [existingJobRoleLevelIds, setExistingJobRoleLevelIds] = useState<number[]>([]);
  const [analysisJobRoles, setAnalysisJobRoles] = useState<ExtractedJobRoleLevel[]>([]);
  const analysisStorageKey = talentId ? `talent-analysis-prefill-jobRoleLevels-${talentId}` : null;
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRoleLevels, jobRolesData] = await Promise.all([
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll()
        ]);
        setAllJobRoleLevels(jobRoleLevels);
        setJobRoles(jobRolesData);
      } catch (error) {
        console.error("❌ Error loading job role levels", error);
      }
    };
    fetchData();
  }, []);

  // Fetch existing job role levels for this talent to disable them in dropdown
  useEffect(() => {
    const fetchExistingJobRoleLevels = async () => {
      if (!talentId) return;
      try {
        const existingJobRoleLevels = await talentJobRoleLevelService.getAll({ talentId: Number(talentId), excludeDeleted: true });
        const jobRoleLevelIds = (existingJobRoleLevels as TalentJobRoleLevel[])
          .map((jobRoleLevel) => jobRoleLevel.jobRoleLevelId ?? 0)
          .filter((jobRoleLevelId): jobRoleLevelId is number => jobRoleLevelId > 0);
        setExistingJobRoleLevelIds(jobRoleLevelIds);
      } catch (error) {
        console.error("❌ Error loading existing job role levels", error);
      }
    };
    fetchExistingJobRoleLevels();
  }, [talentId]);

  useEffect(() => {
    if (!analysisStorageKey) return;
    try {
      const raw = sessionStorage.getItem(analysisStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExtractedJobRoleLevel[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAnalysisJobRoles(parsed);
      }
    } catch (error) {
      console.error("❌ Không thể đọc gợi ý vị trí từ phân tích CV", error);
    }
  }, [analysisStorageKey]);

  // Helper function để format level
  const getLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
      [TalentLevel.Junior]: "Junior",
      [TalentLevel.Middle]: "Middle",
      [TalentLevel.Senior]: "Senior",
      [TalentLevel.Lead]: "Lead"
    };
    return levelMap[level] || "Unknown";
  };

  // Helper function để format jobRoleLevel display text
  const getJobRoleLevelDisplayText = (jrl: JobRoleLevel): string => {
    const jobRole = jobRoles.find(r => r.id === jrl.jobRoleId);
    const roleName = jobRole?.name || "—";
    const levelText = getLevelText(jrl.level);
    return `${roleName} - ${levelText}`;
  };

  const filteredJobRoles = jobRoles.filter(role =>
    !jobRoleFilterSearch || role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
  );

  const filteredJobRoleLevels = allJobRoleLevels.filter(jrl => {
    const matchesJobRole = !selectedJobRoleFilterId || jrl.jobRoleId === selectedJobRoleFilterId;
    return matchesJobRole;
  });

  // Reset jobRoleLevelId khi filter jobRole thay đổi
  useEffect(() => {
    if (form.jobRoleLevelId && selectedJobRoleFilterId) {
      const selectedLevel = allJobRoleLevels.find(j => j.id === form.jobRoleLevelId);
      if (selectedLevel && selectedLevel.jobRoleId !== selectedJobRoleFilterId) {
        setForm(prev => ({ ...prev, jobRoleLevelId: 0 }));
      }
    }
  }, [selectedJobRoleFilterId, form.jobRoleLevelId, allJobRoleLevels]);

  // Tự động điền vào ô lọc loại vị trí khi chọn vị trí
  useEffect(() => {
    if (form.jobRoleLevelId && allJobRoleLevels.length > 0) {
      const selectedLevel = allJobRoleLevels.find(j => j.id === form.jobRoleLevelId);
      if (selectedLevel && selectedJobRoleFilterId !== selectedLevel.jobRoleId) {
        setSelectedJobRoleFilterId(selectedLevel.jobRoleId);
      }
    }
  }, [form.jobRoleLevelId, allJobRoleLevels]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setForm(prev => ({ 
      ...prev, 
      [name]: name === "jobRoleLevelId" || name === "yearsOfExp" ? 
              (value === "" ? undefined : Number(value)) : value 
    }));
    
    // Tự động điền vào ô lọc loại vị trí khi chọn vị trí
    if (name === "jobRoleLevelId" && value) {
      const selectedLevel = allJobRoleLevels.find(j => j.id === Number(value));
      if (selectedLevel) {
        setSelectedJobRoleFilterId(selectedLevel.jobRoleId);
      }
    }
  };

  const findMatchingJobRoleLevel = (suggestion: ExtractedJobRoleLevel) => {
    if (!suggestion.position && !suggestion.level) return undefined;
    const targetPosition = suggestion.position?.toLowerCase() ?? "";
    const targetLevel = suggestion.level?.toLowerCase() ?? "";
    return allJobRoleLevels.find((jrl) => {
      const name = (jrl.name ?? "").toLowerCase();
      const levelName =
        Object.entries(TalentLevelEnum).find(([, value]) => value === jrl.level)?.[0]?.toLowerCase() ?? "";
      const positionMatch =
        targetPosition.length === 0 ||
        name.includes(targetPosition) ||
        targetPosition.includes(name);
      const levelMatch =
        targetLevel.length === 0 ||
        levelName === targetLevel ||
        levelName.includes(targetLevel) ||
        targetLevel.includes(levelName);
      return positionMatch && levelMatch;
    });
  };

  const applyJobRoleSuggestion = (suggestion: ExtractedJobRoleLevel) => {
    if (!suggestion) return;
    const matched = findMatchingJobRoleLevel(suggestion);
    if (!matched) {
      setError(`⚠️ Không tìm thấy vị trí phù hợp với "${suggestion.position ?? "đề xuất"}". Vui lòng chọn thủ công.`);
      return;
    }
    setError("");
    setSuccess(false);
    setForm(prev => ({
      ...prev,
      jobRoleLevelId: matched.id,
      yearsOfExp: suggestion.yearsOfExp ?? prev.yearsOfExp,
    }));
    // Tự động điền vào ô lọc loại vị trí
    setSelectedJobRoleFilterId(matched.jobRoleId);
  };

  const clearJobRoleSuggestions = () => {
    if (analysisStorageKey) {
      sessionStorage.removeItem(analysisStorageKey);
    }
    setAnalysisJobRoles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn thêm vị trí công việc cho nhân sự không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.jobRoleLevelId || form.jobRoleLevelId === 0) {
      setError("⚠️ Vui lòng chọn vị trí công việc trước khi tạo.");
      setLoading(false);
      return;
    }

    if (form.yearsOfExp < 0) {
      setError("⚠️ Số năm kinh nghiệm không được âm.");
      setLoading(false);
      return;
    }

    try {
      await talentJobRoleLevelService.create(form);
      clearJobRoleSuggestions();
      setSuccess(true);
      setTimeout(() => navigate(`/ta/talents/${talentId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Talent Job Role Level:", err);
      setError("Không thể tạo vị trí công việc cho nhân sự. Vui lòng thử lại.");
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
              { label: "Thêm vị trí công việc" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm vị trí công việc cho nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm vị trí công việc mới cho nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Thêm vị trí công việc mới
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {analysisJobRoles.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-900">Gợi ý vị trí từ CV</p>
                  <p className="text-xs text-green-700 mt-1">
                    Chọn một gợi ý bên dưới để tự động điền thông tin vào biểu mẫu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearJobRoleSuggestions}
                  className="text-xs font-medium text-green-800 hover:text-green-900 underline"
                >
                  Bỏ gợi ý
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {analysisJobRoles.map((role, index) => (
                  <div
                    key={`analysis-role-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-semibold text-green-900">{role.position ?? "Vị trí chưa xác định"}</p>
                      <p className="text-xs text-green-700 mt-1">Level: {role.level ?? "Chưa rõ"}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Kinh nghiệm: {role.yearsOfExp != null ? `${role.yearsOfExp} năm` : "Chưa rõ"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyJobRoleSuggestion(role)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:from-green-700 hover:to-green-800"
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
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin vị trí công việc</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vị trí công việc */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Vị trí công việc <span className="text-red-500">*</span>
                </label>
                
                {/* Filter theo loại vị trí */}
                <div className="mb-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsJobRoleFilterDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-lg bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        <span>
                          {selectedJobRoleFilterId
                            ? jobRoles.find(r => r.id === selectedJobRoleFilterId)?.name || "Loại vị trí"
                            : "Tất cả loại vị trí"}
                        </span>
                      </div>
                    </button>
                    {isJobRoleFilterDropdownOpen && (
                      <div 
                        className="absolute z-30 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsJobRoleFilterDropdownOpen(false);
                          setJobRoleFilterSearch("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={jobRoleFilterSearch}
                              onChange={(e) => setJobRoleFilterSearch(e.target.value)}
                              placeholder="Tìm loại vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobRoleFilterId(undefined);
                              setJobRoleFilterSearch("");
                              setIsJobRoleFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !selectedJobRoleFilterId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả loại vị trí
                          </button>
                          {filteredJobRoles.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại vị trí phù hợp</p>
                          ) : (
                            filteredJobRoles.map(role => (
                              <button
                                type="button"
                                key={role.id}
                                onClick={() => {
                                  setSelectedJobRoleFilterId(role.id);
                                  setJobRoleFilterSearch("");
                                  setIsJobRoleFilterDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleFilterId === role.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {role.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <select
                  name="jobRoleLevelId"
                  value={form.jobRoleLevelId}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="0">-- Chọn vị trí công việc --</option>
                  {filteredJobRoleLevels.map(jobRoleLevel => {
                    const isDisabled = existingJobRoleLevelIds.includes(jobRoleLevel.id);
                    return (
                      <option 
                        key={jobRoleLevel.id} 
                        value={jobRoleLevel.id}
                        disabled={isDisabled}
                        style={isDisabled ? { color: '#999', fontStyle: 'italic' } : {}}
                      >
                        {getJobRoleLevelDisplayText(jobRoleLevel)}{isDisabled ? ' (đã chọn)' : ''}
                      </option>
                    );
                  })}
                </select>
                {form.jobRoleLevelId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Mô tả: <span className="font-medium text-neutral-700">
                      {allJobRoleLevels.find(jrl => jrl.id === form.jobRoleLevelId)?.description || "Không có mô tả"}
                    </span>
                  </p>
                )}
              </div>

              {/* Số năm kinh nghiệm */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Số năm kinh nghiệm
                </label>
                <input
                  type="number"
                  name="yearsOfExp"
                  value={form.yearsOfExp}
                  onChange={handleChange}
                  min={0}
                  max={50}
                  placeholder="Nhập số năm kinh nghiệm..."
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  required
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
                    Thêm vị trí công việc thành công! Đang chuyển hướng...
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
                  Thêm vị trí
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}