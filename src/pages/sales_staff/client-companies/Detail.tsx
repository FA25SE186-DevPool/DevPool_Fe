import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { clientCompanyService, type ClientCompanyDetailedModel } from "../../../services/ClientCompany";
import { clientTalentBlacklistService, type ClientTalentBlacklist, type ClientTalentBlacklistCreate, type ClientTalentBlacklistRemove } from "../../../services/ClientTalentBlacklist";
import { talentService, type Talent } from "../../../services/Talent";
import { clientCompanyCVTemplateService } from "../../../services/ClientCompanyTemplate";
import { cvTemplateService, type CVTemplate } from "../../../services/CVTemplate";
import { clientJobRoleLevelService, type ClientJobRoleLevelCreate } from "../../../services/ClientJobRoleLevel";
import { jobRoleLevelService, type JobRoleLevel } from "../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";
import {
  Edit,
  Trash2,
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
  Filter,
  Target,
  FolderKanban,
  FileText,
  Hash,
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

export default function ClientCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<ClientCompanyDetailedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "blacklist">("info");
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
  
  // Blacklist Detail Modal
  const [showBlacklistDetailModal, setShowBlacklistDetailModal] = useState(false);
  const [selectedBlacklist, setSelectedBlacklist] = useState<ClientTalentBlacklist | null>(null);
  
  // Assign Template Modal
  const [showAssignTemplateModal, setShowAssignTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<CVTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>("");
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templatePreviewRef = useRef<HTMLDivElement>(null);
  
  // Add Job Role Level Modal
  const [showAddJobRoleLevelModal, setShowAddJobRoleLevelModal] = useState(false);
  const [availableJobRoleLevels, setAvailableJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [jobRoleFilterId, setJobRoleFilterId] = useState<number | null>(null);
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [jobRoleLevelSearch, setJobRoleLevelSearch] = useState<string>("");
  const [isJobRoleLevelDropdownOpen, setIsJobRoleLevelDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState<string>("");
  const [editingJobRoleLevelId, setEditingJobRoleLevelId] = useState<number | null>(null);
  
  // Danh sách các loại tiền tệ phổ biến
  const currencies = [
    { code: "VND", name: "Việt Nam Đồng (VND)" },
    { code: "USD", name: "US Dollar (USD)" },
    { code: "EUR", name: "Euro (EUR)" },
    { code: "GBP", name: "British Pound (GBP)" },
    { code: "JPY", name: "Japanese Yen (JPY)" },
    { code: "CNY", name: "Chinese Yuan (CNY)" },
    { code: "SGD", name: "Singapore Dollar (SGD)" },
    { code: "THB", name: "Thai Baht (THB)" },
    { code: "KRW", name: "South Korean Won (KRW)" },
    { code: "AUD", name: "Australian Dollar (AUD)" },
    { code: "CAD", name: "Canadian Dollar (CAD)" },
    { code: "CHF", name: "Swiss Franc (CHF)" },
    { code: "HKD", name: "Hong Kong Dollar (HKD)" },
    { code: "MYR", name: "Malaysian Ringgit (MYR)" },
    { code: "IDR", name: "Indonesian Rupiah (IDR)" },
    { code: "PHP", name: "Philippine Peso (PHP)" },
    { code: "INR", name: "Indian Rupee (INR)" },
  ];
  const [jobRoleLevelForm, setJobRoleLevelForm] = useState<ClientJobRoleLevelCreate>({
    clientCompanyId: Number(id) || 0,
    jobRoleLevelId: 0,
    expectedMinRate: null,
    expectedMaxRate: null,
    currency: "VND",
    notes: null,
  });
  const [isCreatingJobRoleLevel, setIsCreatingJobRoleLevel] = useState(false);

  // Success overlay state
  const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean; type: 'loading' | 'success'; message: string }>({
    show: false,
    type: 'loading',
    message: '',
  });

  // Helper functions for overlay

  const showSuccessOverlay = (message: string) => {
    setLoadingOverlay({
      show: true,
      type: 'success',
      message,
    });
    // Auto hide after 2 seconds
    setTimeout(() => {
      setLoadingOverlay({ show: false, type: 'loading', message: '' });
    }, 2000);
  };


  // Notes Detail Modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string>("");
  
  // Helper function để format số tiền
  const formatCurrency = (value: string | number | null | undefined): string => {
    if (!value && value !== 0) return "";
    const numValue = typeof value === "string" ? parseFloat(value.replace(/\./g, "")) : value;
    if (isNaN(numValue)) return "";
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Helper function để lấy tên hiển thị của currency code
  const getCurrencyDisplay = (currencyCode: string | null | undefined): string => {
    if (!currencyCode) return "VNĐ";
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.code : currencyCode;
  };

  // Handle rate change - chỉ cho phép nhập số và format hiển thị
  const handleMinRateChange = (value: string) => {
    // Chỉ cho phép nhập số (loại bỏ tất cả ký tự không phải số)
    const cleaned = value.replace(/\D/g, "");
    // Nếu rỗng, set về null
    if (cleaned === "") {
      setJobRoleLevelForm({ ...jobRoleLevelForm, expectedMinRate: null });
      return;
    }
    // Parse và lưu số vào state
    const numValue = parseInt(cleaned, 10);
    if (!isNaN(numValue)) {
      setJobRoleLevelForm({ ...jobRoleLevelForm, expectedMinRate: numValue });
    }
  };

  const handleMaxRateChange = (value: string) => {
    // Chỉ cho phép nhập số (loại bỏ tất cả ký tự không phải số)
    const cleaned = value.replace(/\D/g, "");
    // Nếu rỗng, set về null
    if (cleaned === "") {
      setJobRoleLevelForm({ ...jobRoleLevelForm, expectedMaxRate: null });
      return;
    }
    // Parse và lưu số vào state
    const numValue = parseInt(cleaned, 10);
    if (!isNaN(numValue)) {
      setJobRoleLevelForm({ ...jobRoleLevelForm, expectedMaxRate: numValue });
    }
  };
  
  const { user } = useAuth();
  const isManager = user?.role === "Manager" || user?.role === "Admin";

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const data = await clientCompanyService.getDetailedById(Number(id));
        console.log("📦 Dữ liệu công ty:", data);
        setCompany(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết công ty:", err);
        alert("Không thể tải thông tin công ty. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    }
  }, [id]);

  // Load danh sách JobRole dùng cho filter vị trí tuyển dụng
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const jobRolesData = await jobRoleService.getAll({ excludeDeleted: true });
        const jobRolesArray = ensureArray<JobRole>(jobRolesData);
        setJobRoles(jobRolesArray);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách job role:", err);
        setJobRoles([]);
      }
    };

    fetchJobRoles();
  }, []);

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
        const talentsArray = ensureArray<Talent>(talentsData);
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

  // Fetch available templates when opening Assign Template modal
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!showAssignTemplateModal || !id) return;
      
      try {
        const templates = await cvTemplateService.getAll({ excludeDeleted: true });
        const templatesArray = ensureArray<CVTemplate>(templates);
        
        // Filter out already assigned templates
        const assignedTemplateIds = company?.assignedCVTemplates?.map(t => t.templateId) || [];
        const available = templatesArray.filter((t: CVTemplate) => !assignedTemplateIds.includes(t.id));
        
        setAvailableTemplates(available);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách template:", err);
        setAvailableTemplates([]);
      }
    };

    fetchTemplates();
  }, [showAssignTemplateModal, id, company?.assignedCVTemplates]);

  // Auto scroll to preview when template is selected
  useEffect(() => {
    if (selectedTemplateId && templatePreviewRef.current && showAssignTemplateModal) {
      // Dùng requestAnimationFrame để đảm bảo DOM đã render
      requestAnimationFrame(() => {
        setTimeout(() => {
          const contentContainer = document.getElementById('template-modal-content');
          if (contentContainer && templatePreviewRef.current) {
            // Tính toán vị trí relative với container
            const containerRect = contentContainer.getBoundingClientRect();
            const previewRect = templatePreviewRef.current.getBoundingClientRect();
            const scrollTop = contentContainer.scrollTop;
            const relativeTop = previewRect.top - containerRect.top + scrollTop;
            
            // Scroll để preview hiển thị ở đầu container (với padding)
            contentContainer.scrollTo({
              top: relativeTop - 30,
              behavior: 'smooth'
            });
          } else if (templatePreviewRef.current) {
            // Fallback: scroll vào view với block start
            templatePreviewRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 300);
      });
    }
  }, [selectedTemplateId, showAssignTemplateModal]);

  // Fetch all job role levels when opening Add Job Role Level modal (không filter, hiển thị tất cả)
  useEffect(() => {
    const fetchJobRoleLevels = async () => {
      if (!showAddJobRoleLevelModal || !id) return;
      
      try {
        const jobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true });
        const jobRoleLevelsArray = ensureArray<JobRoleLevel>(jobRoleLevels);
        
        // Không filter ra, hiển thị tất cả (các vị trí đã chọn sẽ bị disable trong dropdown)
        setAvailableJobRoleLevels(jobRoleLevelsArray);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách job role level:", err);
        setAvailableJobRoleLevels([]);
      }
    };

    fetchJobRoleLevels();
  }, [showAddJobRoleLevelModal, id]);

  const handleDelete = async () => {
    if (!id) return;
    
    // Kiểm tra nếu công ty có dự án thì không cho xóa
    if (company?.projects && company.projects.length > 0) {
      alert("⚠️ Không thể xóa công ty này vì công ty đang có dự án. Vui lòng xóa hoặc chuyển các dự án trước khi xóa công ty.");
      return;
    }
    
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa công ty này?");
    if (!confirmDelete) return;

    try {
      await clientCompanyService.delete(Number(id));
      showSuccessOverlay("✅ Xóa công ty thành công!");
      navigate("/sales/clients");
    } catch (err) {
      console.error("❌ Lỗi khi xóa công ty:", err);
      alert("Không thể xóa công ty!");
    }
  };

  const handleEdit = () => {
    navigate(`/sales/clients/edit/${id}`);
  };

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
      showSuccessOverlay("✅ Đã thêm talent vào blacklist thành công!");
      
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
    if (!isManager) {
      alert("⚠️ Chỉ Manager mới có quyền gỡ bỏ blacklist!");
      return;
    }
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
      showSuccessOverlay("✅ Đã gỡ bỏ talent khỏi blacklist thành công!");
      
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

  // Handle Assign Template
  const handleCloseAssignTemplateModal = () => {
    setShowAssignTemplateModal(false);
    setSelectedTemplateId(null);
    setTemplateSearchQuery("");
    setIsTemplateDropdownOpen(false);
  };

  const handleAssignTemplate = async () => {
    if (!id || !selectedTemplateId) {
      alert("⚠️ Vui lòng chọn template!");
      return;
    }

    try {
      setIsAssigningTemplate(true);
      await clientCompanyCVTemplateService.assignTemplate(Number(id), selectedTemplateId);
      showSuccessOverlay("✅ Đã gán template thành công!");
      
      // Refresh company data
      const data = await clientCompanyService.getDetailedById(Number(id));
      setCompany(data);
      
      handleCloseAssignTemplateModal();
    } catch (error: any) {
      console.error("❌ Lỗi gán template:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể gán template!";
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setIsAssigningTemplate(false);
    }
  };

  const handleCloseAddJobRoleLevelModal = () => {
    setShowAddJobRoleLevelModal(false);
    setEditingJobRoleLevelId(null);
    setJobRoleLevelForm({
      clientCompanyId: Number(id) || 0,
      jobRoleLevelId: 0,
      expectedMinRate: null,
      expectedMaxRate: null,
      currency: "VND",
      notes: null,
    });
    setJobRoleFilterId(null);
    setJobRoleLevelSearch("");
    setIsCurrencyDropdownOpen(false);
    setCurrencySearch("");
  };

  // Create or update Job Role Level
  const handleSaveJobRoleLevel = async () => {
    if (!id || !jobRoleLevelForm.jobRoleLevelId) {
      alert("⚠️ Vui lòng chọn vị trí tuyển dụng!");
      return;
    }

    try {
      setIsCreatingJobRoleLevel(true);

      if (editingJobRoleLevelId) {
        // Update existing
        await clientJobRoleLevelService.update(editingJobRoleLevelId, {
          ...jobRoleLevelForm,
          clientCompanyId: Number(id),
        });
        showSuccessOverlay("✅ Đã cập nhật vị trí tuyển dụng thành công!");
      } else {
        // Create new
        await clientJobRoleLevelService.create({
          ...jobRoleLevelForm,
          clientCompanyId: Number(id),
        });
        showSuccessOverlay("✅ Đã thêm vị trí tuyển dụng thành công!");
      }
      
      // Refresh company data
      const data = await clientCompanyService.getDetailedById(Number(id));
      setCompany(data);
      
      handleCloseAddJobRoleLevelModal();
    } catch (error: any) {
      console.error("❌ Lỗi lưu vị trí tuyển dụng:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể lưu vị trí tuyển dụng!";
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setIsCreatingJobRoleLevel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
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
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy công ty</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Công ty", to: "/sales/clients" },
              { label: company.name }
            ]}
          />

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
                    Mã: {company.code}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                disabled={company?.projects && company.projects.length > 0}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-soft"
                title={company?.projects && company.projects.length > 0 ? "Không thể xóa công ty có dự án" : ""}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Cột 1 */}
                  <div className="space-y-6">
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
                      value={company.contactPerson}
                      icon={<User className="w-4 h-4" />}
                    />
                    <InfoItem
                      label="Chức vụ"
                      value={company.position ?? "—"}
                      icon={<Briefcase className="w-4 h-4" />}
                    />
                    <InfoItem
                      label="Địa chỉ"
                      value={company.address ?? "—"}
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                  
                  {/* Cột 2 */}
                  <div className="space-y-6">
                    <InfoItem
                      label="Email"
                      value={company.email}
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
                    {company.updatedAt && (() => {
                      const updatedDate = new Date(company.updatedAt);
                      const isValidDate = !isNaN(updatedDate.getTime()) && updatedDate.getFullYear() > 1970;
                      return isValidDate ? (
                        <InfoItem
                          label="Ngày cập nhật"
                          value={formatDateTime(company.updatedAt)}
                          icon={<Clock className="w-4 h-4" />}
                        />
                      ) : null;
                    })()}
                  </div>
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
                    {company.projects.map((project) => {
                      const statusLabels: Record<string, string> = {
                        Planned: "Đã lên kế hoạch",
                        Ongoing: "Đang thực hiện",
                        OnHold: "Tạm dừng",
                        Completed: "Đã hoàn thành"
                      };

                      const getStatusColor = (status: string) => {
                        if (status === 'Ongoing') return 'bg-blue-100 text-blue-800 border-blue-200';
                        if (status === 'Planned') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        if (status === 'OnHold') return 'bg-purple-100 text-purple-800 border-purple-200';
                        if (status === 'Completed') return 'bg-green-100 text-green-800 border-green-200';
                        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
                      };
                      
                      return (
                        <Link
                          key={project.id}
                          to={`/sales/projects/${project.id}`}
                          className="block border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-primary-300 relative"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                {project.code && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium text-neutral-600 bg-neutral-100 rounded-lg">
                                    <Hash className="w-3 h-3" />
                                    {project.code}
                                  </span>
                                )}
                              </div>
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
                              </div>
                            </div>
                            {project.status && (
                              <div className="ml-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(project.status)}`}>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {statusLabels[project.status] || project.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
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
                        onClick={() => {
                          setSelectedBlacklist(blacklist);
                          setShowBlacklistDetailModal(true);
                        }}
                        className="border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer hover:border-red-300"
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
                          </div>
                          {isManager && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRemoveBlacklistModal(blacklist.id);
                              }}
                              className="ml-4 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              title="Gỡ bỏ blacklist (Chỉ Manager)"
                            >
                              Gỡ bỏ
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Blacklist Modal */}
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
                <button
                  type="button"
                  onClick={handleCloseAddBlacklistModal}
                  disabled={isAddingBlacklist}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
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

        {/* Remove Blacklist Modal */}
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

        {/* Blacklist Detail Modal */}
        {showBlacklistDetailModal && selectedBlacklist && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBlacklistDetailModal(false);
                setSelectedBlacklist(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết Blacklist</h3>
                <button
                  onClick={() => {
                    setShowBlacklistDetailModal(false);
                    setSelectedBlacklist(null);
                  }}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Ban className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedBlacklist.talentName || `Talent #${selectedBlacklist.talentId}`}
                    </h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Mã Talent: #{selectedBlacklist.talentId}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Ngày thêm vào blacklist</label>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span>{formatDateTime(selectedBlacklist.blacklistedDate)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Lý do</label>
                    <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 min-h-[80px]">
                      {selectedBlacklist.reason || "—"}
                    </div>
                  </div>

                  {selectedBlacklist.requestedBy && (
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">Yêu cầu bởi</label>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>{selectedBlacklist.requestedBy}</span>
                      </div>
                    </div>
                  )}
                </div>

                {isManager && selectedBlacklist.isActive && (
                  <div className="pt-4 border-t border-neutral-200">
                    <Button
                      onClick={() => {
                        setShowBlacklistDetailModal(false);
                        handleOpenRemoveBlacklistModal(selectedBlacklist.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Gỡ bỏ khỏi Blacklist
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assign Template Modal */}
        {showAssignTemplateModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isAssigningTemplate) {
                handleCloseAssignTemplateModal();
              }
            }}
          >
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-neutral-200 overflow-hidden flex flex-col" style={{ maxHeight: '95vh' }}>
              <div className="px-8 py-5 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
                <h2 className="text-2xl font-semibold text-gray-900">Gán CV Template cho công ty</h2>
                <button
                  onClick={handleCloseAssignTemplateModal}
                  disabled={isAssigningTemplate}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="template-modal-content" className="px-8 py-6 overflow-y-auto flex-1" style={{ minHeight: '60vh', maxHeight: 'calc(95vh - 140px)' }}>
                {availableTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-500">Không còn template nào để gán</p>
                    <p className="text-sm text-neutral-400 mt-1">Tất cả templates đã được gán cho công ty này</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Template Dropdown */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-3">
                        Chọn CV Template <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsTemplateDropdownOpen(prev => !prev)}
                          disabled={isAssigningTemplate}
                          className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                            !selectedTemplateId ? 'border-neutral-300 focus:border-primary-500' : 'border-primary-300 bg-primary-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-2 text-base text-neutral-700">
                            <FileText className="w-4 h-4 text-neutral-400" />
                            <span>
                              {selectedTemplateId
                                ? availableTemplates.find(t => t.id === selectedTemplateId)?.name || "Chọn template"
                                : "Chọn template"}
                            </span>
                          </div>
                        </button>
                        {isTemplateDropdownOpen && !isAssigningTemplate && (
                          <div 
                            className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                            onMouseLeave={() => {
                              setIsTemplateDropdownOpen(false);
                              setTemplateSearchQuery("");
                            }}
                          >
                            <div className="p-3 border-b border-neutral-100">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <input
                                  type="text"
                                  value={templateSearchQuery}
                                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                  placeholder="Tìm template theo tên hoặc mô tả..."
                                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {(() => {
                                const filteredTemplates = templateSearchQuery.trim()
                                  ? availableTemplates.filter((template) => {
                                      const query = templateSearchQuery.toLowerCase();
                                      return (
                                        template.name.toLowerCase().includes(query) ||
                                        (template.description && template.description.toLowerCase().includes(query))
                                      );
                                    })
                                  : availableTemplates;

                                if (filteredTemplates.length === 0) {
                                  return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy template nào</p>;
                                }

                                return filteredTemplates.map((template) => (
                                  <button
                                    type="button"
                                    key={template.id}
                                    onClick={() => {
                                      setSelectedTemplateId(template.id);
                                      setIsTemplateDropdownOpen(false);
                                      setTemplateSearchQuery("");
                                      
                                      // Scroll to preview ngay sau khi chọn
                                      setTimeout(() => {
                                        const contentContainer = document.getElementById('template-modal-content');
                                        if (contentContainer && templatePreviewRef.current) {
                                          const containerRect = contentContainer.getBoundingClientRect();
                                          const previewRect = templatePreviewRef.current.getBoundingClientRect();
                                          const scrollTop = contentContainer.scrollTop;
                                          const relativeTop = previewRect.top - containerRect.top + scrollTop;
                                          
                                          contentContainer.scrollTo({
                                            top: relativeTop - 30,
                                            behavior: 'smooth'
                                          });
                                        }
                                      }, 100);
                                    }}
                                    className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 ${
                                      selectedTemplateId === template.id ? "bg-primary-50 border-primary-200" : ""
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="p-2 bg-primary-100 rounded-lg">
                                            <FileText className="w-5 h-5 text-primary-600" />
                                          </div>
                                          <div>
                                            <h3 className="font-semibold text-gray-900 text-base">{template.name}</h3>
                                            {template.description && (
                                              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{template.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        {template.isDefault && (
                                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-2 ml-14">
                                            Template mặc định
                                          </span>
                                        )}
                                      </div>
                                      {selectedTemplateId === template.id && (
                                        <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                                      )}
                                    </div>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Template Preview */}
                    {selectedTemplateId && (
                      <div ref={templatePreviewRef} className="p-5 border-2 border-primary-200 rounded-xl bg-primary-50 animate-fade-in">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2.5 bg-primary-100 rounded-lg">
                                <FileText className="w-6 h-6 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {availableTemplates.find(t => t.id === selectedTemplateId)?.name}
                                </h3>
                                {availableTemplates.find(t => t.id === selectedTemplateId)?.description && (
                                  <p className="text-sm text-neutral-500 mt-2">
                                    {availableTemplates.find(t => t.id === selectedTemplateId)?.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            {availableTemplates.find(t => t.id === selectedTemplateId)?.isDefault && (
                              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-2">
                                Template mặc định
                              </span>
                            )}
                          </div>
                          <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
                <Button
                  onClick={handleCloseAssignTemplateModal}
                  disabled={isAssigningTemplate}
                  className="px-5 py-2.5 text-base font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAssignTemplate}
                  disabled={isAssigningTemplate || !selectedTemplateId}
                  className="px-5 py-2.5 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAssigningTemplate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Gán Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Job Role Level Modal */}
        {showAddJobRoleLevelModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isCreatingJobRoleLevel) {
                handleCloseAddJobRoleLevelModal();
              }
            }}
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-neutral-200 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Thêm vị trí tuyển dụng</h2>
                <button
                  onClick={handleCloseAddJobRoleLevelModal}
                  disabled={isCreatingJobRoleLevel}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí tuyển dụng <span className="text-red-500">*</span>
                  </label>
                  {availableJobRoleLevels.length === 0 ? (
                    <div className="text-center py-4 border border-neutral-200 rounded-lg bg-neutral-50">
                      <p className="text-sm text-neutral-500">Không có vị trí nào</p>
                      <p className="text-xs text-neutral-400 mt-1">Vui lòng thêm vị trí vào hệ thống trước</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Lọc theo Job Role (loại vị trí) - giống lọc nhóm kỹ năng */}
                      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                        <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5" />
                          Lọc danh sách vị trí tuyển dụng theo loại vị trí
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsJobRoleFilterDropdownOpen(prev => !prev)}
                            disabled={isCreatingJobRoleLevel}
                            className="w-full flex items-center justify-between px-3 py-1.5 border rounded-lg bg-white text-left focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-all border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-2 text-xs text-neutral-700">
                              <Filter className="w-3.5 h-3.5 text-neutral-400" />
                              <span>
                                {jobRoleFilterId
                                  ? jobRoles.find(jr => jr.id === jobRoleFilterId)?.name || "Loại vị trí"
                                  : "Tất cả loại vị trí"}
                              </span>
                            </div>
                          </button>
                          {isJobRoleFilterDropdownOpen && !isCreatingJobRoleLevel && (
                            <div 
                              className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
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
                                  />
                                </div>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setJobRoleFilterId(null);
                                    setIsJobRoleFilterDropdownOpen(false);
                                    setJobRoleFilterSearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    !jobRoleFilterId
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  Tất cả loại vị trí
                                </button>
                                {(() => {
                                  const filtered = jobRoleFilterSearch
                                    ? jobRoles.filter(jr =>
                                      jr.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
                                    )
                                    : jobRoles;
                                  if (filtered.length === 0) {
                                    return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại vị trí</p>;
                                  }
                                  return filtered.map((jr) => (
                                    <button
                                      type="button"
                                      key={jr.id}
                                      onClick={() => {
                                        setJobRoleFilterId(jr.id);
                                        setIsJobRoleFilterDropdownOpen(false);
                                        setJobRoleFilterSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        jobRoleFilterId === jr.id
                                          ? "bg-primary-50 text-primary-700"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                      }`}
                                    >
                                      {jr.name}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dropdown vị trí tuyển dụng - giống dropdown kỹ năng */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vị trí tuyển dụng <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsJobRoleLevelDropdownOpen(prev => !prev)}
                            disabled={isCreatingJobRoleLevel}
                            className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                              !jobRoleLevelForm.jobRoleLevelId ? 'border-neutral-300 focus:border-primary-500' : 'border-primary-300 bg-primary-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center gap-2 text-sm text-neutral-700">
                              <Target className="w-4 h-4 text-neutral-400" />
                              <span>
                                {jobRoleLevelForm.jobRoleLevelId
                                  ? availableJobRoleLevels.find(jrl => jrl.id === jobRoleLevelForm.jobRoleLevelId)?.name || "Chọn vị trí"
                                  : "Chọn vị trí"}
                              </span>
                            </div>
                          </button>
                          {isJobRoleLevelDropdownOpen && !isCreatingJobRoleLevel && (
                            <div 
                              className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                              onMouseLeave={() => {
                                setIsJobRoleLevelDropdownOpen(false);
                                setJobRoleLevelSearch("");
                              }}
                            >
                              <div className="p-3 border-b border-neutral-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                  <input
                                    type="text"
                                    value={jobRoleLevelSearch}
                                    onChange={(e) => setJobRoleLevelSearch(e.target.value)}
                                    placeholder="Tìm vị trí tuyển dụng..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {(() => {
                                  const filtered = availableJobRoleLevels.filter((jrl) => {
                                    // Filter by Job Role
                                    if (jobRoleFilterId && jrl.jobRoleId !== jobRoleFilterId) return false;
                                    // Filter by search query
                                    if (jobRoleLevelSearch.trim()) {
                                      return jrl.name.toLowerCase().includes(jobRoleLevelSearch.toLowerCase());
                                    }
                                    return true;
                                  });

                                  if (filtered.length === 0) {
                                    return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                                  }

                                  // Lấy danh sách các jobRoleLevelId đã được tạo (trừ vị trí đang edit)
                                  const assignedJobRoleLevelIds = company?.jobRoleLevels
                                    ?.filter(jrl => editingJobRoleLevelId === null || jrl.id !== editingJobRoleLevelId)
                                    ?.map(jrl => jrl.jobRoleLevelId) || [];

                                  return filtered.map((jrl) => {
                                    const isAlreadySelected = assignedJobRoleLevelIds.includes(jrl.id);
                                    return (
                                      <button
                                        type="button"
                                        key={jrl.id}
                                        onClick={() => {
                                          if (!isAlreadySelected) {
                                            setJobRoleLevelForm({ ...jobRoleLevelForm, jobRoleLevelId: jrl.id });
                                            // Tự động set loại vị trí (Job Role) theo vị trí tuyển dụng đã chọn
                                            if (jrl.jobRoleId) {
                                              setJobRoleFilterId(jrl.jobRoleId);
                                            }
                                            setIsJobRoleLevelDropdownOpen(false);
                                            setJobRoleLevelSearch("");
                                          }
                                        }}
                                        disabled={isAlreadySelected}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          jobRoleLevelForm.jobRoleLevelId === jrl.id
                                            ? "bg-primary-50 text-primary-700"
                                            : isAlreadySelected
                                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                              : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {jrl.name}{isAlreadySelected ? ' (đã chọn)' : ''}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức lương mong muốn tối thiểu
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCurrency(jobRoleLevelForm.expectedMinRate)}
                        onChange={(e) => handleMinRateChange(e.target.value)}
                        placeholder="VD: 5.000.000"
                        className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        disabled={isCreatingJobRoleLevel}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
                        {getCurrencyDisplay(jobRoleLevelForm.currency)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức lương mong muốn tối đa
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCurrency(jobRoleLevelForm.expectedMaxRate)}
                        onChange={(e) => handleMaxRateChange(e.target.value)}
                        placeholder="VD: 10.000.000"
                        className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        disabled={isCreatingJobRoleLevel}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
                        {getCurrencyDisplay(jobRoleLevelForm.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiền tệ
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCurrencyDropdownOpen(prev => !prev)}
                      disabled={isCreatingJobRoleLevel}
                      className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                        !jobRoleLevelForm.currency ? 'border-neutral-300 focus:border-primary-500' : 'border-primary-300 bg-primary-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Briefcase className="w-4 h-4 text-neutral-400" />
                        <span>
                          {jobRoleLevelForm.currency
                            ? currencies.find(c => c.code === jobRoleLevelForm.currency)?.name || jobRoleLevelForm.currency
                            : "Chọn tiền tệ"}
                        </span>
                      </div>
                    </button>
                    {isCurrencyDropdownOpen && !isCreatingJobRoleLevel && (
                      <div 
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsCurrencyDropdownOpen(false);
                          setCurrencySearch("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              placeholder="Tìm tiền tệ..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filtered = currencySearch
                              ? currencies.filter(c =>
                                c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                c.name.toLowerCase().includes(currencySearch.toLowerCase())
                              )
                              : currencies;

                            if (filtered.length === 0) {
                              return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy tiền tệ nào</p>;
                            }

                            return filtered.map((currency) => (
                              <button
                                type="button"
                                key={currency.code}
                                onClick={() => {
                                  setJobRoleLevelForm({ ...jobRoleLevelForm, currency: currency.code });
                                  setIsCurrencyDropdownOpen(false);
                                  setCurrencySearch("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  jobRoleLevelForm.currency === currency.code
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {currency.name}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={jobRoleLevelForm.notes || ""}
                    onChange={(e) => setJobRoleLevelForm({ ...jobRoleLevelForm, notes: e.target.value || null })}
                    placeholder="Nhập ghi chú (tùy chọn)..."
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    disabled={isCreatingJobRoleLevel}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                <Button
                  onClick={handleCloseAddJobRoleLevelModal}
                  disabled={isCreatingJobRoleLevel}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveJobRoleLevel}
                  disabled={isCreatingJobRoleLevel || !jobRoleLevelForm.jobRoleLevelId}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingJobRoleLevel ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {editingJobRoleLevelId ? "Cập nhật vị trí" : "Thêm vị trí"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Detail Modal */}
        {showNotesModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNotesModal(false);
                setSelectedNotes("");
              }
            }}
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Chi tiết ghi chú</h3>
                </div>
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedNotes("");
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-6 py-4">
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
                    {selectedNotes || "—"}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end">
                <Button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedNotes("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading/Success Overlay ở giữa màn hình */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[350px] max-w-[500px]">
            {loadingOverlay.type === 'loading' ? (
              <>
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-700 mb-2">Đang xử lý...</p>
                  <p className="text-neutral-600">{loadingOverlay.message}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-success-200 border-t-success-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-success-700 mb-2">Thành công!</p>
                  <p className="text-neutral-600 whitespace-pre-line">{loadingOverlay.message}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InfoItem({ label, value, icon, className }: {
  label: string;
  value: string | null | undefined;
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
