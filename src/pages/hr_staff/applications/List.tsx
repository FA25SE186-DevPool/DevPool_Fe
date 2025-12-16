import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentApplicationService, type TalentApplication } from "../../../services/TalentApplication";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { userService, type User } from "../../../services/User";
import { talentService, type Talent } from "../../../services/Talent";
import { 
  Search, 
  Filter, 
  Eye, 
  Briefcase, 
  FileText,
  User as UserIcon,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  UserStar,
  FileUser,
  AlertTriangle
} from "lucide-react";

type AugmentedTalentApplication = TalentApplication & {
  jobRequest?: {
    id: number;
    title: string;
    projectName?: string;
    clientCompanyName?: string;
  };
  talentCV?: {
    id: number;
    version: number;
    cvFileUrl: string;
  };
  submitterName?: string;
  talentName?: string;
};

const statusLabels: Record<string, string> = {
  Submitted: "Đã nộp hồ sơ",
  Interviewing: "Đang xem xét phỏng vấn",
  Hired: "Đã tuyển",
  Rejected: "Đã từ chối",
  Withdrawn: "Đã rút",
};

const statusColors: Record<string, string> = {
  Submitted: "bg-sky-100 text-sky-800",
  Interviewing: "bg-cyan-100 text-cyan-800",
  Hired: "bg-purple-100 text-purple-800",
  Rejected: "bg-red-100 text-red-800",
  Withdrawn: "bg-gray-100 text-gray-800",
};

