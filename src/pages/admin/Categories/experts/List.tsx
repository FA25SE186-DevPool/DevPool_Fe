import { useEffect, useState } from "react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { expertService, type Expert } from "../../../../services/Expert";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { Button } from "../../../../components/ui/button";
import {
  Search,
  Plus,
  Trash2,
  UserCog,
  Mail,
  Phone,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ExpertListPage() {
  const [loading, setLoading] = useState(true);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [onlyPartnerRepresentative, setOnlyPartnerRepresentative] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newExpert, setNewExpert] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Skill groups for assignment
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [filteredSkillGroups, setFilteredSkillGroups] = useState<SkillGroup[]>([]);
  const [skillGroupSearchTerm, setSkillGroupSearchTerm] = useState("");
  const [selectedSkillGroupIds, setSelectedSkillGroupIds] = useState<number[]>([]);
  const [loadingSkillGroups, setLoadingSkillGroups] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === "") return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === "") return true; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const expertsData = await expertService.getAll({ excludeDeleted: true });

        const expertArr = Array.isArray(expertsData) ? expertsData : [];
        setExperts(expertArr);
        setFilteredExperts(expertArr);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách expert:", err);
        setExperts([]);
        setFilteredExperts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter theo search + onlyPartnerRepresentative
  useEffect(() => {
    let list = [...experts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          (e.email && e.email.toLowerCase().includes(term)) ||
          (e.company && e.company.toLowerCase().includes(term)) ||
          (e.specialization && e.specialization.toLowerCase().includes(term))
      );
    }

    if (onlyPartnerRepresentative) {
      list = list.filter((e) => e.isPartnerRepresentative);
    }

    setFilteredExperts(list);
    setCurrentPage(1);
  }, [searchTerm, onlyPartnerRepresentative, experts]);

  // Stats
  const totalExperts = experts.length;
  const partnerRepresentatives = experts.filter((e) => e.isPartnerRepresentative).length;
  const withEmail = experts.filter((e) => e.email && e.email.trim()).length;
  const withSpecialization = experts.filter((e) => e.specialization && e.specialization.trim())
    .length;

  const stats = [
    {
      title: "Tổng chuyên gia",
      value: totalExperts.toString(),
      color: "blue",
    },
    {
      title: "Đại diện đối tác",
      value: partnerRepresentatives.toString(),
      color: "green",
    },
    {
      title: "Có email",
      value: withEmail.toString(),
      color: "purple",
    },
    {
      title: "Có chuyên môn",
      value: withSpecialization.toString(),
      color: "orange",
    },
  ];

  // Pagination calculation
  const totalPages = Math.ceil(filteredExperts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExperts = filteredExperts.slice(startIndex, endIndex);
  const startItem = filteredExperts.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredExperts.length);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa chuyên gia này?")) return;
    try {
      await expertService.delete(id);
      setExperts((prev) => prev.filter((e) => e.id !== id));
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
          "Không thể xóa chuyên gia này vì đang được sử dụng.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      // Log error for unhandled cases
      console.error("❌ Lỗi khi xóa expert:", err);
      alert("Không thể xóa chuyên gia, vui lòng thử lại.");
    }
  };

  // Fetch skill groups when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const fetchSkillGroups = async () => {
        try {
          setLoadingSkillGroups(true);
          const data = await skillGroupService.getAll({ excludeDeleted: true });
          const groups = Array.isArray(data) ? data : [];
          setSkillGroups(groups);
          setFilteredSkillGroups(groups);
        } catch (err) {
          console.error("❌ Lỗi khi tải danh sách nhóm kỹ năng:", err);
          setSkillGroups([]);
          setFilteredSkillGroups([]);
        } finally {
          setLoadingSkillGroups(false);
        }
      };
      fetchSkillGroups();
    } else {
      // Reset when modal closes
      setSelectedSkillGroupIds([]);
      setSkillGroupSearchTerm("");
    }
  }, [showCreateModal]);

  // Filter skill groups by search term
  useEffect(() => {
    if (!skillGroupSearchTerm.trim()) {
      setFilteredSkillGroups(skillGroups);
      return;
    }
    const filtered = skillGroups.filter((sg) =>
      sg.name.toLowerCase().includes(skillGroupSearchTerm.toLowerCase())
    );
    setFilteredSkillGroups(filtered);
  }, [skillGroupSearchTerm, skillGroups]);

  const handleToggleSkillGroup = (skillGroupId: number) => {
    setSelectedSkillGroupIds((prev) =>
      prev.includes(skillGroupId)
        ? prev.filter((id) => id !== skillGroupId)
        : [...prev, skillGroupId]
    );
  };

  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!newExpert.name.trim()) {
      newErrors.name = "Vui lòng nhập tên chuyên gia.";
    }

    // Validate email
    if (newExpert.email && !validateEmail(newExpert.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate phone
    if (newExpert.phone && !validatePhone(newExpert.phone)) {
      newErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setCreating(true);
      // Create expert first
      const created = await expertService.create({
        name: newExpert.name.trim(),
        email: newExpert.email || undefined,
        phone: newExpert.phone || undefined,
      });

      // Assign skill groups if any selected
      if (selectedSkillGroupIds.length > 0) {
        try {
          await Promise.all(
            selectedSkillGroupIds.map((skillGroupId) =>
              expertService.assignSkillGroup(created.id, {
                expertId: created.id,
                skillGroupId,
              })
            )
          );
        } catch (assignErr) {
          console.error("❌ Lỗi khi gán nhóm kỹ năng:", assignErr);
          // Still show success but warn about skill groups
          alert(
            `Đã tạo chuyên gia thành công, nhưng có lỗi khi gán một số nhóm kỹ năng. Vui lòng kiểm tra lại.`
          );
        }
      }

      setExperts((prev) => [...prev, created]);
      setShowCreateModal(false);
      setNewExpert({
        name: "",
        email: "",
        phone: "",
      });
      setErrors({});
      setSelectedSkillGroupIds([]);
      setSkillGroupSearchTerm("");
    } catch (err) {
      console.error("❌ Lỗi khi tạo expert:", err);
      alert("Không thể tạo chuyên gia, vui lòng thử lại.");
    } finally {
      setCreating(false);
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-8 h-8 text-primary-600" />
                Chuyên gia đánh giá (Experts)
              </h1>
              <p className="text-neutral-600 mt-1 max-w-2xl">
                Quản lý danh sách chuyên gia tham gia verify skill group cho talent.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="group bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl px-6 py-3 shadow-soft hover:shadow-glow transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Thêm chuyên gia
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      stat.color === "blue"
                        ? "bg-primary-100 text-primary-600 group-hover:bg-primary-200"
                        : stat.color === "green"
                        ? "bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200"
                        : stat.color === "purple"
                        ? "bg-accent-100 text-accent-600 group-hover:bg-accent-200"
                        : "bg-warning-100 text-warning-600 group-hover:bg-warning-200"
                    } transition-all duration-300`}
                  >
                    <UserCog className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email..."
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
              >
                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}</span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={onlyPartnerRepresentative}
                      onChange={(e) => setOnlyPartnerRepresentative(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    Chỉ hiển thị chuyên gia đại diện đối tác
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table + pagination giống SkillList */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách chuyên gia</h2>
              <div className="flex items-center gap-4">
                {filteredExperts.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === 1
                          ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredExperts.length}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === totalPages
                          ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 chuyên gia</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Tên chuyên gia
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredExperts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <UserCog className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">
                          Không có chuyên gia nào
                        </p>
                        <p className="text-neutral-400 text-sm mt-1">
                          Thử thay đổi từ khóa tìm kiếm hoặc thêm chuyên gia mới
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExperts.map((expert, index) => (
                    <tr
                      key={expert.id}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            {expert.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            ID: <span className="font-mono">{expert.id}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {expert.email ? (
                          <span className="inline-flex items-center gap-1 text-sm text-neutral-700">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            {expert.email}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {expert.phone ? (
                          <span className="inline-flex items-center gap-1 text-sm text-neutral-700">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            {expert.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/categories/experts/${expert.id}`}
                            className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 text-xs hover:bg-primary-50 hover:text-primary-800 transition-all duration-300"
                          >
                            Chi tiết
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(expert.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal tạo chuyên gia */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Thêm chuyên gia mới</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setErrors({});
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tên chuyên gia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newExpert.name}
                    onChange={(e) => {
                      setNewExpert((p) => ({ ...p, name: e.target.value }));
                      if (errors.name) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                      errors.name ? "border-red-500" : "border-neutral-300"
                    }`}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newExpert.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewExpert((p) => ({ ...p, email: value }));
                        const newErrors = { ...errors };
                        if (value && validateEmail(value)) {
                          delete newErrors.email;
                        } else if (value && !validateEmail(value)) {
                          newErrors.email = "Email không hợp lệ";
                        } else {
                          delete newErrors.email;
                        }
                        setErrors(newErrors);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                        errors.email ? "border-red-500" : "border-neutral-300"
                      }`}
                      placeholder="expert@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={newExpert.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewExpert((p) => ({ ...p, phone: value }));
                        const newErrors = { ...errors };
                        if (value && validatePhone(value)) {
                          delete newErrors.phone;
                        } else if (value && !validatePhone(value)) {
                          newErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
                        } else {
                          delete newErrors.phone;
                        }
                        setErrors(newErrors);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                        errors.phone ? "border-red-500" : "border-neutral-300"
                      }`}
                      placeholder="VD: 0901234567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Skill Groups Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Gán nhóm kỹ năng (tùy chọn)
                  </label>
                  <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm nhóm kỹ năng..."
                        value={skillGroupSearchTerm}
                        onChange={(e) => setSkillGroupSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                      />
                    </div>
                    {loadingSkillGroups ? (
                      <p className="text-xs text-neutral-500 text-center py-4">
                        Đang tải danh sách nhóm kỹ năng...
                      </p>
                    ) : filteredSkillGroups.length === 0 ? (
                      <p className="text-xs text-neutral-500 text-center py-4">
                        {skillGroupSearchTerm
                          ? "Không tìm thấy nhóm kỹ năng nào"
                          : "Không có nhóm kỹ năng nào"}
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredSkillGroups.map((sg) => (
                          <label
                            key={sg.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSkillGroupIds.includes(sg.id)}
                              onChange={() => handleToggleSkillGroup(sg.id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-700 flex-1">
                              {sg.name}
                            </span>
                            {selectedSkillGroupIds.includes(sg.id) ? (
                              <CheckSquare className="w-4 h-4 text-primary-600" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedSkillGroupIds.length > 0 && (
                      <p className="text-xs text-primary-600 mt-2 font-medium">
                        Đã chọn {selectedSkillGroupIds.length} nhóm kỹ năng
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                  disabled={creating}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-60"
                >
                  {creating ? "Đang lưu..." : "Lưu chuyên gia"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


