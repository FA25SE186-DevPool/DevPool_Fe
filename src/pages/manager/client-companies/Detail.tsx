import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/manager/SidebarItems";
import { clientCompanyService, type ClientCompanyDetailedModel } from "../../../services/ClientCompany";
import { clientTalentBlacklistService, type ClientTalentBlacklist, type ClientTalentBlacklistCreate, type ClientTalentBlacklistRemove } from "../../../services/ClientTalentBlacklist";
import { talentService, type Talent } from "../../../services/Talent";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Plus,
  X,
  Search,
  FolderKanban,
  FileText,
  Layers,
} from "lucide-react";

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function ManagerClientCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<ClientCompanyDetailedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "assignedCVTemplates" | "jobRoleLevels" | "blacklist">("info");
  const [blacklists, setBlacklists] = useState<ClientTalentBlacklist[]>([]);
  const [loadingBlacklists, setLoadingBlacklists] = useState(false);
  
  // Add Blacklist Modal
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [talentSearchQuery, setTalentSearchQuery] = useState("");
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklistRequestedBy, setBlacklistRequestedBy] = useState("");
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);
  
  // Remove Blacklist Modal
  const [showRemoveBlacklistModal, setShowRemoveBlacklistModal] = useState(false);
  const [selectedBlacklistId, setSelectedBlacklistId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [isRemovingBlacklist, setIsRemovingBlacklist] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const data = await clientCompanyService.getDetailedById(Number(id));
        setCompany(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết công ty:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  useEffect(() => {
    const fetchBlacklists = async () => {
      if (!id || activeTab !== "blacklist") return;
      
      try {
        setLoadingBlacklists(true);
        const data = await clientTalentBlacklistService.getByClientId(Number(id), true);
        setBlacklists(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách blacklist:", err);
        setBlacklists([]);
      } finally {
        setLoadingBlacklists(false);
      }
    };

    fetchBlacklists();
  }, [id, activeTab]);

  // Fetch talents when opening Add Blacklist modal
  useEffect(() => {
    const fetchTalents = async () => {
      if (!showAddBlacklistModal) return;
      
      try {
        const talentsData = await talentService.getAll({ excludeDeleted: true });
        const talentsArray = Array.isArray(talentsData) ? talentsData : talentsData?.data || [];
        setAllTalents(talentsArray);
        setFilteredTalents(talentsArray);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách talent:", err);
        setAllTalents([]);
        setFilteredTalents([]);
      }
    };

    fetchTalents();
  }, [showAddBlacklistModal]);

  // Filter talents by search query
  useEffect(() => {
    if (!talentSearchQuery.trim()) {
      setFilteredTalents(allTalents);
      return;
    }

    const query = talentSearchQuery.toLowerCase();
    const filtered = allTalents.filter(talent => 
      talent.fullName.toLowerCase().includes(query) ||
      talent.email?.toLowerCase().includes(query) ||
      talent.phone?.toLowerCase().includes(query)
    );
    setFilteredTalents(filtered);
  }, [talentSearchQuery, allTalents]);

  // Handle Add Blacklist
  const handleOpenAddBlacklistModal = () => {
    setSelectedTalentId(null);
    setBlacklistReason("");
    setBlacklistRequestedBy(user?.name || "");
    setTalentSearchQuery("");
    setShowAddBlacklistModal(true);
  };

  const handleCloseAddBlacklistModal = () => {
    setShowAddBlacklistModal(false);
    setSelectedTalentId(null);
    setBlacklistReason("");
    setBlacklistRequestedBy("");
    setTalentSearchQuery("");
  };

  const handleAddToBlacklist = async () => {
    if (!id || !selectedTalentId) {
      alert("⚠️ Vui lòng chọn talent!");
      return;
    }

    if (!blacklistReason.trim()) {
      alert("⚠️ Vui lòng nhập lý do blacklist!");
      return;
    }

    try {
      setIsAddingBlacklist(true);
      
      const payload: ClientTalentBlacklistCreate = {
        clientCompanyId: Number(id),
        talentId: selectedTalentId,
        reason: blacklistReason.trim(),
        requestedBy: blacklistRequestedBy.trim() || user?.name || "",
      };

      await clientTalentBlacklistService.add(payload);
      alert("✅ Đã thêm talent vào blacklist thành công!");
      
      // Refresh blacklist
      const data = await clientTalentBlacklistService.getByClientId(Number(id), true);
      setBlacklists(Array.isArray(data) ? data : data?.data || []);
      
      handleCloseAddBlacklistModal();
    } catch (error: any) {
      console.error("❌ Lỗi thêm vào blacklist:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể thêm vào blacklist!";
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setIsAddingBlacklist(false);
    }
  };

  // Handle Remove Blacklist
  const handleOpenRemoveBlacklistModal = (blacklistId: number) => {
    setSelectedBlacklistId(blacklistId);
    setRemovalReason("");
    setShowRemoveBlacklistModal(true);
  };

  const handleCloseRemoveBlacklistModal = () => {
    setShowRemoveBlacklistModal(false);
    setSelectedBlacklistId(null);
    setRemovalReason("");
  };

  const handleRemoveFromBlacklist = async () => {
    if (!selectedBlacklistId) return;

    try {
      setIsRemovingBlacklist(true);
      
      const payload: ClientTalentBlacklistRemove = {
        removedBy: user?.name || "",
        removalReason: removalReason.trim() || undefined,
      };

      await clientTalentBlacklistService.removeBlacklist(selectedBlacklistId, payload);
      alert("✅ Đã gỡ bỏ talent khỏi blacklist thành công!");
      
      // Refresh blacklist
      const data = await clientTalentBlacklistService.getByClientId(Number(id), true);
      setBlacklists(Array.isArray(data) ? data : data?.data || []);
      
      handleCloseRemoveBlacklistModal();
    } catch (error: any) {
      console.error("❌ Lỗi gỡ bỏ blacklist:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể gỡ bỏ blacklist!";
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setIsRemovingBlacklist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu công ty...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy công ty</p>
            <Link
              to="/manager/client-companies"
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
      <Sidebar items={sidebarItems} title="Manager" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/manager/client-companies"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết công ty khách hàng
              </p>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-blue-50">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Code: {company.code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "info"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Thông tin công ty
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "projects"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Dự án
                {company?.projects && company.projects.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                    {company.projects.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("assignedCVTemplates")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "assignedCVTemplates"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                CV Templates
                {company?.assignedCVTemplates && company.assignedCVTemplates.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                    {company.assignedCVTemplates.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("jobRoleLevels")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "jobRoleLevels"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Layers className="w-4 h-4" />
                Vị trí tuyển dụng
                {company?.jobRoleLevels && company.jobRoleLevels.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                    {company.jobRoleLevels.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("blacklist")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "blacklist"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Ban className="w-4 h-4" />
                Blacklisted Talents
                {blacklists.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                    {blacklists.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem
                    label="Mã công ty"
                    value={company.code}
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Tên công ty"
                    value={company.name}
                    icon={<Building2 className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Mã số thuế"
                    value={company.taxCode ?? "—"}
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Người đại diện"
                    value={company.contactPerson ?? "—"}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Chức vụ"
                    value={company.position ?? "—"}
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Email"
                    value={company.email ?? "—"}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Số điện thoại"
                    value={company.phone ?? "—"}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Ngày tạo"
                    value={formatDateTime(company.createdAt)}
                    icon={<Clock className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Ngày cập nhật"
                    value={formatDateTime(company.updatedAt)}
                    icon={<Clock className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Địa chỉ"
                    value={company.address ?? "—"}
                    icon={<MapPin className="w-4 h-4" />}
                    className="col-span-2"
                  />
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="animate-fade-in">
                {!company.projects || company.projects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderKanban className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có dự án nào</p>
                    <p className="text-neutral-400 text-sm mt-2">Danh sách dự án của công ty này sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {company.projects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/manager/projects/${project.id}`}
                        className="block border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-primary-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                            {project.description && (
                              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{project.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                              {project.startDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Bắt đầu: {new Date(project.startDate).toLocaleDateString("vi-VN")}</span>
                                </div>
                              )}
                              {project.status && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Trạng thái: {project.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "assignedCVTemplates" && (
              <div className="animate-fade-in">
                {!company.assignedCVTemplates || company.assignedCVTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có CV Template nào được gán</p>
                    <p className="text-neutral-400 text-sm mt-2">Danh sách CV Template được gán cho công ty này sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {company.assignedCVTemplates.map((template) => (
                      <div
                        key={`${template.clientCompanyId}-${template.templateId}`}
                        className="border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-primary-100 rounded-lg">
                                <FileText className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{template.templateName}</h3>
                                {template.templateDescription && (
                                  <p className="text-sm text-neutral-500 mt-1">{template.templateDescription}</p>
                                )}
                              </div>
                            </div>
                            <div className="ml-12 space-y-2">
                              {template.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Mặc định
                                </span>
                              )}
                              <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <Clock className="w-4 h-4" />
                                <span>Gán vào: {formatDateTime(template.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "jobRoleLevels" && (
              <div className="animate-fade-in">
                {!company.jobRoleLevels || company.jobRoleLevels.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có vị trí tuyển dụng nào</p>
                    <p className="text-neutral-400 text-sm mt-2">Danh sách vị trí tuyển dụng của công ty này sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-neutral-50 to-primary-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-600 uppercase">Vị trí</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-600 uppercase">Mức lương tối thiểu</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-600 uppercase">Mức lương tối đa</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-600 uppercase">Tiền tệ</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-600 uppercase">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {company.jobRoleLevels.map((jobRoleLevel) => (
                          <tr key={jobRoleLevel.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              Vị trí #{jobRoleLevel.jobRoleLevelId}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {jobRoleLevel.expectedMinRate ? jobRoleLevel.expectedMinRate.toLocaleString("vi-VN") : "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {jobRoleLevel.expectedMaxRate ? jobRoleLevel.expectedMaxRate.toLocaleString("vi-VN") : "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {jobRoleLevel.currency || "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-600">
                              {jobRoleLevel.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "blacklist" && (
              <div className="animate-fade-in">
                {/* Header with Add New button */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách Blacklisted Talents</h3>
                  <Button
                    onClick={handleOpenAddBlacklistModal}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    Thêm vào Blacklist
                  </Button>
                </div>

                {loadingBlacklists ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Đang tải danh sách blacklist...</p>
                    </div>
                  </div>
                ) : blacklists.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ban className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có ứng viên nào bị blacklist</p>
                    <p className="text-neutral-400 text-sm mt-2">Danh sách này sẽ hiển thị các ứng viên đã bị thêm vào blacklist</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blacklists.map((blacklist) => (
                      <div
                        key={blacklist.id}
                        className="border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <Ban className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {blacklist.talentName || `Talent #${blacklist.talentId}`}
                                </h3>
                                <p className="text-sm text-neutral-500 mt-1">
                                  Thêm vào blacklist: {formatDateTime(blacklist.blacklistedDate)}
                                </p>
                              </div>
                            </div>
                            <div className="ml-12 space-y-2">
                              <div>
                                <p className="text-sm font-medium text-neutral-700 mb-1">Lý do:</p>
                                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                                  {blacklist.reason || "—"}
                                </p>
                              </div>
                              {blacklist.requestedBy && (
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                  <User className="w-4 h-4" />
                                  <span>Yêu cầu bởi: {blacklist.requestedBy}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Manager luôn thấy nút Gỡ bỏ */}
                          <button
                            onClick={() => handleOpenRemoveBlacklistModal(blacklist.id)}
                            className="ml-4 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            title="Gỡ bỏ blacklist"
                          >
                            Gỡ bỏ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Blacklist Modal - Giống Sales */}
        {showAddBlacklistModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isAddingBlacklist) {
                handleCloseAddBlacklistModal();
              }
            }}
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-neutral-200 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Thêm Talent vào Blacklist</h3>
                </div>
                <button
                  onClick={handleCloseAddBlacklistModal}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Đóng"
                  disabled={isAddingBlacklist}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm Talent <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={talentSearchQuery}
                      onChange={(e) => setTalentSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên, email, số điện thoại..."
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      disabled={isAddingBlacklist}
                    />
                  </div>
                  
                  {talentSearchQuery && filteredTalents.length > 0 && (
                    <div className="mt-2 border border-neutral-200 rounded-lg max-h-60 overflow-y-auto">
                      {filteredTalents.map((talent) => {
                        const isAlreadyBlacklisted = blacklists.some(b => b.talentId === talent.id && b.isActive);
                        return (
                          <button
                            key={talent.id}
                            onClick={() => !isAlreadyBlacklisted && setSelectedTalentId(talent.id)}
                            disabled={isAlreadyBlacklisted || isAddingBlacklist}
                            className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 ${
                              selectedTalentId === talent.id ? "bg-primary-50 border-primary-200" : ""
                            } ${isAlreadyBlacklisted ? "opacity-50 cursor-not-allowed bg-neutral-100" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{talent.fullName}</p>
                                <p className="text-sm text-neutral-500">{talent.email}</p>
                                {talent.phone && <p className="text-xs text-neutral-400">{talent.phone}</p>}
                              </div>
                              {isAlreadyBlacklisted && (
                                <span className="text-xs text-red-600 font-medium">Đã blacklist</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {selectedTalentId && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900">
                        Đã chọn: {allTalents.find(t => t.id === selectedTalentId)?.fullName}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Người yêu cầu
                  </label>
                  <input
                    type="text"
                    value={blacklistRequestedBy}
                    onChange={(e) => setBlacklistRequestedBy(e.target.value)}
                    placeholder="Nhập tên người yêu cầu..."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    disabled={isAddingBlacklist}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do blacklist <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    placeholder="Ví dụ: Thái độ làm việc kém, không phù hợp với văn hóa công ty..."
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    disabled={isAddingBlacklist}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Vui lòng nhập lý do rõ ràng để tham khảo sau này.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                <Button
                  onClick={handleCloseAddBlacklistModal}
                  disabled={isAddingBlacklist}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAddToBlacklist}
                  disabled={isAddingBlacklist || !selectedTalentId || !blacklistReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingBlacklist ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Xác nhận thêm vào Blacklist
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Blacklist Modal - Giống Sales */}
        {showRemoveBlacklistModal && selectedBlacklistId && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isRemovingBlacklist) {
                handleCloseRemoveBlacklistModal();
              }
            }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Gỡ bỏ khỏi Blacklist</h3>
                </div>
                <button
                  onClick={handleCloseRemoveBlacklistModal}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Đóng"
                  disabled={isRemovingBlacklist}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-sm text-neutral-600 mb-4">
                    Bạn đang gỡ bỏ talent khỏi blacklist. Talent này sẽ lại có thể được gợi ý cho Client này trong các lần matching tiếp theo.
                  </p>
                  
                  {(() => {
                    const blacklist = blacklists.find(b => b.id === selectedBlacklistId);
                    if (blacklist) {
                      return (
                        <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Talent: {blacklist.talentName || `Talent #${blacklist.talentId}`}
                          </p>
                          <p className="text-xs text-neutral-600">
                            Lý do blacklist ban đầu: {blacklist.reason || "—"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do gỡ bỏ (tùy chọn)
                  </label>
                  <textarea
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    placeholder="Ví dụ: Talent đã thay đổi, Client yêu cầu gỡ bỏ..."
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    disabled={isRemovingBlacklist}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                <Button
                  onClick={handleCloseRemoveBlacklistModal}
                  disabled={isRemovingBlacklist}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleRemoveFromBlacklist}
                  disabled={isRemovingBlacklist}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRemovingBlacklist ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận gỡ bỏ
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon, className }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`group ${className || ''}`}>
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

