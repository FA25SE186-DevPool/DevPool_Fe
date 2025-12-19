import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import { Button } from "../../../components/ui/button";
import { jobRequestService, type JobRequest, JobRequestStatus } from "../../../services/JobRequest";
import { useAuth } from "../../../context/AuthContext";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { projectService, type Project } from "../../../services/Project";
import { jobRoleLevelService, type JobRoleLevel } from "../../../services/JobRoleLevel";
import { talentApplicationService, type TalentApplication, type TalentApplicationDetailed } from "../../../services/TalentApplication";
import {
  Search,
  Filter,
  Eye,
  Plus,
  Briefcase,
  Building2,
  Target,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Layers,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Clock
} from "lucide-react";

type AugmentedJobRequest = JobRequest & {
  projectName: string;
  clientCompanyName: string;
  applicationCount: number;
  createdAt?: string;
  positionName?: string;
};

const statusLabels: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Closed",
  3: "Rejected"
};

const statusLabelDisplay: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Closed: "Đã đóng",
  Rejected: "Bị từ chối"
};

const applicationStatusColors: Record<string, string> = {
  Submitted: "bg-sky-100 text-sky-700",
  Interviewing: "bg-cyan-100 text-cyan-700",
  Hired: "bg-purple-100 text-purple-700",
  Rejected: "bg-red-100 text-red-700",
  Withdrawn: "bg-gray-100 text-gray-700",
};

