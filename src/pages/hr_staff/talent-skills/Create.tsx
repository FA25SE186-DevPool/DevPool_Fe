import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentSkillService, type TalentSkillCreate, type TalentSkill } from "../../../services/TalentSkill";
import { skillService, type Skill } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { type ExtractedSkill } from "../../../services/TalentCV";
import { 
  Plus, 
  Save, 
  Star, 
  Target, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  X,
  Search,
  Filter
} from "lucide-react";

export default function TalentSkillCreatePage() {
  const [searchParams] = useSearchParams();
  const talentId = searchParams.get('talentId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TalentSkillCreate>({
    talentId: talentId ? Number(talentId) : 0,
    skillId: 0,
    level: "",
    yearsExp: 0,
  });

  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  const [existingSkillIds, setExistingSkillIds] = useState<number[]>([]);
  const [analysisSuggestions, setAnalysisSuggestions] = useState<ExtractedSkill[]>([]);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [skillDropdownSearch, setSkillDropdownSearch] = useState("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [skillGroupDropdownSearch, setSkillGroupDropdownSearch] = useState("");
  const analysisStorageKey = talentId ? `talent-analysis-prefill-skills-${talentId}` : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skills, skillGroupsData] = await Promise.all([
          skillService.getAll({ excludeDeleted: true }),
          skillGroupService.getAll({ excludeDeleted: true })
        ]);
        setAllSkills(skills);
        const skillGroupsArray = Array.isArray(skillGroupsData)
          ? skillGroupsData
          : (Array.isArray((skillGroupsData as any)?.items)
            ? (skillGroupsData as any).items
            : (Array.isArray((skillGroupsData as any)?.data)
              ? (skillGroupsData as any).data
              : []));
        setSkillGroups(skillGroupsArray);
      } catch (error) {
        console.error("❌ Error loading skills or skill groups", error);
      }
    };
    fetchData();
  }, []);

  // Fetch existing skills for this talent to disable them in dropdown
  useEffect(() => {
    const fetchExistingSkills = async () => {
      if (!talentId) return;
      try {
        const existingSkills = await talentSkillService.getAll({ talentId: Number(talentId), excludeDeleted: true });
        const skillIds = existingSkills.map((skill: TalentSkill) => skill.skillId).filter((id: number) => id > 0);
        setExistingSkillIds(skillIds);
      } catch (error) {
        console.error("❌ Error loading existing skills", error);
      }
    };
    fetchExistingSkills();
  }, [talentId]);

  useEffect(() => {
    if (!analysisStorageKey) return;
    try {
      const raw = sessionStorage.getItem(analysisStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExtractedSkill[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAnalysisSuggestions(parsed);
      }
    } catch (storageError) {
      console.error("❌ Không thể đọc gợi ý kỹ năng từ phân tích CV", storageError);
    }
  }, [analysisStorageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === "skillId" || name === "yearsExp" ? Number(value) : value 
    }));
  };

  const applySkillSuggestion = (suggestion: ExtractedSkill) => {
    if (!suggestion) return;
    if (allSkills.length === 0) {
      setError("⚠️ Danh sách kỹ năng chưa được tải xong. Vui lòng thử lại sau.");
      return;
    }
    const matchingSkill = allSkills.find(
      (skill) => skill.name.toLowerCase() === suggestion.skillName.toLowerCase()
    );
    if (!matchingSkill) {
      setError(`⚠️ Không tìm thấy kỹ năng "${suggestion.skillName}" trong hệ thống. Vui lòng chọn thủ công.`);
      return;
    }
    setError("");
    setSuccess(false);
    setForm((prev) => ({
      ...prev,
      skillId: matchingSkill.id,
      level: suggestion.level ?? prev.level,
      yearsExp: suggestion.yearsExp ?? prev.yearsExp,
    }));
  };

  const clearSkillSuggestions = () => {
    if (analysisStorageKey) {
      sessionStorage.removeItem(analysisStorageKey);
    }
    setAnalysisSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn thêm kỹ năng cho nhân sự không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.skillId || form.skillId === 0) {
      setError("⚠️ Vui lòng chọn kỹ năng trước khi tạo.");
      setLoading(false);
      return;
    }

    if (!form.level.trim()) {
      setError("⚠️ Vui lòng nhập level kỹ năng.");
      setLoading(false);
      return;
    }

    if (form.yearsExp < 0) {
      setError("⚠️ Số năm kinh nghiệm không được âm.");
      setLoading(false);
      return;
    }

    try {
      await talentSkillService.create(form);
      clearSkillSuggestions();
      setSuccess(true);
      setTimeout(() => navigate(`/ta/talents/${talentId}`), 1500);
    } catch (err) {
      console.error("❌ Error creating Talent Skill:", err);
      setError("Không thể tạo kỹ năng cho nhân sự. Vui lòng thử lại.");
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
              { label: "Thêm kỹ năng" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm kỹ năng cho nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để thêm kỹ năng mới cho nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Thêm kỹ năng mới
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {analysisSuggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">Gợi ý từ phân tích CV</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Chọn một gợi ý bên dưới để tự động điền thông tin vào biểu mẫu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSkillSuggestions}
                  className="text-xs font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  Bỏ gợi ý
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {analysisSuggestions.map((suggestion, index) => (
                  <div
                    key={`analysis-skill-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-amber-900">{suggestion.skillName}</span>
                      <span className="text-xs text-amber-700">
                        Level: {suggestion.level ?? "Chưa rõ"} · Kinh nghiệm:{" "}
                        {suggestion.yearsExp != null ? `${suggestion.yearsExp} năm` : "Chưa rõ"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => applySkillSuggestion(suggestion)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:from-secondary-700 hover:to-secondary-800"
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
                  <Star className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin kỹ năng</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Nhóm kỹ năng (tùy chọn) */}
              {skillGroups && skillGroups.length > 0 && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Nhóm kỹ năng (tùy chọn)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSkillGroupDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        <span>
                          {selectedSkillGroupId
                            ? skillGroups.find(g => g.id === selectedSkillGroupId)?.name || "Chọn nhóm kỹ năng"
                            : "Tất cả nhóm kỹ năng"}
                        </span>
                      </div>
                      <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                    </button>
                    {isSkillGroupDropdownOpen && (
                      <div 
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsSkillGroupDropdownOpen(false);
                          setSkillGroupDropdownSearch("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={skillGroupDropdownSearch}
                              onChange={(e) => setSkillGroupDropdownSearch(e.target.value)}
                              placeholder="Tìm nhóm kỹ năng..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filteredGroups = skillGroupDropdownSearch
                              ? skillGroups.filter(g =>
                                g.name.toLowerCase().includes(skillGroupDropdownSearch.toLowerCase()) ||
                                (g.description && g.description.toLowerCase().includes(skillGroupDropdownSearch.toLowerCase()))
                              )
                              : skillGroups;

                            if (filteredGroups.length === 0) {
                              return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy nhóm kỹ năng phù hợp</p>;
                            }

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSkillGroupId(undefined);
                                    setSkillGroupDropdownSearch("");
                                    setIsSkillGroupDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    !selectedSkillGroupId
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  Tất cả nhóm kỹ năng
                                </button>
                                {filteredGroups.map(group => (
                                  <button
                                    type="button"
                                    key={group.id}
                                    onClick={() => {
                                      setSelectedSkillGroupId(group.id);
                                      setSkillGroupDropdownSearch("");
                                      setIsSkillGroupDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      selectedSkillGroupId === group.id
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {group.name}
                                  </button>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kỹ năng */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Kỹ năng <span className="text-red-500">*</span>
                </label>

                {/* Filtered Skills Dropdown - Popover với search */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSkillDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Star className="w-4 h-4 text-neutral-400" />
                      <span>
                        {form.skillId
                          ? allSkills.find(s => s.id === form.skillId)?.name || "Chọn kỹ năng"
                          : "Chọn kỹ năng"}
                      </span>
                    </div>
                    <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                  </button>
                  {isSkillDropdownOpen && (
                    <div 
                      className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setIsSkillDropdownOpen(false);
                        setSkillDropdownSearch("");
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={skillDropdownSearch}
                            onChange={(e) => setSkillDropdownSearch(e.target.value)}
                            placeholder="Tìm kỹ năng..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {(() => {
                          const filteredSkills = allSkills.filter(skill => {
                            const matchesSearch = !skillDropdownSearch ||
                              skill.name.toLowerCase().includes(skillDropdownSearch.toLowerCase()) ||
                              skill.description?.toLowerCase().includes(skillDropdownSearch.toLowerCase());
                            const matchesGroup = !selectedSkillGroupId || skill.skillGroupId === selectedSkillGroupId;
                            return matchesSearch && matchesGroup;
                          });

                          if (filteredSkills.length === 0) {
                            return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy kỹ năng phù hợp</p>;
                          }

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm(prev => ({ ...prev, skillId: 0 }));
                                  setSkillDropdownSearch("");
                                  setIsSkillDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  !form.skillId
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                Chọn kỹ năng
                              </button>
                              {filteredSkills.map(skill => {
                                const isDisabled = existingSkillIds.includes(skill.id);
                                return (
                                  <button
                                    type="button"
                                    key={skill.id}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        setForm(prev => ({ ...prev, skillId: skill.id }));
                                        setSkillDropdownSearch("");
                                        setIsSkillDropdownOpen(false);
                                      }
                                    }}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      form.skillId === skill.id
                                        ? "bg-primary-50 text-primary-700"
                                        : isDisabled
                                          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {skill.name}{isDisabled ? ' (đã chọn)' : ''}
                                  </button>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                
                {form.skillId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Mô tả: <span className="font-medium text-neutral-700">
                      {allSkills.find(s => s.id === form.skillId)?.description || "Không có mô tả"}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Cấp độ
                  </label>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  >
                    <option value="">-- Chọn cấp độ --</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                {/* Số năm kinh nghiệm */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    name="yearsExp"
                    value={form.yearsExp}
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
                    Thêm kỹ năng thành công! Đang chuyển hướng...
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
                  Thêm kỹ năng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}