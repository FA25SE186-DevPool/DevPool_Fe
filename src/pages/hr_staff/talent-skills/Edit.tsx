import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentSkillService, type TalentSkillCreate } from "../../../services/TalentSkill";
import { skillService, type Skill } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { talentSkillGroupAssessmentService } from "../../../services/TalentSkillGroupAssessment";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  Star, 
  Target, 
  Calendar,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";

export default function TalentSkillEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState("");
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [talentId, setTalentId] = useState<number>(0);
  const [existingSkillIds, setExistingSkillIds] = useState<number[]>([]);
  const [currentSkillId, setCurrentSkillId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentSkillCreate>({
    talentId: 0,
    skillId: 0,
    level: "",
    yearsExp: 0,
  });

  const [loading, setLoading] = useState(true);

  // 🧭 Load dữ liệu Talent Skill
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentSkillService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          skillId: data.skillId,
          level: data.level,
          yearsExp: data.yearsExp,
        });
        setTalentId(data.talentId);
        setCurrentSkillId(data.skillId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin kỹ năng nhân sự!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Skills và Skill Groups
  useEffect(() => {
    const fetchSkills = async () => {
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
      } catch (err) {
        console.error("❌ Lỗi tải danh sách kỹ năng hoặc nhóm kỹ năng:", err);
      }
    };
    fetchSkills();
  }, []);

  // Fetch existing skills for this talent to disable them in dropdown (except current one)
  useEffect(() => {
    const fetchExistingSkills = async () => {
      if (!talentId) return;
      try {
        const existingSkills = await talentSkillService.getAll({ talentId: talentId, excludeDeleted: true });
        // Exclude current skill ID from disabled list
        const skillIds = existingSkills
          .map((skill: any) => skill.skillId)
          .filter((id: number) => id > 0 && id !== currentSkillId);
        setExistingSkillIds(skillIds);
      } catch (error) {
        console.error("❌ Error loading existing skills", error);
      }
    };
    fetchExistingSkills();
  }, [talentId, currentSkillId]);

  // Tự động set nhóm kỹ năng khi skill đã được chọn
  useEffect(() => {
    if (formData.skillId && allSkills.length > 0) {
      const selectedSkill = allSkills.find(s => s.id === formData.skillId);
      if (selectedSkill?.skillGroupId) {
        setSelectedSkillGroupId(selectedSkill.skillGroupId);
      }
    }
  }, [formData.skillId, allSkills]);

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "skillId" || name === "yearsExp"
        ? Number(value)
        : value,
    }));
  };

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!formData.skillId || formData.skillId === 0) {
      alert("⚠️ Vui lòng chọn kỹ năng trước khi lưu!");
      return;
    }

    if (!formData.level.trim()) {
      alert("⚠️ Vui lòng nhập level kỹ năng!");
      return;
    }

    if (formData.yearsExp < 0) {
      alert("⚠️ Số năm kinh nghiệm không được âm!");
      return;
    }

    try {
      console.log("Payload gửi đi:", formData);
      await talentSkillService.update(Number(id), formData);

      // Refresh verification status sau khi update skill (auto-invalidate nếu cần)
      try {
        // Lấy skill info để biết skillGroupId
        const updatedSkill = allSkills.find(s => s.id === formData.skillId);
        if (updatedSkill?.skillGroupId) {
          // Đợi một chút để backend xử lý auto-invalidate
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Refresh verification status
          try {
            await talentSkillGroupAssessmentService.getVerificationStatuses(
              talentId,
              [updatedSkill.skillGroupId]
            );
          } catch (e) {
            // Ignore error khi refresh status
          }
        }
      } catch (statusError) {
        console.warn("⚠️ Không thể refresh verification status:", statusError);
        // Không block việc update nếu refresh status lỗi
      }

      alert("✅ Cập nhật kỹ năng nhân sự thành công!");
      navigate(`/ta/talents/${talentId}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật kỹ năng nhân sự!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );

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
              { label: "Chỉnh sửa kỹ năng" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa kỹ năng nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin kỹ năng của nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa kỹ năng nhân sự
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
                          setSkillGroupSearchQuery("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={skillGroupSearchQuery}
                              onChange={(e) => setSkillGroupSearchQuery(e.target.value)}
                              placeholder="Tìm nhóm kỹ năng..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filteredGroups = skillGroupSearchQuery
                              ? skillGroups.filter(g =>
                                g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()) ||
                                (g.description && g.description.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()))
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
                                    setSkillGroupSearchQuery("");
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
                                      setSkillGroupSearchQuery("");
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
                        {formData.skillId
                          ? allSkills.find(s => s.id === formData.skillId)?.name || "Chọn kỹ năng"
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
                        setSkillSearchQuery("");
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={skillSearchQuery}
                            onChange={(e) => setSkillSearchQuery(e.target.value)}
                            placeholder="Tìm kỹ năng..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {(() => {
                          const filteredSkills = allSkills.filter(skill => {
                            const matchesSearch = !skillSearchQuery ||
                              skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                              skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase());
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
                                  setFormData(prev => ({ ...prev, skillId: 0 }));
                                  setSkillSearchQuery("");
                                  setIsSkillDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  !formData.skillId
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
                                        setFormData(prev => ({ ...prev, skillId: skill.id }));
                                        // Tự động set nhóm kỹ năng theo skill đã chọn
                                        if (skill.skillGroupId) {
                                          setSelectedSkillGroupId(skill.skillGroupId);
                                        }
                                        setSkillSearchQuery("");
                                        setIsSkillDropdownOpen(false);
                                      }
                                    }}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      formData.skillId === skill.id
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
                
                {formData.skillId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Mô tả: <span className="font-medium text-neutral-700">
                      {allSkills.find(s => s.id === formData.skillId)?.description || "Không có mô tả"}
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
                    value={formData.level}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  >
                    <option value="">-- Chọn cấp độ --</option>
                    <option value="Beginner">Mới bắt đầu</option>
                    <option value="Intermediate">Trung bình</option>
                    <option value="Advanced">Nâng cao</option>
                    <option value="Expert">Chuyên gia</option>
                  </select>
                </div>

                {/* Số năm kinh nghiệm */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Số năm kinh nghiệm
                  </label>
                  <Input
                    type="number"
                    name="yearsExp"
                    value={formData.yearsExp}
                    onChange={handleChange}
                    min={0}
                    max={50}
                    placeholder="Nhập số năm kinh nghiệm..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${talentId}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