export default function JobRequestListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AugmentedJobRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AugmentedJobRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "my">("my");

  // Tính toán danh sách requests theo tab
  const currentRequestsList = useMemo(() =>
    activeTab === "all"
      ? requests
      : requests.filter(r => r.ownerId === user?.id),
    [activeTab, requests, user?.id]
  );

  // Tính toán số lượng cho tabs (không phụ thuộc vào activeTab)
  const myRequestsCount = useMemo(() =>
    requests.filter(r => r.ownerId === user?.id).length,
    [requests, user?.id]
  );
  const allRequestsCount = requests.length;

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Dropdown states
  const [companySearch, setCompanySearch] = useState("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Hồ sơ ứng tuyển popup
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AugmentedJobRequest | null>(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applications, setApplications] = useState<TalentApplicationDetailed[]>([]);
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<string>("");

  const applicationStatusLabel: Record<string, string> = {
    Submitted: "Đã nộp",
    Interviewing: "Đang phỏng vấn",
    Hired: "Đạt",
    Rejected: "Không đạt",
    Withdrawn: "Rút hồ sơ",
    Pending: "Chờ xử lý",
  };

  // Đóng popup bằng phím ESC
  useEffect(() => {
    if (!isApplicationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeApplicationsPopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApplicationsOpen]);

  // Lookup data for dropdowns
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [positions, setPositions] = useState<JobRoleLevel[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

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

  // Stats data
  const stats = useMemo(() => [
    {
      title: activeTab === "all" ? 'Tổng Yêu Cầu' : 'YCTD của tôi',
      value: currentRequestsList.length.toString(),
      color: 'blue',
      icon: <Briefcase className="w-6 h-6" />
    },
    {
      title: 'Chưa Duyệt',
      value: currentRequestsList.filter(r => r.status === JobRequestStatus.Pending).length.toString(),
      color: 'orange',
      icon: <Target className="w-6 h-6" />
    },
    {
      title: 'Đã Duyệt',
      value: currentRequestsList.filter(r => r.status === JobRequestStatus.Approved).length.toString(),
      color: 'purple',
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Đã từ chối',
      value: currentRequestsList.filter(r => r.status === JobRequestStatus.Rejected).length.toString(),
      color: 'red',
      icon: <XCircle className="w-6 h-6" />
    },
    {
      title: 'Đã đóng',
      value: currentRequestsList.filter(r => r.status === JobRequestStatus.Closed).length.toString(),
      color: 'gray',
      icon: <Briefcase className="w-6 h-6" />
    }
  ], [currentRequestsList, activeTab]);

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex((prev) => Math.min(prev, maxIndex));
  }, [stats.length, statsPageSize]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reqRes, companyRes, projectRes, positionsAll, applicationsRes] = await Promise.all([
          jobRequestService.getAll(),
          clientCompanyService.getAll(),
          projectService.getAll(),
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          talentApplicationService.getAll({ excludeDeleted: true }),
        ]);

        // Ensure all data are arrays
        const reqArray = ensureArray<JobRequest>(reqRes);
        const companyArray = ensureArray<ClientCompany>(companyRes);
        const projectArray = ensureArray<Project>(projectRes);
        const positionsAllArray = ensureArray<JobRoleLevel>(positionsAll);
        const applicationsArray = ensureArray<TalentApplication>(applicationsRes);

        const companyDict: Record<number, ClientCompany> = {};
        companyArray.forEach((c) => (companyDict[c.id] = c));

        const projectDict: Record<number, Project> = {};
        projectArray.forEach((p) => (projectDict[p.id] = p));

        const positionDict: Record<number, JobRoleLevel> = {};
        positionsAllArray.forEach((p) => (positionDict[p.id] = p));

        const applicationCountMap: Record<number, number> = {};
        applicationsArray.forEach((app) => {
          const key = app.jobRequestId;
          applicationCountMap[key] = (applicationCountMap[key] ?? 0) + 1;
        });

        const merged: AugmentedJobRequest[] = reqArray
          .map((r) => {
            const projectInfo = projectDict[r.projectId];
            const company = projectInfo ? companyDict[projectInfo.clientCompanyId] : undefined;
            const jobRoleLevelId =
              (r as any).jobRoleLevelId ??
              (r as any).JobRoleLevelId ??
              (r as any).jobRoleLevelID ??
              (r as any).JobRoleLevelID;
            const position = jobRoleLevelId ? positionDict[Number(jobRoleLevelId)] : undefined;
            const createdAt = (r as { createdAt?: string }).createdAt;
            return {
              ...r,
              projectName: projectInfo?.name ?? "—",
              clientCompanyName: company?.name ?? "—",
              positionName: position?.name ?? "—",
              applicationCount: applicationCountMap[r.id] ?? 0,
              createdAt
            };
          })
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            if (dateA !== dateB) {
              return dateB - dateA;
            }

            return b.id - a.id;
          });

        setRequests(merged);
        setFilteredRequests(merged);
        setCompanies(companyArray);
        setProjects(projectArray);
        // Dropdown "Vị trí": hiển thị distinct theo name để gọn
        const byName = new Map<string, JobRoleLevel>();
        positionsAllArray.forEach((p) => {
          const key = (p.name ?? "").trim();
          if (!key) return;
          if (!byName.has(key)) byName.set(key, p);
        });
        setPositions(Array.from(byName.values()));
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách Job Requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const closeApplicationsPopup = () => {
    setIsApplicationsOpen(false);
    setSelectedRequest(null);
    setApplications([]);
    setApplicationsError(null);
    setApplicationsLoading(false);
    setApplicationsStatusFilter("");
  };

  const openApplicationsPopup = async (req: AugmentedJobRequest) => {
    setSelectedRequest(req);
    setIsApplicationsOpen(true);
    setApplications([]);
    setApplicationsError(null);

    // Nếu chưa có hồ sơ thì chỉ mở popup thông báo
    if (!req.applicationCount || req.applicationCount <= 0) return;

    try {
      setApplicationsLoading(true);
      const res = await talentApplicationService.getByJobRequest(req.id);
      const apps = res?.data?.applications ?? [];
      setApplications(apps);
    } catch (e: unknown) {
      const msg =
        (e && typeof e === "object" && "message" in e && typeof (e as any).message === "string")
          ? (e as any).message
          : "Không thể tải danh sách hồ sơ ứng tuyển.";
      setApplicationsError(msg);
    } finally {
      setApplicationsLoading(false);
    }
  };

  // 🧮 Lọc dữ liệu theo điều kiện
  const filteredRequestsMemo = useMemo(() => {
    let filtered = [...currentRequestsList];

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCompany)
      filtered = filtered.filter((r) =>
        r.clientCompanyName.toLowerCase().includes(filterCompany.toLowerCase())
      );
    if (filterProject)
      filtered = filtered.filter((r) =>
        r.projectName.toLowerCase().includes(filterProject.toLowerCase())
      );
    if (filterPosition)
      filtered = filtered.filter((r) =>
        r.positionName?.toLowerCase().includes(filterPosition.toLowerCase())
      );
    if (filterStatus)
      filtered = filtered.filter((r) => r.status === Number(filterStatus));

    return filtered;
  }, [currentRequestsList, searchTerm, filterCompany, filterProject, filterPosition, filterStatus]);

  useEffect(() => {
    setFilteredRequests(filteredRequestsMemo);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [filteredRequestsMemo]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  const startItem = filteredRequests.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredRequests.length);

  const handlePrevStats = () => {
    setStatsStartIndex((prev) => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex((prev) => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  const statsSlice = useMemo(() => stats.slice(
    statsStartIndex,
    Math.min(statsStartIndex + statsPageSize, stats.length)
  ), [stats, statsStartIndex, statsPageSize]);

  const canShowStatsNav = useMemo(() => stats.length > statsPageSize, [stats.length, statsPageSize]);
  const canGoPrev = useMemo(() => canShowStatsNav && statsStartIndex > 0, [canShowStatsNav, statsStartIndex]);
  const canGoNext = useMemo(() => canShowStatsNav && statsStartIndex + statsPageSize < stats.length, [canShowStatsNav, statsStartIndex, statsPageSize, stats.length]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterCompany("");
    setFilterProject("");
    setFilterPosition("");
    setFilterStatus("");
    setCompanySearch("");
    setProjectSearch("");
    setPositionSearch("");
    setIsStatusDropdownOpen(false);
  };

  // Helper functions to get display text
  const getCompanyDisplayText = () => {
    if (!filterCompany) return "Tất cả công ty";
    const company = companies.find(c => c.name === filterCompany);
    return company?.name || "Tất cả công ty";
  };

  const getProjectDisplayText = () => {
    if (!filterProject) return "Tất cả dự án";
    const project = projects.find(p => p.name === filterProject);
    return project?.name || "Tất cả dự án";
  };

  const getPositionDisplayText = () => {
    if (!filterPosition) return "Tất cả vị trí";
    const position = positions.find(p => p.name === filterPosition);
    return position?.name || "Tất cả vị trí";
  };

  const getStatusDisplayText = () => {
    if (!filterStatus) return "Tất cả trạng thái";
    const statusKey = statusLabels[Number(filterStatus)];
    return statusLabelDisplay[statusKey] || "Tất cả trạng thái";
  };

  // Status options
  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "0", label: "⏳ Chờ duyệt" },
    { value: "1", label: "✅ Đã duyệt" },
    { value: "2", label: "🔒 Đã đóng" },
    { value: "3", label: "❌ Bị từ chối" },
  ];

  // Check if there are active filters
  const hasActiveFilters = searchTerm || filterCompany || filterProject || filterPosition || filterStatus;

  if (loading)
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        {/* Popup danh sách hồ sơ ứng tuyển */}
        {isApplicationsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeApplicationsPopup();
            }}
          >
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden animate-fade-in">
              <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-neutral-900">Hồ sơ ứng tuyển</p>
                    {selectedRequest ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-neutral-200 bg-white text-neutral-800">
                        {applications.filter((a) => a.status === "Hired").length}/{selectedRequest.quantity}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                    {selectedRequest ? (selectedRequest.title || "(Chưa có tiêu đề)") : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeApplicationsPopup}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                  aria-label="Đóng"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                {selectedRequest ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="text-sm text-neutral-700">
                      Tổng hồ sơ:{" "}
                      <span className="font-semibold text-neutral-900">{selectedRequest.applicationCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/sales/applications?jobRequestId=${selectedRequest.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 hover:text-primary-800 hover:bg-primary-50 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Mở trang danh sách
                      </Link>
                    </div>
                  </div>
                ) : null}

                                {/* Status Tabs */}
                                <div className="mb-6">
                                    <div className="flex gap-0 border-b border-gray-200">
                                        <button
                                            onClick={() => setApplicationsStatusFilter("")}
                                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                                                applicationsStatusFilter === ""
                                                    ? "border-blue-600 text-blue-600 bg-blue-50"
                                                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                            }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Tất cả ({applications.length})
                                        </button>
                                        {[
                                            { value: "Submitted", label: "Đã nộp hồ sơ", icon: FileText },
                                            { value: "Interviewing", label: "Đang xem xét phỏng vấn", icon: Clock },
                                        ].map(({ value, label, icon: Icon }) => {
                                            const count = applications.filter(app => app.status === value).length;
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => setApplicationsStatusFilter(value)}
                                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                                                        applicationsStatusFilter === value
                                                            ? "border-blue-600 text-blue-600 bg-blue-50"
                                                            : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {label} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                {applicationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="h-4 w-56 bg-neutral-200 rounded animate-pulse" />
                            <div className="mt-2 h-3 w-32 bg-neutral-200 rounded animate-pulse" />
                          </div>
                          <div className="h-8 w-20 bg-neutral-200 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : applicationsError ? (
                  <div className="py-6 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                    <div className="px-4">{applicationsError}</div>
                  </div>
                ) : selectedRequest && selectedRequest.applicationCount <= 0 ? (
                  <div className="py-10 text-center text-sm text-neutral-600">Chưa có hồ sơ ứng tuyển cho yêu cầu này.</div>
                ) : applications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-neutral-600">Không có dữ liệu hồ sơ.</div>
                ) : (
                  <div className="max-h-[50vh] overflow-auto pr-1">
                    <div className="space-y-3">
                      {applications
                        .filter(app => !applicationsStatusFilter || app.status === applicationsStatusFilter)
                        .sort((a, b) => {
                          if (!applicationsStatusFilter) {
                            // For "Tất cả" tab, prioritize by status: Submitted first, then Interviewing
                            const statusPriority = { "Submitted": 1, "Interviewing": 2 };
                            const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 99;
                            const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 99;
                            if (aPriority !== bPriority) return aPriority - bPriority;
                          }
                          // Default sort by creation date (newest first)
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        })
                        .map((app) => {
                        const talentName = app.talentName || app.talent?.fullName || `Talent #${app.talent?.id ?? "—"}`;
                        const submitter = app.submitterName || app.submittedBy || "—";
                        const createdAt = app.createdAt ? new Date(app.createdAt).toLocaleString("vi-VN") : "—";
                        const statusLabel = app.status ? (applicationStatusLabel[app.status] ?? app.status) : "—";
                        return (
                          <div
                            key={app.id}
                            className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-soft hover:shadow-medium transition-all"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-neutral-900">{talentName}</p>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${applicationStatusColors[app.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                                  <span>Người nộp: {submitter}</span>
                                  <span>Ngày nộp: {createdAt}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => navigate(`/sales/applications/${app.id}`)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 hover:text-primary-800 hover:bg-primary-50 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Xem
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yêu cầu tuyển dụng</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">Quản lý và theo dõi các yêu cầu từ công ty khách hàng</p>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center justify-center w-7 h-7 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors duration-300"
                  title={showStats ? "Ẩn thống kê" : "Hiện thống kê"}
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Link to="/sales/job-requests/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo yêu cầu mới
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setActiveTab("my")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === "my"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50"
                }`}
              >
                YCTD của tôi
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                  {myRequestsCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === "all"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50"
                }`}
              >
                Tất cả YCTD
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                  {allRequestsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {showStats && (
            <div className="mb-8 animate-fade-in">
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsSlice.map((stat, index) => (
                    <div key={`${stat.title}-${statsStartIndex + index}`} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full ${
                          stat.color === 'blue'
                            ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                            : stat.color === 'green'
                            ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                            : stat.color === 'purple'
                            ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                            : stat.color === 'red'
                            ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                            : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                        } transition-all duration-300`}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {canShowStatsNav && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevStats}
                      disabled={!canGoPrev}
                      className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                        canGoPrev
                          ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                          : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                      }`}
                      aria-label="Xem thống kê phía trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStats}
                      disabled={!canGoNext}
                      className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                        canGoNext
                          ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                          : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                      }`}
                      aria-label="Xem thống kê tiếp theo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              {canShowStatsNav && (
                <div className="mt-3 flex justify-end text-xs text-neutral-500 lg:hidden">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStats}
                      disabled={!canGoPrev}
                      className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                        canGoPrev
                          ? 'bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                      }`}
                      aria-label="Xem thống kê phía trước"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStats}
                      disabled={!canGoNext}
                      className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                        canGoNext
                          ? 'bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                      }`}
                      aria-label="Xem thống kê tiếp theo"
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã yêu cầu, tiêu đề..."
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
                {hasActiveFilters && (
                  <span className="ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-700 text-white shadow-sm">
                    {[searchTerm, filterCompany, filterProject, filterPosition, filterStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Xóa bộ lọc</span>
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Company Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Công ty khách hàng
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                      <button
                        type="button"
                        onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                        className="w-full flex items-center justify-between pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                      >
                        <span className="text-sm text-neutral-700">{getCompanyDisplayText()}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isCompanyDropdownOpen && (
                        <div
                          className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => {
                            setIsCompanyDropdownOpen(false);
                            setCompanySearch("");
                          }}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                              <input
                                type="text"
                                value={companySearch}
                                onChange={(e) => setCompanySearch(e.target.value)}
                                placeholder="Tìm công ty..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterCompany("");
                                setIsCompanyDropdownOpen(false);
                                setCompanySearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                !filterCompany
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Tất cả công ty
                            </button>
                            {companies
                              .filter((company) =>
                                !companySearch || company.name.toLowerCase().includes(companySearch.toLowerCase())
                              )
                              .map((company) => (
                                <button
                                  type="button"
                                  key={company.id}
                                  onClick={() => {
                                    setFilterCompany(company.name);
                                    setIsCompanyDropdownOpen(false);
                                    setCompanySearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    filterCompany === company.name
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                  }`}
                                >
                                  {company.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Dự án
                    </label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                      <button
                        type="button"
                        onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                        className="w-full flex items-center justify-between pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                      >
                        <span className="text-sm text-neutral-700">{getProjectDisplayText()}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isProjectDropdownOpen && (
                        <div
                          className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => {
                            setIsProjectDropdownOpen(false);
                            setProjectSearch("");
                          }}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                              <input
                                type="text"
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                placeholder="Tìm dự án..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterProject("");
                                setIsProjectDropdownOpen(false);
                                setProjectSearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                !filterProject
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Tất cả dự án
                            </button>
                            {projects
                              .filter((project) =>
                                !projectSearch || project.name.toLowerCase().includes(projectSearch.toLowerCase())
                              )
                              .map((project) => (
                                <button
                                  type="button"
                                  key={project.id}
                                  onClick={() => {
                                    setFilterProject(project.name);
                                    setIsProjectDropdownOpen(false);
                                    setProjectSearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    filterProject === project.name
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                  }`}
                                >
                                  {project.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Position Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Vị trí
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                      <button
                        type="button"
                        onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                        className="w-full flex items-center justify-between pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                      >
                        <span className="text-sm text-neutral-700">{getPositionDisplayText()}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isPositionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isPositionDropdownOpen && (
                        <div
                          className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => {
                            setIsPositionDropdownOpen(false);
                            setPositionSearch("");
                          }}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                              <input
                                type="text"
                                value={positionSearch}
                                onChange={(e) => setPositionSearch(e.target.value)}
                                placeholder="Tìm vị trí..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterPosition("");
                                setIsPositionDropdownOpen(false);
                                setPositionSearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                !filterPosition
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Tất cả vị trí
                            </button>
                            {positions
                              .filter((position) =>
                                !positionSearch || position.name.toLowerCase().includes(positionSearch.toLowerCase())
                              )
                              .map((position) => (
                                <button
                                  type="button"
                                  key={position.id}
                                  onClick={() => {
                                    setFilterPosition(position.name);
                                    setIsPositionDropdownOpen(false);
                                    setPositionSearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    filterPosition === position.name
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'hover:bg-neutral-50 text-neutral-700'
                                  }`}
                                >
                                  {position.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Trạng thái
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                      <button
                        type="button"
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full flex items-center justify-between pl-10 pr-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                      >
                        <span className="text-sm text-neutral-700">{getStatusDisplayText()}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isStatusDropdownOpen && (
                        <div
                          className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                          onMouseLeave={() => setIsStatusDropdownOpen(false)}
                        >
                          <div className="max-h-56 overflow-y-auto">
                            {statusOptions.map((opt) => (
                              <button
                                type="button"
                                key={opt.value}
                                onClick={() => {
                                  setFilterStatus(opt.value);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  filterStatus === opt.value
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu tuyển dụng</h2>
              <div className="flex items-center gap-4">
                {filteredRequests.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${currentPage === 1
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredRequests.length}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${currentPage === totalPages
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 yêu cầu</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Công ty</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Dự án</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Vị trí</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Hồ sơ</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap min-w-[110px]">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Briefcase className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có yêu cầu nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo yêu cầu mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, i) => {
                    const statusKey = statusLabels[req.status];
                    return (
                      <tr
                        key={req.id}
                        className="group cursor-pointer hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/sales/job-requests/${req.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/sales/job-requests/${req.id}`);
                          }
                        }}
                      >
                        <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-neutral-600">
                            {req.code || "—"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors duration-300 line-clamp-3" title={req.title || "(Chưa có tiêu đề)"}>
                            {req.title || "(Chưa có tiêu đề)"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{req.clientCompanyName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{req.projectName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{req.positionName || "—"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openApplicationsPopup(req);
                            }}
                            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 transform ${
                              req.applicationCount >= req.quantity
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : req.applicationCount > 0
                                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                            title="Xem danh sách hồ sơ ứng tuyển"
                          >
                            <ClipboardList className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-semibold">{req.applicationCount}</span>
                          </button>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            req.status === JobRequestStatus.Pending ? 'bg-warning-100 text-warning-700' :
                            req.status === JobRequestStatus.Approved ? 'bg-secondary-100 text-secondary-700' :
                            req.status === JobRequestStatus.Rejected ? 'bg-red-100 text-red-700' :
                            req.status === JobRequestStatus.Closed ? 'bg-neutral-100 text-neutral-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {statusLabelDisplay[statusKey] ?? statusKey}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
