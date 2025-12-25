import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { jobRoleService, type JobRole } from "../../../../services/JobRole";
import { jobRoleLevelService, type JobRoleLevel } from "../../../../services/JobRoleLevel";
import { jobRoleLevelSkillService } from "../../../../services/JobRoleLevelSkill";
import { skillService, type Skill } from "../../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { 
  Layers3, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Target,
  Plus,
  Eye,
  Search,
  X
} from "lucide-react";

export default function JobRoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMappingSuccessOverlay, setShowCreateMappingSuccessOverlay] = useState(false);
  const [showDeleteJobRoleSuccessOverlay, setShowDeleteJobRoleSuccessOverlay] = useState(false);
  const levelNames = useMemo(() => ['Junior', 'Middle', 'Senior', 'Lead'] as const, []);

  // Bulk create JobRoleLevelSkill for all levels in a group
  const [isBulkSkillModalOpen, setIsBulkSkillModalOpen] = useState(false);
  const [bulkBaseName, setBulkBaseName] = useState<string>("");
  const [bulkSelectedSkillId, setBulkSelectedSkillId] = useState<number | null>(null);
  const [bulkSkillSearch, setBulkSkillSearch] = useState("");
  const [isBulkSkillDropdownOpen, setIsBulkSkillDropdownOpen] = useState(false);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | null>(null);
  const [skillGroupSearch, setSkillGroupSearch] = useState("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const groupedJobRoleLevels = useMemo(() => {
    const groups = new Map<
      string,
      {
        baseName: string;
        levels: Partial<Record<(typeof levelNames)[number], JobRoleLevel>>;
      }
    >();

    (jobRoleLevels || []).forEach((lvl) => {
      const levelName = levelNames[lvl.level] || 'Unknown';
      const baseName = (lvl.name || '').trim();
      if (!baseName) return;
      if (!groups.has(baseName)) {
        groups.set(baseName, { baseName, levels: {} });
      }
      groups.get(baseName)!.levels[levelName] = lvl;
    });

    // sort: newest baseName group first by max id inside group
    return Array.from(groups.values()).sort((a, b) => {
      const maxA = Math.max(...Object.values(a.levels).map((x) => x?.id ?? 0));
      const maxB = Math.max(...Object.values(b.levels).map((x) => x?.id ?? 0));
      return maxB - maxA;
    });
  }, [jobRoleLevels, levelNames]);

  // Fetch dữ liệu chi tiết
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const [roleData, levelsData] = await Promise.all([
          jobRoleService.getById(Number(id)),
          jobRoleLevelService.getAll({ jobRoleId: Number(id), excludeDeleted: true })
        ]);
        setJobRole(roleData);
        setJobRoleLevels(Array.isArray(levelsData) ? levelsData : []);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết JobRole:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const openBulkSkillModal = async () => {
    if (!groupedJobRoleLevels.length) return;
    try {
      setIsBulkSkillModalOpen(true);
      setBulkBaseName(groupedJobRoleLevels[0]?.baseName || "");
      setBulkSelectedSkillId(null);
      setBulkSkillSearch("");
      setIsBulkSkillDropdownOpen(false);
      setSelectedSkillGroupId(null);
      setSkillGroupSearch("");
      setIsSkillGroupDropdownOpen(false);

      const [groupsRes, skillsRes] = await Promise.all([
        skillGroupService.getAll({ excludeDeleted: true }),
        skillService.getAll({ excludeDeleted: true }),
      ]);
      const groups = Array.isArray(groupsRes)
        ? groupsRes
        : Array.isArray((groupsRes as any)?.items)
          ? (groupsRes as any).items
          : Array.isArray((groupsRes as any)?.data)
            ? (groupsRes as any).data
            : [];
      const skills = Array.isArray(skillsRes)
        ? skillsRes
        : Array.isArray((skillsRes as any)?.items)
          ? (skillsRes as any).items
          : Array.isArray((skillsRes as any)?.data)
            ? (skillsRes as any).data
            : [];
      setSkillGroups(groups);
      setAllSkills(skills);
    } catch (e) {
      console.error("❌ Lỗi tải dữ liệu skill/skill group:", e);
    }
  };

  const closeBulkSkillModal = () => {
    setIsBulkSkillModalOpen(false);
    setBulkSelectedSkillId(null);
    setBulkSkillSearch("");
    setIsBulkSkillDropdownOpen(false);
    setSelectedSkillGroupId(null);
    setSkillGroupSearch("");
    setIsSkillGroupDropdownOpen(false);
    setIsSavingBulk(false);
  };

  const handleBulkCreateSkill = async () => {
    if (!bulkBaseName) return;
    if (!bulkSelectedSkillId || bulkSelectedSkillId <= 0) {
      alert("Vui lòng chọn kỹ năng.");
      return;
    }
    const group = groupedJobRoleLevels.find((g) => g.baseName === bulkBaseName);
    const levelIds = levelNames
      .map((lvlName) => group?.levels[lvlName]?.id)
      .filter((x): x is number => typeof x === "number" && x > 0);
    if (levelIds.length === 0) {
      alert("Không tìm thấy JobRoleLevel theo các level để tạo template.");
      return;
    }

    const ok = window.confirm(
      `Tạo kỹ năng template cho "${bulkBaseName}" trên ${levelIds.length} level (Junior/Middle/Senior/Lead) hiện có?\n\n(Không tạo trùng nếu level nào đã có skill này)`
    );
    if (!ok) return;

    try {
      setIsSavingBulk(true);
      let created = 0;
      let skipped = 0;

      // Fetch existing mappings for each jobRoleLevelId then create if not exists
      for (const jobRoleLevelId of levelIds) {
        const res = await jobRoleLevelSkillService.getAll({ jobRoleLevelId, excludeDeleted: true });
        const mappings = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : Array.isArray((res as any)?.data)
              ? (res as any).data
              : [];
        const exists = (mappings || []).some((m: any) => m?.skillId === bulkSelectedSkillId);
        if (exists) {
          skipped += 1;
          continue;
        }
        await jobRoleLevelSkillService.create({ jobRoleLevelId, skillId: bulkSelectedSkillId });
        created += 1;
      }

      setShowCreateMappingSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi close modal
      setTimeout(() => {
        setShowCreateMappingSuccessOverlay(false);
        closeBulkSkillModal();
      }, 2000);
    } catch (e) {
      console.error("❌ Lỗi tạo jobRoleLevelSkill hàng loạt:", e);
      alert("Không thể tạo kỹ năng template. Vui lòng thử lại.");
      setIsSavingBulk(false);
    }
  };

  // Xóa position type
  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa loại vị trí này?");
    if (!confirmDelete) return;

    try {
      await jobRoleService.delete(Number(id));
      setShowDeleteJobRoleSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi navigate
      setTimeout(() => {
        setShowDeleteJobRoleSuccessOverlay(false);
        navigate("/admin/categories/job-roles");
      }, 2000);
    } catch (err: any) {
      // Handle InvalidOperationException from backend
      // Check if this is a business logic error with message
      const isInvalidOperationException =
        (err?.response?.status === 409 || err?.response?.status === 400) &&
        err?.response?.data?.title?.includes("InvalidOperationException") ||
        (err?.statusCode === 409 || err?.statusCode === 400) &&
        err?.errorType === "InvalidOperationException" ||
        (err?.success === false && err?.message); // Direct error object with message

      if (isInvalidOperationException) {
        const errorMessage =
          err?.message ||
          err?.response?.data?.detail ||
          "Không thể xóa loại vị trí này vì có JobRoleLevel đang được sử dụng.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      // Log error for unhandled cases
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa loại vị trí!");
    }
  };

  // Chuyển sang trang edit
  const handleEdit = () => {
    navigate(`/admin/categories/job-roles/edit/${id}`);
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

  if (!jobRole) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy loại vị trí</p>
            <Link 
              to="/admin/categories/job-roles"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/admin/categories/job-roles"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobRole.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết về loại vị trí tuyển dụng
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Đang hoạt động
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className="group flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                className="group flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Layers3 className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem 
                  label="Tên loại vị trí" 
                  value={jobRole.name}
                  icon={<Layers3 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mô tả" 
                  value={jobRole.description || "Không có mô tả"}
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Job Role Levels List */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Target className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Danh sách vị trí tuyển dụng ({jobRoleLevels.length})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openBulkSkillModal}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 hover:border-primary-300 text-primary-700 rounded-lg font-medium transition-all duration-300"
                    title="Thêm kỹ năng template cho tất cả level của 1 vị trí"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm kỹ năng template
                  </button>
                  <Link
                    to={`/admin/categories/job-role-levels/create?jobRoleId=${id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm vị trí tuyển dụng
                  </Link>
                </div>
              </div>
            </div>
            <div className="p-6">
              {jobRoleLevels.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium mb-2">Chưa có vị trí tuyển dụng nào</p>
                  <p className="text-neutral-400 text-sm mb-4">Thêm vị trí tuyển dụng mới vào loại vị trí này</p>
                  <Link
                    to={`/admin/categories/job-role-levels/create?jobRoleId=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm vị trí đầu tiên
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedJobRoleLevels.map((group) => {
                    const anyDescription =
                      group.levels.Lead?.description ||
                      group.levels.Senior?.description ||
                      group.levels.Middle?.description ||
                      group.levels.Junior?.description ||
                      '';
                    return (
                      <div
                        key={group.baseName}
                        className="p-4 bg-neutral-50 hover:bg-primary-50 rounded-lg border border-neutral-200 hover:border-primary-300 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <Target className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {group.baseName}
                              </h3>
                              {anyDescription ? (
                                <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                                  {anyDescription}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                            {levelNames.map((lvlName) => {
                              const lvl = group.levels[lvlName];
                              if (!lvl) return null;
                              return (
                                <Link
                                  key={lvl.id}
                                  to={`/admin/categories/job-role-levels/${lvl.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-primary-700 hover:text-primary-800 hover:bg-primary-50 transition-all duration-300"
                                  title={`Xem ${lvlName}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm font-medium">{lvlName}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isBulkSkillModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-neutral-200">
            <div className="p-5 border-b border-neutral-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Thêm kỹ năng template</h3>
                <p className="text-sm text-neutral-600 mt-0.5">Tạo cho JobRoleLevel của tất cả level (nếu có)</p>
              </div>
              <button
                type="button"
                onClick={closeBulkSkillModal}
                className="text-neutral-500 hover:text-neutral-900"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Vị trí</label>
                <select
                  value={bulkBaseName}
                  onChange={(e) => setBulkBaseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                >
                  {groupedJobRoleLevels.map((g) => (
                    <option key={g.baseName} value={g.baseName}>
                      {g.baseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Group Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nhóm kỹ năng</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSkillGroupDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                  >
                    <span className="text-sm text-neutral-700">
                      {selectedSkillGroupId
                        ? skillGroups.find((g) => g.id === selectedSkillGroupId)?.name || "Tất cả nhóm"
                        : "Tất cả nhóm"}
                    </span>
                    <X className={`w-4 h-4 text-neutral-400 transition-transform ${isSkillGroupDropdownOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isSkillGroupDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={skillGroupSearch}
                            onChange={(e) => setSkillGroupSearch(e.target.value)}
                            placeholder="Tìm nhóm kỹ năng..."
                            className="w-full pl-10 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkillGroupId(null);
                            setIsSkillGroupDropdownOpen(false);
                            setSkillGroupSearch("");
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm ${
                            !selectedSkillGroupId ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-700"
                          }`}
                        >
                          Tất cả nhóm
                        </button>
                        {skillGroups
                          .filter((g) => !skillGroupSearch || g.name.toLowerCase().includes(skillGroupSearch.toLowerCase()))
                          .map((g) => (
                            <button
                              type="button"
                              key={g.id}
                              onClick={() => {
                                setSelectedSkillGroupId(g.id);
                                setIsSkillGroupDropdownOpen(false);
                                setSkillGroupSearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                selectedSkillGroupId === g.id ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-700"
                              }`}
                            >
                              {g.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Kỹ năng</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBulkSkillDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                  >
                    <span className="text-sm text-neutral-700">
                      {bulkSelectedSkillId
                        ? allSkills.find((s) => s.id === bulkSelectedSkillId)?.name || `Skill #${bulkSelectedSkillId}`
                        : "Chọn kỹ năng"}
                    </span>
                    <X className={`w-4 h-4 text-neutral-400 transition-transform ${isBulkSkillDropdownOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isBulkSkillDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={bulkSkillSearch}
                            onChange={(e) => setBulkSkillSearch(e.target.value)}
                            placeholder="Tìm kỹ năng..."
                            className="w-full pl-10 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {allSkills
                          .filter((s) => !selectedSkillGroupId || s.skillGroupId === selectedSkillGroupId)
                          .filter((s) => !bulkSkillSearch || s.name.toLowerCase().includes(bulkSkillSearch.toLowerCase()))
                          .slice(0, 200)
                          .map((s) => (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                setBulkSelectedSkillId(s.id);
                                setIsBulkSkillDropdownOpen(false);
                                setBulkSkillSearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                bulkSelectedSkillId === s.id ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-700"
                              }`}
                            >
                              {s.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeBulkSkillModal}
                className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-medium"
                disabled={isSavingBulk}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBulkCreateSkill}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSavingBulk}
              >
                {isSavingBulk ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Mapping Success Overlay */}
      {showCreateMappingSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã tạo mapping thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Job Role Success Overlay */}
      {showDeleteJobRoleSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã xóa loại vị trí thành công!</h3>
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
        {icon && (
          <div className="text-neutral-400 group-hover:text-primary-600 transition-colors duration-300">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
          {label}
        </p>
      </div>
      <p className="text-gray-900 font-semibold text-lg group-hover:text-primary-700 transition-colors duration-300">
        {value}
      </p>
    </div>
  );
}
