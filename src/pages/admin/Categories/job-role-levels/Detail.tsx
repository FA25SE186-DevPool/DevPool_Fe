import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { jobRoleLevelService, type JobRoleLevel } from "../../../../services/JobRoleLevel";
import { Button } from "../../../../components/ui/button";
import { jobRoleService } from "../../../../services/JobRole";
import { jobRoleLevelSkillService, type JobRoleLevelSkill } from "../../../../services/JobRoleLevelSkill";
import { skillService, type Skill } from "../../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { Layers3, ArrowLeft, Plus, Pencil, Trash2, Search, X } from "lucide-react";

export default function JobRoleLevelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRoleLevel, setJobRoleLevel] = useState<JobRoleLevel | null>(null);
  const [jobRoleName, setJobRoleName] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  // Skills template for this job role level
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [jobRoleLevelSkills, setJobRoleLevelSkills] = useState<JobRoleLevelSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);

  // Modals
  const [isCreateSkillModalOpen, setIsCreateSkillModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<JobRoleLevelSkill | null>(null);

  // Success overlay states
  const [showUpdateSkillSuccessOverlay, setShowUpdateSkillSuccessOverlay] = useState(false);
  const [showCreateSkillSuccessOverlay, setShowCreateSkillSuccessOverlay] = useState(false);
  const [showDeleteSkillSuccessOverlay, setShowDeleteSkillSuccessOverlay] = useState(false);
  const [showDeleteJobRoleLevelSuccessOverlay, setShowDeleteJobRoleLevelSuccessOverlay] = useState(false);

  // Form state (create/edit)
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | null>(null);
  const [skillGroupSearch, setSkillGroupSearch] = useState("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);

  const levelLabels: Record<number, string> = {
    0: "Junior",
    1: "Middle",
    2: "Senior",
    3: "Lead",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const positionData = await jobRoleLevelService.getById(Number(id)) as JobRoleLevel;
        setJobRoleLevel(positionData);
        const typeData = await jobRoleService.getById(positionData.jobRoleId);
        setJobRoleName(typeData.name);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết vị trí:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const skillNameById = useMemo(() => {
    const map = new Map<number, string>();
    (allSkills || []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [allSkills]);

  const refreshSkills = async () => {
    if (!id) return;
    try {
      setLoadingSkills(true);
      const [mappingsRes, skillsRes, groupsRes] = await Promise.all([
        jobRoleLevelSkillService.getAll({ jobRoleLevelId: Number(id), excludeDeleted: true }),
        skillService.getAll({ excludeDeleted: true }),
        skillGroupService.getAll({ excludeDeleted: true }),
      ]);
      const mappings = Array.isArray(mappingsRes)
        ? mappingsRes
        : Array.isArray((mappingsRes as any)?.items)
          ? (mappingsRes as any).items
          : Array.isArray((mappingsRes as any)?.data)
            ? (mappingsRes as any).data
            : [];
      const skills = Array.isArray(skillsRes)
        ? skillsRes
        : Array.isArray((skillsRes as any)?.items)
          ? (skillsRes as any).items
          : Array.isArray((skillsRes as any)?.data)
            ? (skillsRes as any).data
            : [];
      const groups = Array.isArray(groupsRes)
        ? groupsRes
        : Array.isArray((groupsRes as any)?.items)
          ? (groupsRes as any).items
          : Array.isArray((groupsRes as any)?.data)
            ? (groupsRes as any).data
            : [];
      setJobRoleLevelSkills(mappings);
      setAllSkills(skills);
      setSkillGroups(groups);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách kỹ năng theo vị trí:", err);
    } finally {
      setLoadingSkills(false);
    }
  };

  useEffect(() => {
    refreshSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openCreateSkillModal = () => {
    setSelectedSkillId(null);
    setSkillSearch("");
    setIsSkillDropdownOpen(false);
    setSelectedSkillGroupId(null);
    setSkillGroupSearch("");
    setIsSkillGroupDropdownOpen(false);
    setIsCreateSkillModalOpen(true);
  };

  const openEditSkillModal = (mapping: JobRoleLevelSkill) => {
    setEditingMapping(mapping);
    setSelectedSkillId(mapping.skillId);
    setSkillSearch("");
    setIsSkillDropdownOpen(false);
    setSelectedSkillGroupId(null);
    setSkillGroupSearch("");
    setIsSkillGroupDropdownOpen(false);
  };

  const closeModals = () => {
    setIsCreateSkillModalOpen(false);
    setEditingMapping(null);
    setSelectedSkillId(null);
    setSkillSearch("");
    setIsSkillDropdownOpen(false);
    setSelectedSkillGroupId(null);
    setSkillGroupSearch("");
    setIsSkillGroupDropdownOpen(false);
  };

  const handleSaveSkillMapping = async () => {
    if (!id) return;
    const jobRoleLevelId = Number(id);
    if (!selectedSkillId || selectedSkillId <= 0) {
      alert("Vui lòng chọn kỹ năng.");
      return;
    }

    const exists = jobRoleLevelSkills.some((m) => m.skillId === selectedSkillId && m.id !== editingMapping?.id);
    if (exists) {
      alert("⚠️ Kỹ năng này đã tồn tại trong template. Không thể tạo trùng.");
      return;
    }

    try {
      if (editingMapping) {
        await jobRoleLevelSkillService.update(editingMapping.id, { jobRoleLevelId, skillId: selectedSkillId });
        setShowUpdateSkillSuccessOverlay(true);

        // Hiển thị loading overlay trong 2 giây rồi close modal và refresh
        setTimeout(() => {
          setShowUpdateSkillSuccessOverlay(false);
          closeModals();
          refreshSkills();
        }, 2000);
      } else {
        await jobRoleLevelSkillService.create({ jobRoleLevelId, skillId: selectedSkillId });
        setShowCreateSkillSuccessOverlay(true);

        // Hiển thị loading overlay trong 2 giây rồi close modal và refresh
        setTimeout(() => {
          setShowCreateSkillSuccessOverlay(false);
          closeModals();
          refreshSkills();
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu kỹ năng:", err);
      alert("Không thể lưu kỹ năng. Vui lòng thử lại.");
    }
  };

  const handleDeleteSkillMapping = async (mapping: JobRoleLevelSkill) => {
    const skillName = skillNameById.get(mapping.skillId) || `Skill #${mapping.skillId}`;
    const ok = window.confirm(`⚠️ Bạn có chắc muốn xóa kỹ năng "${skillName}" khỏi template?`);
    if (!ok) return;
    try {
      await jobRoleLevelSkillService.deleteById(mapping.id);
      setShowDeleteSkillSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi refresh
      setTimeout(() => {
        setShowDeleteSkillSuccessOverlay(false);
        refreshSkills();
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi khi xóa kỹ năng:", err);
      alert("Không thể xóa kỹ năng. Vui lòng thử lại.");
    }
  };

  const handleDelete = async () => {
    if (!id || !jobRoleLevel) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa vị trí tuyển dụng này?");
    if (!confirmDelete) return;

    try {
      await jobRoleLevelService.delete(Number(id));
      setShowDeleteJobRoleLevelSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi navigate
      setTimeout(() => {
        setShowDeleteJobRoleLevelSuccessOverlay(false);
        // Quay về trang chi tiết job role nếu có, nếu không thì về danh sách job-role-levels
        if (jobRoleLevel.jobRoleId) {
          navigate(`/admin/categories/job-roles/${jobRoleLevel.jobRoleId}`);
        } else {
          navigate("/admin/categories/job-role-levels");
        }
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
          "Không thể xóa vị trí này vì đang được sử dụng bởi các entity khác.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      // Log error for unhandled cases
      console.error("❌ Lỗi khi xóa vị trí:", err);
      alert("Không thể xóa vị trí!");
    }
  };

  const handleEdit = () => {
    navigate(`/admin/categories/job-role-levels/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Đang tải dữ liệu vị trí tuyển dụng...
      </div>
    );
  }

  if (!jobRoleLevel) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Không tìm thấy vị trí tuyển dụng
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
            {jobRoleLevel?.jobRoleId ? (
              <Link
                to={`/admin/categories/job-roles/${jobRoleLevel.jobRoleId}`}
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại loại vị trí</span>
              </Link>
            ) : (
              <Link
                to="/admin/categories/job-role-levels"
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại danh sách</span>
              </Link>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobRoleLevel.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết vị trí tuyển dụng
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white"
              >
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Layers3 className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <InfoItem label="ID" value={jobRoleLevel.id.toString()} />
            <InfoItem label="Loại vị trí (Job Role)" value={jobRoleName} />
            <InfoItem label="Cấp độ" value={levelLabels[jobRoleLevel.level] || "—"} />
            <InfoItem label="Mô tả" value={jobRoleLevel.description || "Chưa có mô tả"} />
          </div>
        </div>

        {/* Kỹ năng theo vị trí (template) */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Layers3 className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Kỹ năng theo vị trí</h2>
                  <p className="text-sm text-neutral-600 mt-0.5">
                    Template skills dùng để gợi ý khi tạo Job Request / Talent
                  </p>
                </div>
              </div>
              <Button
                onClick={openCreateSkillModal}
                className="px-4 py-2 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm kỹ năng
              </Button>
            </div>
          </div>

          <div className="p-6">
            {loadingSkills ? (
              <div className="text-neutral-500">Đang tải danh sách kỹ năng...</div>
            ) : jobRoleLevelSkills.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-neutral-500 text-lg font-medium">Chưa cấu hình kỹ năng template</p>
                <p className="text-neutral-400 text-sm mt-1">Nhấn “Thêm kỹ năng” để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobRoleLevelSkills
                  .slice()
                  .sort((a, b) => b.id - a.id)
                  .map((m) => {
                    const skillName = skillNameById.get(m.skillId) || `Skill #${m.skillId}`;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{skillName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditSkillModal(m)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-neutral-200 hover:border-primary-300 hover:text-primary-700 flex items-center gap-2"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillMapping(m)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-neutral-200 hover:border-red-300 hover:text-red-700 flex items-center gap-2"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {(isCreateSkillModalOpen || !!editingMapping) && (
        <Modal
          title={editingMapping ? "Sửa kỹ năng" : "Thêm kỹ năng"}
          subtitle={jobRoleLevel?.name || ""}
          onClose={closeModals}
          onSubmit={handleSaveSkillMapping}
          submitLabel={editingMapping ? "Lưu" : "Tạo"}
          showUpdateSkillSuccessOverlay={showUpdateSkillSuccessOverlay}
          showCreateSkillSuccessOverlay={showCreateSkillSuccessOverlay}
          showDeleteSkillSuccessOverlay={showDeleteSkillSuccessOverlay}
          showDeleteJobRoleLevelSuccessOverlay={showDeleteJobRoleLevelSuccessOverlay}
        >
          <div className="space-y-3">
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
                              selectedSkillGroupId === g.id
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
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

            <label className="block text-sm font-medium text-neutral-700">Kỹ năng</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSkillDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedSkillId ? (skillNameById.get(selectedSkillId) || `Skill #${selectedSkillId}`) : "Chọn kỹ năng"}
                </span>
                <X className={`w-4 h-4 text-neutral-400 transition-transform ${isSkillDropdownOpen ? "rotate-90" : ""}`} />
              </button>

              {isSkillDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                  <div className="p-3 border-b border-neutral-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        type="text"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Tìm kỹ năng..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {allSkills
                      .filter((s) => !selectedSkillGroupId || s.skillGroupId === selectedSkillGroupId)
                      .filter((s) => !skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                      .slice(0, 200)
                      .map((s) => {
                        const isDuplicate = jobRoleLevelSkills.some((m) => m.skillId === s.id && m.id !== editingMapping?.id);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            disabled={isDuplicate}
                            onClick={() => {
                              if (isDuplicate) return;
                              setSelectedSkillId(s.id);
                              setIsSkillDropdownOpen(false);
                              setSkillSearch("");
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              selectedSkillId === s.id
                                ? "bg-primary-50 text-primary-700"
                                : isDuplicate
                                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                  : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                            title={isDuplicate ? "Kỹ năng này đã tồn tại trong template" : ""}
                          >
                            {s.name}
                            {isDuplicate && " (đã có)"}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Lưu ý: Không cho phép tạo trùng kỹ năng trong template của vị trí này.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  onSubmit,
  submitLabel,
  showUpdateSkillSuccessOverlay,
  showCreateSkillSuccessOverlay,
  showDeleteSkillSuccessOverlay,
  showDeleteJobRoleLevelSuccessOverlay,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  showUpdateSkillSuccessOverlay?: boolean;
  showCreateSkillSuccessOverlay?: boolean;
  showDeleteSkillSuccessOverlay?: boolean;
  showDeleteJobRoleLevelSuccessOverlay?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-neutral-200">
        <div className="p-5 border-b border-neutral-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            {subtitle ? <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-5">{children}</div>

        <div className="p-5 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Update Skill Success Overlay */}
      {showUpdateSkillSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật kỹ năng thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Skill Success Overlay */}
      {showCreateSkillSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Thêm kỹ năng thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Skill Success Overlay */}
      {showDeleteSkillSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa kỹ năng thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Job Role Level Success Overlay */}
      {showDeleteJobRoleLevelSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa vị trí tuyển dụng thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-gray-900 font-medium">{value || "—"}</p>
      </div>
  );
}