export default function TalentCVApplicationPage() {
  const [searchParams] = useSearchParams();
  const jobRequestIdFromQuery = searchParams.get('jobRequestId');
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AugmentedTalentApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AugmentedTalentApplication[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJobRequestId, setFilterJobRequestId] = useState<string>(jobRequestIdFromQuery || "");
  const [jobRequestTitle, setJobRequestTitle] = useState<string>("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats navigation
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

  const stats = useMemo(() => [
    {
      title: 'Tổng Hồ Sơ',
      value: applications.length.toString(),
      color: 'blue',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: 'Đã nộp hồ sơ',
      value: applications.filter(a => a.status === 'Submitted').length.toString(),
      color: 'blue',
      icon: <FileUser className="w-6 h-6" />,
    },
    {
      title: 'Đang xem xét PV',
      value: applications.filter(a => a.status === 'Interviewing').length.toString(),
      color: 'teal',
      icon: <Eye className="w-6 h-6" />,
    },
    {
      title: 'Đã Tuyển',
      value: applications.filter(a => a.status === 'Hired').length.toString(),
      color: 'purple',
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      title: 'Đã Từ Chối',
      value: applications.filter(a => a.status === 'Rejected').length.toString(),
      color: 'red',
      icon: <XCircle className="w-6 h-6" />,
    },
    {
      title: 'Đã Rút',
      value: applications.filter(a => a.status === 'Withdrawn').length.toString(),
      color: 'gray',
      icon: <X className="w-6 h-6" />,
    },
  ], [applications]);

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex(prev => Math.min(prev, maxIndex));
  }, [stats.length, statsPageSize]);

  const statsSlice = stats.slice(
    statsStartIndex,
    Math.min(statsStartIndex + statsPageSize, stats.length)
  );
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrev = canShowStatsNav && statsStartIndex > 0;
  const canGoNext = canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

  const handlePrevStats = () => {
    setStatsStartIndex(prev => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex(prev => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all applications
        const applicationsData = await talentApplicationService.getAll({ excludeDeleted: true });
        
        // Ensure applicationsData is an array
        if (!Array.isArray(applicationsData)) {
          console.error("❌ Response không phải là mảng:", applicationsData);
          setApplications([]);
          setFilteredApplications([]);
          return;
        }
        
        // Get unique IDs
        const jobRequestIds = [...new Set(applicationsData.map(a => a.jobRequestId))];
        const cvIds = [...new Set(applicationsData.map(a => a.cvId))];
        const userIds = [...new Set(applicationsData.map(a => a.submittedBy))];
        
        // Fetch job requests, CVs, and users in parallel
        const [jobRequestsData, cvsData, usersData] = await Promise.all([
          Promise.all(jobRequestIds.map(id => jobRequestService.getById(id))),
          Promise.all(cvIds.map(id => talentCVService.getById(id))),
          Promise.all(userIds.map(id => {
            try {
              return userService.getById(id);
            } catch {
              return null;
            }
          }))
        ]);

        const talentIds = [...new Set(
          cvsData
            .map((cv: TalentCV) => cv?.talentId)
            .filter((id): id is number => typeof id === "number" && id > 0)
        )];

        const talentsData = await Promise.all(
          talentIds.map(id =>
            talentService.getById(id).catch(() => null)
          )
        );

        // Create lookup maps
        const jobRequestMap = new Map(jobRequestsData.map((jr: JobRequest) => [jr.id, jr]));
        const cvMap = new Map(cvsData.map((cv: TalentCV) => [cv.id, cv]));
        const userMap = new Map(usersData.filter((u): u is User => u !== null).map((u: User) => [u.id, u]));
        const talentMap = new Map(
          talentsData
            .filter((talent): talent is Talent => talent !== null && typeof talent?.id === "number")
            .map((talent: Talent) => [talent.id, talent])
        );

        // Augment applications with related data
        const augmented: AugmentedTalentApplication[] = applicationsData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(app => {
          const jobRequest = jobRequestMap.get(app.jobRequestId);
          const talentCV = cvMap.get(app.cvId);
          const submitter = userMap.get(app.submittedBy);
          const talent = talentCV ? talentMap.get(talentCV.talentId) : undefined;
          
          return {
            ...app,
            jobRequest: jobRequest ? {
              id: jobRequest.id,
              title: jobRequest.title,
            } : undefined,
            talentCV: talentCV ? {
              id: talentCV.id,
              version: talentCV.version,
              cvFileUrl: talentCV.cvFileUrl,
            } : undefined,
            submitterName: submitter?.fullName || app.submittedBy,
            talentName: talent?.fullName
          };
        });

        setApplications(augmented);
        setFilteredApplications(augmented);
      } catch (err: unknown) {
        console.error("❌ Lỗi khi tải danh sách Applications:", err);
        if (err && typeof err === 'object' && 'message' in err) {
          console.error("❌ Chi tiết lỗi:", {
            message: (err as { message?: string }).message,
            response: (err as { response?: { data?: unknown; status?: number } }).response?.data,
            status: (err as { response?: { status?: number } }).response?.status,
            url: (err as { config?: { url?: string } }).config?.url
          });
        }
        setApplications([]);
        setFilteredApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch job request title if jobRequestId is provided in query string
  useEffect(() => {
    const fetchJobRequestTitle = async () => {
      if (jobRequestIdFromQuery) {
        try {
          const jobRequest = await jobRequestService.getById(Number(jobRequestIdFromQuery));
          setJobRequestTitle(jobRequest.title || "");
        } catch (err) {
          console.error("❌ Lỗi khi tải thông tin Job Request:", err);
          setJobRequestTitle("");
        }
      }
    };

    fetchJobRequestTitle();
  }, [jobRequestIdFromQuery]);

  useEffect(() => {
    let filtered = [...applications];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((a) => 
        a.jobRequest?.title?.toLowerCase().includes(lowerSearch) ||
        a.submitterName?.toLowerCase().includes(lowerSearch) ||
        a.talentName?.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterStatus) filtered = filtered.filter((a) => a.status === filterStatus);
    if (filterJobRequestId) {
      filtered = filtered.filter((a) => a.jobRequestId === Number(filterJobRequestId));
    }
    setFilteredApplications(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterStatus, filterJobRequestId, applications]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
  const startItem = filteredApplications.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredApplications.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterJobRequestId("");
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý hồ sơ ứng tuyển</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">Danh sách các hồ sơ ứng viên đã nộp</p>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center justify-center w-7 h-7 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors duration-300"
                  title={showStats ? "Ẩn thống kê" : "Hiện thống kê"}
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Info Banner */}
          {filterJobRequestId && jobRequestTitle && (
            <div className="mb-6 bg-primary-50 border border-primary-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-primary-900">
                      Đang lọc theo yêu cầu tuyển dụng:
                    </p>
                    <p className="text-lg font-semibold text-primary-700 mt-1">
                      {jobRequestTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 rounded-lg transition-all duration-300"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {showStats && (
          <div className="mb-8 animate-fade-in">
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsSlice.map((stat, index) => (
                  <div
                    key={`${stat.title}-${statsStartIndex + index}`}
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
                          stat.color === 'blue'
                            ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                            : stat.color === 'green'
                            ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                            : stat.color === 'purple'
                            ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                            : stat.color === 'red'
                            ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                            : stat.color === 'gray'
                            ? 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                            : stat.color === 'teal'
                            ? 'bg-teal-100 text-teal-600 group-hover:bg-teal-200'
                            : 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                        } transition-all duration-300`}
                      >
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
                  placeholder="Tìm kiếm theo tên, email, tiêu đề yêu cầu..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Submitted">Đã nộp hồ sơ</option>
                    <option value="Interviewing">Đang xem xét phỏng vấn</option>
                    <option value="Hired">Đã tuyển</option>
                    <option value="Rejected">Đã từ chối</option>
                    <option value="Withdrawn">Đã rút</option>
                  </select>
                  <button
                    onClick={handleResetFilters}
                    className="group flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 transform"
                  >
                    <span className="font-medium">Đặt lại</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách hồ sơ</h2>
              <div className="flex items-center gap-4">
                {filteredApplications.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredApplications.length}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === totalPages
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 hồ sơ</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Người nộp</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên ứng viên</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Yêu cầu tuyển dụng</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Phiên bản CV</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ngày nộp</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có hồ sơ nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((app, i) => {
                    // Tính toán idle và cảnh báo
                    const getLastUpdatedTime = () => {
                      if (app.updatedAt) return new Date(app.updatedAt);
                      return new Date(app.createdAt);
                    };
                    const lastUpdated = getLastUpdatedTime();
                    const daysSinceUpdate = Math.floor(
                      (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isIdle5Days = daysSinceUpdate >= 5;
                    const isIdle10Days = daysSinceUpdate > 10;
                    const isIdle7Days = daysSinceUpdate >= 7; // Giữ cho tag "Idle 7d+"

                    return (
                    <tr
                      key={app.id}
                      className={`group transition-all duration-300 ${
                        isIdle5Days 
                          ? isIdle10Days
                            ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-500"
                            : "bg-amber-50/50 hover:bg-amber-100/70 border-l-4 border-amber-500"
                          : "hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50"
                      }`}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-700">{app.submitterName || app.submittedBy}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <UserStar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{app.talentName ?? "—"}</span>
                          {/* Icon cảnh báo bên cạnh tên ứng viên */}
                          {isIdle5Days && (
                            <span
                              title={isIdle10Days 
                                ? `⚠️ Cần chú ý: Đã ${daysSinceUpdate} ngày không cập nhật (Quá 10 ngày)` 
                                : `⚠️ Cần chú ý: Đã ${daysSinceUpdate} ngày không cập nhật (5-10 ngày)`
                              }
                              className="inline-flex items-center"
                            >
                              <AlertTriangle 
                                className={`w-4 h-4 flex-shrink-0 ${
                                  isIdle10Days ? "text-red-600" : "text-amber-600"
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-primary-700 font-medium">{app.jobRequest?.title ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-neutral-700">{app.talentCV?.version ? `v${app.talentCV.version}` : "—"}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {statusLabels[app.status] ?? app.status}
                          </span>
                          {isIdle7Days && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Idle {daysSinceUpdate}d+
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm text-neutral-700">{new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          to={`/ta/applications/${app.id}`}
                          className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-medium">Xem</span>
                        </Link>
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