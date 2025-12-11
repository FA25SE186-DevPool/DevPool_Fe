import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import {
  expertService,
  type Expert,
  type ExpertSkillGroup,
} from "../../../../services/Expert";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import {
  ArrowLeft,
  UserCog,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Search,
} from "lucide-react";

export default function ExpertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [expertSkillGroups, setExpertSkillGroups] = useState<ExpertSkillGroup[]>([]);
  const [allSkillGroups, setAllSkillGroups] = useState<SkillGroup[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | "">("");
  const [editing, setEditing] = useState(false);
  const [savingExpert, setSavingExpert] = useState(false);
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState<string>("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const expertId = Number(id);
        const [expertData, groups, allGroups] = await Promise.all([
          expertService.getById(expertId),
          expertService.getSkillGroups(expertId),
          skillGroupService.getAll(),
        ]);
        setExpert(expertData);
        setEditForm({
          name: expertData.name,
          email: expertData.email || "",
          phone: expertData.phone || "",
        });
        setExpertSkillGroups(Array.isArray(groups) ? groups : []);
        const skillGroupArray = Array.isArray(allGroups)
          ? allGroups
          : Array.isArray((allGroups as any)?.items)
          ? (allGroups as any).items
          : Array.isArray((allGroups as any)?.data)
          ? (allGroups as any).data
          : [];
        setAllSkillGroups(skillGroupArray);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết expert:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isSkillGroupDropdownOpen &&
        !target.closest(".skill-group-dropdown-container")
      ) {
        setIsSkillGroupDropdownOpen(false);
        setSkillGroupSearchQuery("");
      }
    };

    if (isSkillGroupDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isSkillGroupDropdownOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleAssignSkillGroup = async () => {
    if (!expert || !selectedSkillGroupId || typeof selectedSkillGroupId !== "number") return;

    // Kiểm tra xem nhóm kỹ năng đã được gán chưa
    if (expertSkillGroups.some((g) => g.skillGroupId === selectedSkillGroupId)) {
      alert("Nhóm kỹ năng này đã được gán cho chuyên gia này rồi.");
      return;
    }

    try {
      setAssigning(true);
      const created = await expertService.assignSkillGroup(expert.id, {
        expertId: expert.id,
        skillGroupId: selectedSkillGroupId,
      });
      setExpertSkillGroups((prev) => [...prev, created]);
      setSelectedSkillGroupId("");
    } catch (err) {
      console.error("❌ Lỗi khi gán nhóm kỹ năng:", err);
      alert("Không thể gán nhóm kỹ năng, vui lòng thử lại.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignSkillGroup = async (skillGroupId: number) => {
    if (!expert) return;
    if (!confirm("Bạn có chắc muốn hủy gán nhóm kỹ năng này khỏi chuyên gia?")) return;
    try {
      await expertService.unassignSkillGroup(expert.id, skillGroupId);
      setExpertSkillGroups((prev) => prev.filter((g) => g.skillGroupId !== skillGroupId));
    } catch (err) {
      console.error("❌ Lỗi khi hủy gán nhóm kỹ năng:", err);
      alert("Không thể hủy gán nhóm kỹ năng, vui lòng thử lại.");
    }
  };

  const handleSaveExpert = async () => {
    if (!expert) return;
    
    const newErrors: Record<string, string> = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = "Tên chuyên gia không được để trống.";
    }
    
    if (editForm.email && editForm.email.trim() !== "" && !validateEmail(editForm.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    
    if (editForm.phone && editForm.phone.trim() !== "" && !validatePhone(editForm.phone)) {
      newErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Vui lòng kiểm tra lại các trường đã nhập:\n" + Object.values(newErrors).join("\n"));
      return;
    }
    
    setErrors({});
    
    try {
      setSavingExpert(true);
      await expertService.update(expert.id, {
        name: editForm.name.trim(),
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
      });
      setExpert({
        ...expert,
        name: editForm.name.trim(),
        email: editForm.email || null,
        phone: editForm.phone || null,
      });
      setEditing(false);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật chuyên gia:", err);
      alert("Không thể cập nhật chuyên gia, vui lòng thử lại.");
    } finally {
      setSavingExpert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <p className="text-neutral-600">Không tìm thấy thông tin chuyên gia.</p>
          <button
            onClick={() => navigate("/admin/categories/experts")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8 space-y-8">
        {/* Header giống các trang Detail khác */}
        <div className="mb-6 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-3">
              <div>
                <Link
                  to="/admin/categories/experts"
                  className="group inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300 mb-2"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium text-sm">Quay lại danh sách</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{expert.name}</h1>
                <p className="text-neutral-600">
                  Thông tin chi tiết về chuyên gia đánh giá skill group cho talent
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!editing && expert) {
                    setEditForm({
                      name: expert.name,
                      email: expert.email || "",
                      phone: expert.phone || "",
                    });
                    setErrors({});
                  } else if (editing) {
                    setErrors({});
                  }
                  setEditing((v) => !v);
                }}
                className="group flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 text-sm"
              >
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                {editing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
              </button>
            </div>
          </div>
        </div>

        {/* Card thông tin cơ bản của Expert */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <UserCog className="w-7 h-7 text-primary-700" />
              </div>
              <div className="space-y-1">
                {!editing ? (
                  <h2 className="text-xl font-semibold text-gray-900">{expert.name}</h2>
                ) : (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="Tên chuyên gia"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  {!editing ? (
                    <span>{expert.email || "Chưa có email"}</span>
                  ) : (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm((p) => ({ ...p, email: e.target.value }));
                        if (e.target.value && !validateEmail(e.target.value)) {
                          setErrors((prev) => ({ ...prev, email: "Email không hợp lệ" }));
                        } else {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      className={`flex-1 px-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 ${
                        errors.email ? "border-red-500 focus:border-red-500" : "border-neutral-300"
                      }`}
                      placeholder="Email"
                    />
                  )}
                </div>
                {editing && errors.email && (
                  <p className="text-xs text-red-500 ml-6">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  {!editing ? (
                    <span>{expert.phone || "Chưa có số điện thoại"}</span>
                  ) : (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm((p) => ({ ...p, phone: e.target.value }));
                        if (e.target.value && !validatePhone(e.target.value)) {
                          setErrors((prev) => ({ ...prev, phone: "Số điện thoại phải có đúng 10 chữ số" }));
                        } else {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.phone;
                            return newErrors;
                          });
                        }
                      }}
                      className={`flex-1 px-2 py-1 border rounded-md text-sm focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 ${
                        errors.phone ? "border-red-500 focus:border-red-500" : "border-neutral-300"
                      }`}
                      placeholder="Số điện thoại"
                    />
                  )}
                </div>
                {editing && errors.phone && (
                  <p className="text-xs text-red-500 ml-6">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] text-neutral-500">
                ID: <span className="font-mono">{expert.id}</span>
              </div>
              {editing && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (expert) {
                        setEditForm({
                          name: expert.name,
                          email: expert.email || "",
                          phone: expert.phone || "",
                        });
                      }
                      setErrors({});
                      setEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                    disabled={savingExpert}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExpert}
                    disabled={savingExpert}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-60"
                  >
                    {savingExpert ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skill group management */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nhóm kỹ năng phụ trách</h2>
            <Link
              to="/admin/categories/skill-groups"
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Quản lý danh sách Skill Group
            </Link>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-700">
            Chọn các <span className="font-semibold">Skill Group</span> mà chuyên gia này chịu
            trách nhiệm verify. Khi HR/TA verify skill group cho talent, bạn có thể gợi ý đúng
            chuyên gia phụ trách.
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-800">
              Thêm nhóm kỹ năng phụ trách
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] skill-group-dropdown-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsSkillGroupDropdownOpen((prev) => !prev);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all text-sm border-neutral-300 focus:border-primary-500"
                >
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <span>
                      {selectedSkillGroupId && typeof selectedSkillGroupId === "number"
                        ? allSkillGroups.find((g) => g.id === selectedSkillGroupId)?.name ||
                          "Chọn nhóm kỹ năng"
                        : "Chọn nhóm kỹ năng..."}
                    </span>
                  </div>
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
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {(() => {
                        const filtered = skillGroupSearchQuery
                          ? allSkillGroups.filter(
                              (g) =>
                                g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()) ||
                                (g.description &&
                                  g.description.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()))
                            )
                          : allSkillGroups;
                        if (filtered.length === 0) {
                          return (
                            <p className="px-4 py-3 text-sm text-neutral-500">
                              Không tìm thấy nhóm kỹ năng
                            </p>
                          );
                        }
                        return filtered
                          .filter((group) => !expertSkillGroups.some((g) => g.skillGroupId === group.id))
                          .map((group) => (
                            <button
                              type="button"
                              key={group.id}
                              onClick={() => {
                                setSelectedSkillGroupId(group.id);
                                setIsSkillGroupDropdownOpen(false);
                                setSkillGroupSearchQuery("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                selectedSkillGroupId === group.id
                                  ? "bg-primary-50 text-primary-700"
                                  : "hover:bg-neutral-50 text-neutral-700"
                              }`}
                            >
                              {group.name}
                            </button>
                          ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAssignSkillGroup}
                disabled={assigning || !selectedSkillGroupId || expertSkillGroups.some((g) => g.skillGroupId === selectedSkillGroupId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {assigning ? "Đang gán..." : "Gán nhóm"}
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <p className="text-sm font-semibold text-neutral-800 mb-3">
              Nhóm kỹ năng hiện tại
            </p>
            {expertSkillGroups.length === 0 ? (
              <div className="py-6 text-sm text-neutral-500">
                Chưa có nhóm kỹ năng nào được gán.
              </div>
            ) : (
              <ul className="space-y-2">
                {expertSkillGroups.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-900">
                        {g.skillGroupName || `Skill Group #${g.skillGroupId}`}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Gán lúc:{" "}
                        {new Date(g.assignedAt).toLocaleString("vi-VN", {
                          hour12: false,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnassignSkillGroup(g.skillGroupId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> Hủy gán
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


