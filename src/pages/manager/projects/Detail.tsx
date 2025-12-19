import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/manager";
import { projectService, type ProjectDetailedModel } from "../../../services/Project";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { projectPeriodService, type ProjectPeriodModel } from "../../../services/ProjectPeriod";
import { talentAssignmentService, type TalentAssignmentModel } from "../../../services/TalentAssignment";
import { talentService, type Talent } from "../../../services/Talent";
import { partnerService, type Partner } from "../../../services/Partner";
import { formatNumberInput } from "../../../utils/formatters";
import { clientContractPaymentService, type ClientContractPaymentModel } from "../../../services/ClientContractPayment";
import { partnerContractPaymentService, type PartnerContractPaymentModel } from "../../../services/PartnerContractPayment";
import { 
  CheckCircle,
  AlertCircle,
  X,
  Layers,
  Building2,
  FileCheck,
  Clock,
  FileText,
  CalendarDays,
  Globe2,
  Factory,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  AlertTriangle,
  Hash,
  UserCheck,
  ExternalLink,
  Download,
  User,
  Eye
} from "lucide-react";

export default function ManagerProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailedModel | null>(null);
  const [company, setCompany] = useState<ClientCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('info');
  
  // ProjectPeriod states
  const [projectPeriods, setProjectPeriods] = useState<ProjectPeriodModel[]>([]);
  const [filteredPeriods, setFilteredPeriods] = useState<ProjectPeriodModel[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [showClosedPeriods, setShowClosedPeriods] = useState<boolean>(false);

  // Contract Payments states
  const [clientContractPayments, setClientContractPayments] = useState<ClientContractPaymentModel[]>([]);
  const [partnerContractPayments, setPartnerContractPayments] = useState<PartnerContractPaymentModel[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [talentNamesMap, setTalentNamesMap] = useState<Record<number, string>>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);

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


  // Talent Assignment states (read-only)
  const [talentAssignments, setTalentAssignments] = useState<TalentAssignmentModel[]>([]);
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showDetailAssignmentModal, setShowDetailAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TalentAssignmentModel | null>(null);

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
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Reset states khi chuyển dự án
        setProjectPeriods([]);
        setFilteredPeriods([]);
        setSelectedPeriodId(null);
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        
        const projectId = Number(id);
        const [projectData, periodsData] = await Promise.all([
          projectService.getDetailedById(projectId),
          projectPeriodService.getAll({ projectId, excludeDeleted: true }),
        ]);

        setProject(projectData);
        
        // Fetch client company if available
        if (projectData?.clientCompanyId) {
          try {
            const companyData = await clientCompanyService.getById(projectData.clientCompanyId);
            setCompany(companyData);
          } catch (err) {
            console.error("❌ Lỗi tải thông tin công ty:", err);
          }
        }

        // Fetch talent assignments for this project
        try {
          const assignments = await talentAssignmentService.getAll({ projectId: projectId });
          const filteredAssignments = assignments.filter(a => a.projectId === projectId);
          setTalentAssignments(filteredAssignments);
        } catch (err) {
          console.error("❌ Lỗi tải danh sách phân công nhân sự:", err);
        }

        // Fetch talents and partners for display
        try {
          const [allTalentsData, allPartnersData] = await Promise.all([
            talentService.getAll({ excludeDeleted: true }),
            partnerService.getAll()
          ]);
          const allTalents = ensureArray<Talent>(allTalentsData);
          const allPartners = ensureArray<Partner>(allPartnersData);
          setTalents(allTalents);
          setPartners(allPartners);
        } catch (err) {
          console.error("❌ Lỗi tải danh sách talents/partners:", err);
          // Set empty arrays on error to prevent find() errors
          setTalents([]);
          setPartners([]);
        }
        
        // Filter client-side để đảm bảo chỉ lấy periods của dự án này
        const filteredByProject = periodsData.filter(p => p.projectId === projectId);
        
        const sortedPeriods = [...filteredByProject].sort((a, b) => {
          if (a.periodYear !== b.periodYear) {
            return a.periodYear - b.periodYear; // Năm tăng dần
          }
          return a.periodMonth - b.periodMonth; // Tháng tăng dần
        });
        setProjectPeriods(sortedPeriods);
        setFilteredPeriods(sortedPeriods);

        // Tự động chọn chu kỳ của tháng hiện tại, nếu không có thì chọn chu kỳ mới nhất
        if (sortedPeriods.length > 0) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // getMonth() trả về 0-11, cần +1 để có 1-12
          const currentYear = now.getFullYear();
          
          // Tìm chu kỳ của tháng hiện tại
          const currentPeriod = sortedPeriods.find(
            p => p.periodMonth === currentMonth && p.periodYear === currentYear
          );
          
          if (currentPeriod) {
            setSelectedPeriodId(currentPeriod.id);
          } else {
            // Fallback về chu kỳ mới nhất nếu không tìm thấy chu kỳ tháng hiện tại
            setSelectedPeriodId(sortedPeriods[sortedPeriods.length - 1].id);
          }
        }

      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu dự án:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);


  // Filter periods by year and status
  useEffect(() => {
    let filtered = projectPeriods;
    
    // Filter by year
    if (yearFilter !== null) {
      filtered = filtered.filter(p => p.periodYear === yearFilter);
    }
    
    // Filter by status (hide closed periods by default)
    if (!showClosedPeriods) {
      filtered = filtered.filter(p => p.status !== "Closed");
    }
    
    setFilteredPeriods(filtered);
  }, [yearFilter, projectPeriods, showClosedPeriods]);

  // Reset selected period if it's not in filtered list
  useEffect(() => {
    if (selectedPeriodId && !filteredPeriods.find(p => p.id === selectedPeriodId)) {
      if (filteredPeriods.length > 0) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentPeriod = filteredPeriods.find(
          p => p.periodMonth === currentMonth && p.periodYear === currentYear
        );
        setSelectedPeriodId(currentPeriod ? currentPeriod.id : filteredPeriods[filteredPeriods.length - 1].id);
      } else {
        setSelectedPeriodId(null);
      }
    }
  }, [filteredPeriods, selectedPeriodId]);

  // Fetch contract payments when a period is selected
  useEffect(() => {
    const fetchContractPayments = async () => {
      if (!selectedPeriodId || !id) {
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        return;
      }

      // Đảm bảo period được chọn thuộc về dự án hiện tại
      const selectedPeriod = projectPeriods.find(p => p.id === selectedPeriodId);
      if (!selectedPeriod || selectedPeriod.projectId !== Number(id)) {
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        return;
      }

      try {
        setLoadingPayments(true);
        const [clientPayments, partnerPayments] = await Promise.all([
          clientContractPaymentService.getAll({ 
            projectPeriodId: selectedPeriodId, 
            excludeDeleted: true 
          }),
          partnerContractPaymentService.getAll({ 
            projectPeriodId: selectedPeriodId, 
            excludeDeleted: true 
          })
        ]);

        // Đảm bảo chỉ lấy payments của period này (double-check)
        const filteredClientPayments = Array.isArray(clientPayments) 
          ? clientPayments.filter(p => p.projectPeriodId === selectedPeriodId)
          : [];
        const filteredPartnerPayments = Array.isArray(partnerPayments) 
          ? partnerPayments.filter(p => p.projectPeriodId === selectedPeriodId)
          : [];

        setClientContractPayments(filteredClientPayments);
        setPartnerContractPayments(filteredPartnerPayments);

        // Fetch talent names for all unique talentAssignmentIds
        const allTalentAssignmentIds = [
          ...new Set([
            ...filteredClientPayments.map(p => p.talentAssignmentId),
            ...filteredPartnerPayments.map(p => p.talentAssignmentId)
          ])
        ];

        if (allTalentAssignmentIds.length > 0) {
          const assignments = await Promise.all(
            allTalentAssignmentIds.map(id => 
              talentAssignmentService.getById(id).catch(() => null)
            )
          );

          const talentIds = assignments
            .filter((a): a is TalentAssignmentModel => a !== null)
            .map(a => a.talentId);

          if (talentIds.length > 0) {
            const talents = await Promise.all(
              talentIds.map(id => 
                talentService.getById(id).catch(() => null)
              )
            );

            const newTalentNamesMap: Record<number, string> = {};
            assignments.forEach((assignment) => {
              if (assignment) {
                const talent = talents.find(t => t && t.id === assignment.talentId);
                if (talent) {
                  newTalentNamesMap[assignment.id] = talent.fullName || "—";
                }
              }
            });

            setTalentNamesMap(prev => ({ ...prev, ...newTalentNamesMap }));
          }
        }
      } catch (err) {
        console.error("❌ Lỗi tải hợp đồng thanh toán:", err);
        setClientContractPayments([]);
        setPartnerContractPayments([]);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchContractPayments();
  }, [selectedPeriodId, id, projectPeriods]);

  const formatViDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatViDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
        return "—";
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "—";
    }
  };

  const assignmentStatusLabels: Record<string, string> = {
    Active: "Đang hoạt động",
    Completed: "Đã hoàn thành",
    Terminated: "Đã chấm dứt",
    Inactive: "Không hoạt động",
    Draft: "Nháp",
  };

  // Pagination cho danh sách nhân sự tham gia
  const assignmentItemsPerPage = 6;

  const filteredAssignmentsForTable = [...talentAssignments]
    .filter(a => a.projectId === Number(id))
    .filter(a =>
      showAllAssignments
        ? true
        : a.status === "Draft" || a.status === "Active"
    )
    .sort((a, b) => {
      // Sắp xếp theo ngày cập nhật gần nhất (mới nhất trước)
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
    });

  const totalAssignmentsForTable = filteredAssignmentsForTable.length;
  const totalAssignmentPages = totalAssignmentsForTable > 0
    ? Math.ceil(totalAssignmentsForTable / assignmentItemsPerPage)
    : 1;
  const currentAssignmentPage = Math.min(assignmentPage, totalAssignmentPages);

  const paginatedAssignmentsForTable = filteredAssignmentsForTable.slice(
    (currentAssignmentPage - 1) * assignmentItemsPerPage,
    currentAssignmentPage * assignmentItemsPerPage
  );

  const handleChangeStatusToOngoing = async () => {
    if (!id || !project) return;
    
    const confirmChange = window.confirm(
      "Bạn có chắc muốn thay đổi trạng thái dự án từ 'Tạm dừng' sang 'Đang thực hiện'?"
    );
    if (!confirmChange) return;

    try {
      setUpdatingStatus(true);
      // Sử dụng API change-status mới
      const result = await projectService.updateStatus(Number(id), {
        newStatus: "Ongoing",
        notes: null
      });
      
      // Kiểm tra kết quả
      if (!result.isSuccess && !result.success) {
        throw new Error(result.message || "Không thể thay đổi trạng thái dự án");
      }
      
      // Refresh project data
      const updatedProject = await projectService.getDetailedById(Number(id));
      setProject(updatedProject);
      
      showSuccessOverlay("✅ Đã thay đổi trạng thái dự án thành công!");
    } catch (error: any) {
      console.error("❌ Lỗi khi thay đổi trạng thái:", error);
      alert(error.message || "Không thể thay đổi trạng thái dự án");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusLabels: Record<string, string> = {
    Planned: "Đã lên kế hoạch",
    Ongoing: "Đang thực hiện",
    Completed: "Đã hoàn thành",
    OnHold: "Tạm dừng",
  };

  const contractStatusLabels: Record<string, string> = {
    Draft: "Nháp",
    NeedMoreInformation: "Cần thêm thông tin",
    Submitted: "Đã gửi",
    Verified: "Đã xác minh",
    Approved: "Đã duyệt",
    Rejected: "Từ chối",
  };

  const paymentStatusLabels: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Processing: "Đang xử lý",
    Invoiced: "Đã xuất hóa đơn",
    PartiallyPaid: "Đã thanh toán một phần",
    Paid: "Đã thanh toán",
  };

  const contractStatusColors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800",
    NeedMoreInformation: "bg-yellow-100 text-yellow-800",
    Submitted: "bg-blue-100 text-blue-800",
    Verified: "bg-purple-100 text-purple-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };

  const paymentStatusColors: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-800",
    Processing: "bg-yellow-100 text-yellow-800",
    Invoiced: "bg-blue-100 text-blue-800",
    PartiallyPaid: "bg-orange-100 text-orange-800",
    Paid: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy dự án</p>
            <Link 
              to="/manager/projects"
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
      <Sidebar items={sidebarItems} title="Manager" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Dự án", to: "/manager/projects" },
              { label: project ? project.name : "Chi tiết dự án" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết dự án khách hàng
              </p>
              
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
                  project.status === "OnHold" 
                    ? "bg-yellow-50 border-yellow-200"
                    : project.status === "Ongoing"
                    ? "bg-green-50 border-green-200"
                    : project.status === "Completed"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  {project.status === "OnHold" ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  ) : project.status === "Ongoing" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    project.status === "OnHold" 
                      ? "text-yellow-800"
                      : project.status === "Ongoing"
                      ? "text-green-800"
                      : project.status === "Completed"
                      ? "text-blue-800"
                      : "text-gray-800"
                  }`}>
                    {project.status ? statusLabels[project.status] || project.status : "Đang hoạt động"}
                  </span>
                </div>
                
                {/* Nút thay đổi trạng thái từ OnHold sang Ongoing */}
                {project.status === "OnHold" && (
                  <button
                    onClick={handleChangeStatusToOngoing}
                    disabled={updatingStatus}
                    className="group flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    {updatingStatus ? "Đang cập nhật..." : "Tiếp tục dự án"}
                  </button>
                )}
              </div>
              
              {/* Cảnh báo khi dự án ở trạng thái OnHold */}
              {project.status === "OnHold" && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Cảnh báo:</span> Dự án tạm dừng – không thể tạo Job Request mới.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'info'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Thông tin dự án
                {activeTab === 'info' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'contracts'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Chu kỳ thanh toán
                {activeTab === 'contracts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'staff'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Nhân sự tham gia
                {activeTab === 'staff' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: Thông tin dự án */}
            {activeTab === 'info' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem 
                    label="Mã dự án" 
                    value={project.code || "—"}
                    icon={<Hash className="w-4 h-4" />}
                  />
                  <InfoItem 
                    label="Tên dự án" 
                    value={project.name}
                    icon={<FileText className="w-4 h-4" />}
                  />
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors duration-300" />
                      <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                        Công ty khách hàng
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCompanyInfo(true)}
                      className="text-gray-900 font-semibold text-lg hover:text-primary-700 transition-colors duration-300 cursor-pointer text-left"
                    >
                      {project.clientCompanyName || company?.name || "—"}
                    </button>
                  </div>
                  <InfoItem 
                    label="Thị trường" 
                    value={project.marketName || "—"}
                    icon={<Globe2 className="w-4 h-4" />}
                  />
                  <InfoItem 
                    label="Lĩnh vực" 
                    value={
                      project.industryNames && project.industryNames.length > 0
                        ? project.industryNames.join(", ")
                        : "—"
                    }
                    icon={<Factory className="w-4 h-4" />}
                  />
                  <InfoItem 
                    label="Ngày bắt đầu" 
                    value={formatViDateTime(project.startDate)}
                    icon={<CalendarDays className="w-4 h-4" />}
                  />
                  <InfoItem 
                    label="Ngày kết thúc" 
                    value={project.endDate ? formatViDateTime(project.endDate) : "Chưa xác định"}
                    icon={<CalendarDays className="w-4 h-4" />}
                  />
                </div>

                {/* Mô tả với nút xem/ẩn */}
                {project.description && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <button
                      onClick={() => setShowDescription(!showDescription)}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-3"
                    >
                      {showDescription ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ẩn mô tả
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Xem mô tả
                        </>
                      )}
                    </button>
                    {showDescription && (
                      <div className="prose max-w-none text-neutral-700 bg-neutral-50 rounded-xl p-4">
                        <div dangerouslySetInnerHTML={{ __html: project.description }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Hợp đồng */}
            {activeTab === 'contracts' && (
              <div className="space-y-6">
                {/* Header với filter năm */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Danh sách chu kỳ thanh toán</h2>
                  <div className="flex items-center gap-3">
                    {/* Checkbox hiển thị chu kỳ đã đóng */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showClosedPeriods}
                        onChange={(e) => setShowClosedPeriods(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">Hiển thị chu kỳ đã đóng</span>
                    </label>
                    {/* Filter theo năm */}
                    <select
                      value={yearFilter || ""}
                      onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : null)}
                      className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Tất cả các năm</option>
                      {Array.from(new Set(projectPeriods.map(p => p.periodYear)))
                        .sort((a, b) => b - a)
                        .map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Tabs ngang cho các chu kỳ */}
                {filteredPeriods.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-xl">
                    <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500">Chưa có chu kỳ thanh toán nào</p>
                  </div>
                ) : (
                  <div>
                    {/* Tab Navigation - Horizontal Scroll */}
                    <div className="border-b border-neutral-200 mb-6 overflow-x-auto">
                      <div className="flex space-x-1 min-w-max">
                        {filteredPeriods.map((period) => {
                          const statusLabels: Record<string, string> = {
                            "Open": "Mở",
                            "Closed": "Đã đóng",
                            "Pending": "Chờ xử lý",
                            "Processing": "Đang xử lý"
                          };
                          const statusColors: Record<string, string> = {
                            "Open": "bg-green-100 text-green-700",
                            "Closed": "bg-gray-100 text-gray-700",
                            "Pending": "bg-yellow-100 text-yellow-700",
                            "Processing": "bg-blue-100 text-blue-700"
                          };
                          const statusLabel = statusLabels[period.status] || period.status;
                          const statusColor = statusColors[period.status] || "bg-neutral-100 text-neutral-700";
                          
                          return (
                            <button
                              key={period.id}
                              onClick={() => setSelectedPeriodId(period.id)}
                              className={`px-6 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap relative flex flex-col items-center gap-1 ${
                                selectedPeriodId === period.id
                                  ? 'text-primary-600'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              <span>Tháng {period.periodMonth}/{period.periodYear}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
                                {statusLabel}
                              </span>
                              {selectedPeriodId === period.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content của chu kỳ được chọn */}
                    {selectedPeriodId && (
                      <div className="animate-fade-in">
                        {loadingPayments ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Đang tải hợp đồng...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Client Contract Payments */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <Building2 className="w-5 h-5 text-primary-600" />
                                  Hợp đồng khách hàng
                                </h3>
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                  {clientContractPayments.length} hợp đồng
                                </span>
                              </div>
                              {clientContractPayments.length === 0 ? (
                                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                                  <FileCheck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm text-neutral-500">Chưa có hợp đồng khách hàng</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Nhóm theo talentAssignmentId - Sắp xếp để đảm bảo thứ tự giống nhau giữa client và partner */}
                                  {(() => {
                                    // Lấy tất cả unique talentAssignmentIds từ cả client và partner
                                    const allTalentAssignmentIds = Array.from(new Set([
                                      ...clientContractPayments.map(p => p.talentAssignmentId),
                                      ...partnerContractPayments.map(p => p.talentAssignmentId)
                                    ]));
                                    
                                    // Sắp xếp theo tên nhân sự (nếu có) hoặc theo ID
                                    const sortedTalentAssignmentIds = allTalentAssignmentIds.sort((a, b) => {
                                      const nameA = talentNamesMap[a] || `Talent Assignment ${a}`;
                                      const nameB = talentNamesMap[b] || `Talent Assignment ${b}`;
                                      return nameA.localeCompare(nameB, 'vi', { numeric: true });
                                    });
                                    
                                    return sortedTalentAssignmentIds.map((talentAssignmentId) => {
                                      const clientPayments = clientContractPayments.filter(p => p.talentAssignmentId === talentAssignmentId);
                                      return (
                                      <div key={talentAssignmentId} className="border border-neutral-200 rounded-lg p-4">
                                        <div className="mb-3 pb-3 border-b border-neutral-200">
                                          <p className="text-sm font-medium text-neutral-600">
                                            {talentNamesMap[talentAssignmentId] || `Talent Assignment ID: ${talentAssignmentId}`}
                                          </p>
                                        </div>
                                        {clientPayments.map((payment) => (
                                          <div 
                                            key={payment.id} 
                                            onClick={() => navigate(`/manager/contracts/clients/${payment.id}`)}
                                            className="mb-4 last:mb-0 border border-neutral-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                                          >
                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">{payment.contractNumber}</p>
                                                <p className="text-sm text-neutral-600">{payment.talentName || "—"}</p>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${contractStatusColors[payment.contractStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                  {contractStatusLabels[payment.contractStatus] || payment.contractStatus}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusColors[payment.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                  {paymentStatusLabels[payment.paymentStatus] || payment.paymentStatus}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                  {payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? "Số tiền thực tế" : "Số tiền dự kiến"}
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  {formatCurrency(payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? payment.actualAmountVND : (payment.plannedAmountVND || 0))}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">Đã thanh toán</p>
                                                <p className="font-semibold text-gray-900">{formatCurrency(payment.totalPaidAmount)}</p>
                                              </div>
                                            </div>
                                            {payment.billableHours && (
                                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                  <Clock className="w-4 h-4" />
                                                  <span>Giờ billable: {payment.billableHours}h</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Partner Contract Payments */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <FileCheck className="w-5 h-5 text-secondary-600" />
                                  Hợp đồng đối tác
                                </h3>
                                <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                                  {partnerContractPayments.length} hợp đồng
                                </span>
                              </div>
                              {partnerContractPayments.length === 0 ? (
                                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                                  <FileCheck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm text-neutral-500">Chưa có hợp đồng đối tác</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Nhóm theo talentAssignmentId - Sắp xếp để đảm bảo thứ tự giống nhau giữa client và partner */}
                                  {(() => {
                                    // Lấy tất cả unique talentAssignmentIds từ cả client và partner
                                    const allTalentAssignmentIds = Array.from(new Set([
                                      ...clientContractPayments.map(p => p.talentAssignmentId),
                                      ...partnerContractPayments.map(p => p.talentAssignmentId)
                                    ]));
                                    
                                    // Sắp xếp theo tên nhân sự (nếu có) hoặc theo ID
                                    const sortedTalentAssignmentIds = allTalentAssignmentIds.sort((a, b) => {
                                      const nameA = talentNamesMap[a] || `Talent Assignment ${a}`;
                                      const nameB = talentNamesMap[b] || `Talent Assignment ${b}`;
                                      return nameA.localeCompare(nameB, 'vi', { numeric: true });
                                    });
                                    
                                    return sortedTalentAssignmentIds.map((talentAssignmentId) => {
                                      const partnerPaymentsForTalent = partnerContractPayments.filter(p => p.talentAssignmentId === talentAssignmentId);
                                      return (
                                      <div key={talentAssignmentId} className="border border-neutral-200 rounded-lg p-4">
                                        <div className="mb-3 pb-3 border-b border-neutral-200">
                                          <p className="text-sm font-medium text-neutral-600">
                                            {talentNamesMap[talentAssignmentId] || `Talent Assignment ID: ${talentAssignmentId}`}
                                          </p>
                                        </div>
                                        {partnerPaymentsForTalent.map((payment: PartnerContractPaymentModel) => (
                                          <div 
                                            key={payment.id} 
                                            onClick={() => navigate(`/manager/contracts/partners/${payment.id}`)}
                                            className="mb-4 last:mb-0 border border-neutral-200 rounded-lg p-4 hover:border-secondary-300 hover:shadow-sm transition-all cursor-pointer"
                                          >
                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">{payment.contractNumber}</p>
                                                <p className="text-sm text-neutral-600">{talentNamesMap[payment.talentAssignmentId] || `Talent Assignment ID: ${payment.talentAssignmentId}`}</p>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                  payment.contractStatus === 'Approved' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : payment.contractStatus === 'Verified'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {contractStatusLabels[payment.contractStatus] || payment.contractStatus}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                  payment.paymentStatus === 'Paid' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : payment.paymentStatus === 'Processing'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {payment.paymentStatus === 'Paid' ? 'Đã thanh toán' : payment.paymentStatus === 'Processing' ? 'Đang xử lý' : 'Chờ thanh toán'}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                  {payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? "Số tiền thực tế" : "Số tiền dự kiến"}
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  {formatCurrency(payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? payment.actualAmountVND : (payment.plannedAmountVND || 0))}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">Đã thanh toán</p>
                                                <p className="font-semibold text-gray-900">{formatCurrency(payment.totalPaidAmount)}</p>
                                              </div>
                                            </div>
                                            {payment.reportedHours && (
                                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                  <Clock className="w-4 h-4" />
                                                  <span>Giờ làm việc: {payment.reportedHours}h</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Nhân sự tham gia */}
            {activeTab === 'staff' && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Danh sách nhân sự tham gia</h3>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="text-sm text-neutral-500">
                        ({totalAssignmentsForTable} nhân sự)
                      </span>
                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={showAllAssignments}
                          onChange={(e) => {
                            setShowAllAssignments(e.target.checked);
                            setAssignmentPage(1);
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        Hiện tất cả nhân sự tham gia
                      </label>
                    </div>
                  </div>
                </div>
                {talentAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Nhân sự</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Vị trí công việc</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Đối tác</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày bắt đầu</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày kết thúc</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">File cam kết</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày cập nhật gần nhất</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssignmentsForTable.map((assignment) => {
                            const talent = talents.find(t => t.id === assignment.talentId);
                            const partner = partners.find(p => p.id === assignment.partnerId);
                            return (
                              <tr 
                                key={assignment.id} 
                                className="border-b border-neutral-100 hover:bg-neutral-50"
                              >
                                <td className="py-3 px-4 text-sm text-neutral-900 font-medium">
                                  {talent?.fullName || `Nhân sự #${assignment.talentId}`}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.jobRoleLevelName || "—"}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {partner?.companyName || `Đối tác #${assignment.partnerId}`}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.startDate ? formatViDate(assignment.startDate) : "—"}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.endDate ? formatViDate(assignment.endDate) : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                                    assignment.status === "Active" ? "bg-green-100 text-green-800" :
                                    assignment.status === "Completed" ? "bg-blue-100 text-blue-800" :
                                    assignment.status === "Terminated" ? "bg-red-100 text-red-800" :
                                    assignment.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                                    "bg-neutral-100 text-neutral-800"
                                  }`}>
                                    {assignment.status ? (assignmentStatusLabels[assignment.status] || "Không xác định") : "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {assignment.commitmentFileUrl ? (
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={assignment.commitmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Xem file trong tab mới"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Xem
                                      </a>
                                      <a
                                        href={assignment.commitmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-xs font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Tải file xuống"
                                      >
                                        <Download className="w-3 h-3" />
                                        Tải xuống
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-neutral-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.updatedAt 
                                    ? formatViDateTime(assignment.updatedAt)
                                    : assignment.createdAt 
                                      ? formatViDateTime(assignment.createdAt)
                                      : "—"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAssignment(assignment);
                                      setShowDetailAssignmentModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Xem chi tiết
                                  </button>
                                </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                    {totalAssignmentsForTable > assignmentItemsPerPage && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-neutral-600">
                          Hiển thị{" "}
                          {Math.min(
                            assignmentItemsPerPage,
                            totalAssignmentsForTable - (currentAssignmentPage - 1) * assignmentItemsPerPage
                          )}{" "}
                          / {totalAssignmentsForTable} nhân sự
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAssignmentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentAssignmentPage === 1}
                            className={`px-3 py-1.5 rounded-lg text-sm border ${
                              currentAssignmentPage === 1
                                ? "text-neutral-400 border-neutral-200 cursor-not-allowed bg-neutral-50"
                                : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            Trước
                          </button>
                          <span className="text-sm text-neutral-700">
                            Trang {currentAssignmentPage} / {totalAssignmentPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAssignmentPage((prev) => Math.min(totalAssignmentPages, prev + 1))}
                            disabled={currentAssignmentPage === totalAssignmentPages}
                            className={`px-3 py-1.5 rounded-lg text-sm border ${
                              currentAssignmentPage === totalAssignmentPages
                                ? "text-neutral-400 border-neutral-200 cursor-not-allowed bg-neutral-50"
                                : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                    <p>Chưa có nhân sự nào được phân công</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Assignment Modal (Read-only) */}
      {showDetailAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailAssignmentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Chi tiết phân công nhân sự
              </h3>
              <button
                onClick={() => {
                  setShowDetailAssignmentModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Talent Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nhân sự</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {talents.find(t => t.id === selectedAssignment.talentId)?.fullName || `Nhân sự #${selectedAssignment.talentId}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vị trí công việc</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.jobRoleLevelName || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Đối tác</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {partners.find(p => p.id === selectedAssignment.partnerId)?.companyName || `Đối tác #${selectedAssignment.partnerId}`}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày bắt đầu</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.startDate ? formatViDate(selectedAssignment.startDate) : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày kết thúc</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.endDate ? formatViDate(selectedAssignment.endDate) : "—"}
                  </p>
                </div>
                {selectedAssignment.terminationDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày chấm dứt</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatViDate(selectedAssignment.terminationDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái</label>
                <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedAssignment.status === "Active" ? "bg-green-100 text-green-800" :
                  selectedAssignment.status === "Completed" ? "bg-blue-100 text-blue-800" :
                  selectedAssignment.status === "Terminated" ? "bg-red-100 text-red-800" :
                  selectedAssignment.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                  selectedAssignment.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                  "bg-neutral-100 text-neutral-800"
                }`}>
                  {selectedAssignment.status ? (assignmentStatusLabels[selectedAssignment.status] || "Không xác định") : "—"}
                </span>
              </div>

              {/* Commitment File */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">File cam kết</label>
                {selectedAssignment.commitmentFileUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedAssignment.commitmentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      title="Xem file trong tab mới"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Xem file
                    </a>
                    <a
                      href={selectedAssignment.commitmentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                      title="Tải file xuống"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">Chưa có file</p>
                )}
              </div>

              {/* Termination Reason */}
              {selectedAssignment.terminationReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Lý do chấm dứt</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedAssignment.terminationReason}
                  </p>
                </div>
              )}

              {/* Estimated Rates */}
              {(selectedAssignment.estimatedClientRate || selectedAssignment.estimatedPartnerRate) && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Chi phí ước tính</label>
                  <div className="space-y-2">
                    {selectedAssignment.estimatedClientRate && (
                      <div>
                        <span className="text-xs text-neutral-500">Khách hàng: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumberInput(selectedAssignment.estimatedClientRate)} {selectedAssignment.currencyCode || "VND"}
                        </span>
                      </div>
                    )}
                    {selectedAssignment.estimatedPartnerRate && (
                      <div>
                        <span className="text-xs text-neutral-500">Đối tác: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumberInput(selectedAssignment.estimatedPartnerRate)} {selectedAssignment.currencyCode || "VND"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ghi chú</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedAssignment.notes || "—"}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                  <p className="text-sm text-gray-600">
                    {selectedAssignment.createdAt ? formatViDateTime(selectedAssignment.createdAt) : "—"}
                  </p>
                </div>
                {selectedAssignment.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày cập nhật</label>
                    <p className="text-sm text-gray-600">
                      {formatViDateTime(selectedAssignment.updatedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowDetailAssignmentModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Modal */}
      {showCompanyInfo && company && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompanyInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                Thông tin khách hàng
              </h3>
              <button
                onClick={() => setShowCompanyInfo(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">Tên công ty</p>
                <p className="text-gray-900 font-semibold">{company.name}</p>
              </div>
              {company.contactPerson && (
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Người đại diện</p>
                  <p className="text-gray-900">{company.contactPerson}</p>
                </div>
              )}
              {company.email && (
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Email</p>
                  <p className="text-gray-900">{company.email}</p>
                </div>
              )}
              {company.phone && (
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Điện thoại</p>
                  <p className="text-gray-900">{company.phone}</p>
                </div>
              )}
              {company.address && (
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Địa chỉ</p>
                  <p className="text-gray-900">{company.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

