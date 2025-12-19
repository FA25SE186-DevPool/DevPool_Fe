import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import { talentApplicationService, type TalentApplication } from "../../../services/TalentApplication";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { userService, type User } from "../../../services/User";
import { talentService, type Talent } from "../../../services/Talent";
import {
  FileText,
  Search,
  Filter,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User as UserIcon,
  UserStar,
  FileUser,
  Eye,
  XCircle,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";

type SalesTalentApplication = TalentApplication & {
  jobRequest?: {
    id: number;
    title: string;
    clientCompanyName?: string;
  };
  talentCV?: {
    id: number;
    version: number;
    talentId: number;
  };
  talentName?: string;
  submitterName?: string;
};

const statusLabels: Record<string, string> = {
  Submitted: "Đã nộp hồ sơ",
  Interviewing: "Đang xem xét phỏng vấn",
  Hired: "Đã tuyển",
  Rejected: "Đã từ chối",
  Withdrawn: "Đã rút",
};

const statusColors: Record<string, string> = {
  Submitted: "bg-sky-100 text-sky-700",
  Interviewing: "bg-cyan-100 text-cyan-700",
  Hired: "bg-purple-100 text-purple-700",
  Rejected: "bg-red-100 text-red-700",
};

interface JobRequestWithRelations extends JobRequest {
  project?: {
    clientCompany?: {
      name?: string;
    };
  };
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("vi-VN");
  } catch {
    return dateString;
  }
};

const formatTime = (dateString?: string | null) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export default function SalesApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobRequestIdFromQuery = searchParams.get("jobRequestId");

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<SalesTalentApplication[]>([]);
  const [filtered, setFiltered] = useState<SalesTalentApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterJobRequestId, setFilterJobRequestId] = useState<string>(jobRequestIdFromQuery ?? "");
  const [jobRequestTitle, setJobRequestTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const applicationsData = await talentApplicationService.getAll({ excludeDeleted: true });
        if (!Array.isArray(applicationsData)) {
          setApplications([]);
          setFiltered([]);
          return;
        }

        const jobRequestIds = [...new Set(applicationsData.map((app) => app.jobRequestId))];
        const cvIds = [...new Set(applicationsData.map((app) => app.cvId))];
        const userIds = [...new Set(applicationsData.map((app) => app.submittedBy))];

        const [jobRequestsData, cvsData, usersData] = await Promise.all([
          Promise.all(jobRequestIds.map((id) => jobRequestService.getById(id))),
          Promise.all(cvIds.map((id) => talentCVService.getById(id))),
          Promise.all(
            userIds.map((id) =>
              userService
                .getById(id)
                .then((user) => user)
                .catch(() => null),
            ),
          ),
        ]);

        const jobRequestMap = new Map<number, JobRequestWithRelations>(
          jobRequestsData.map((jr) => [jr.id, jr as JobRequestWithRelations]),
        );
        const cvMap = new Map<number, TalentCV>(cvsData.map((cv) => [cv.id, cv]));
        const userMap = new Map<string, User>(
          usersData.filter((u): u is User => u !== null).map((u) => [u.id, u]),
        );

        const talentIds = [...new Set(cvsData.map((cv) => cv.talentId))];
        const talents = await Promise.all(
          talentIds.map((id) =>
            talentService
              .getById(id)
              .then((talent) => talent)
              .catch(() => null),
          ),
        );
        const talentMap = new Map<number, Talent>(
          talents.filter((t): t is Talent => t !== null).map((t) => [t.id, t]),
        );

        const augmented = applicationsData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map<SalesTalentApplication>((app) => {
            const jobRequest = jobRequestMap.get(app.jobRequestId);
            const cv = cvMap.get(app.cvId);
            const talent = cv ? talentMap.get(cv.talentId) : undefined;
            const submitter = userMap.get(app.submittedBy);

            return {
              ...app,
              jobRequest: jobRequest
                ? {
                    id: jobRequest.id,
                    title: jobRequest.title,
                    clientCompanyName: jobRequest.project?.clientCompany?.name,
                  }
                : undefined,
              talentCV: cv
                ? {
                    id: cv.id,
                    version: cv.version,
                    talentId: cv.talentId,
                  }
                : undefined,
              submitterName: submitter?.fullName || app.submittedBy,
              talentName: talent?.fullName,
            };
          });

        setApplications(augmented);
        setFiltered(augmented);
      } catch (err) {
        console.error("❌ Lỗi tải hồ sơ:", err);
        setApplications([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchJobRequestTitle = async () => {
      if (jobRequestIdFromQuery) {
        try {
          const jobRequest = await jobRequestService.getById(Number(jobRequestIdFromQuery));
          setJobRequestTitle(jobRequest.title ?? "");
        } catch (err) {
          console.error("❌ Lỗi tải tiêu đề Job Request:", err);
          setJobRequestTitle("");
        }
      } else {
        setJobRequestTitle("");
      }
    };

    fetchJobRequestTitle();
  }, [jobRequestIdFromQuery]);

  useEffect(() => {
    if (jobRequestIdFromQuery) {
      setFilterJobRequestId(jobRequestIdFromQuery);
    } else {
      setFilterJobRequestId("");
    }
  }, [jobRequestIdFromQuery]);

  useEffect(() => {
    let next = [...applications];
    if (searchTerm) {
      const normalized = searchTerm.toLowerCase();
      next = next.filter(
        (app) =>
          app.jobRequest?.title.toLowerCase().includes(normalized) ||
          app.talentName?.toLowerCase().includes(normalized) ||
          app.submitterName?.toLowerCase().includes(normalized),
      );
    }
    if (statusFilter) {
      next = next.filter((app) => app.status === statusFilter);
    }
    if (filterJobRequestId) {
      const idNumber = Number(filterJobRequestId);
      next = next.filter((app) => app.jobRequestId === idNumber);
    }
    setFiltered(next);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filterJobRequestId, applications]);

  const stats = useMemo(
    () => [
      {
        title: "Tổng hồ sơ",
        value: applications.length.toString(),
        color: "blue",
        icon: <FileText className="w-6 h-6" />,
      },
      {
        title: "Đã nộp hồ sơ",
        value: applications.filter((app) => app.status === "Submitted").length.toString(),
        color: "blue",
        icon: <FileUser className="w-6 h-6" />,
      },
      {
        title: "Đang xem xét PV",
        value: applications.filter((app) => app.status === "Interviewing").length.toString(),
        color: "teal",
        icon: <Eye className="w-6 h-6" />,
      },
      {
        title: "Đã tuyển",
        value: applications.filter((app) => app.status === "Hired").length.toString(),
        color: "purple",
        icon: <CheckCircle className="w-6 h-6" />,
      },
      {
        title: "Đã từ chối",
        value: applications.filter((app) => app.status === "Rejected").length.toString(),
        color: "red",
        icon: <XCircle className="w-6 h-6" />,
      },
      {
        title: "Đã rút",
        value: applications.filter((app) => app.status === "Withdrawn").length.toString(),
        color: "gray",
        icon: <X className="w-6 h-6" />,
      },
    ],
    [applications],
  );

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex((prev) => Math.min(prev, maxIndex));
  }, [stats.length, statsPageSize]);

  const statsSlice = stats.slice(statsStartIndex, Math.min(statsStartIndex + statsPageSize, stats.length));
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrevStats = canShowStatsNav && statsStartIndex > 0;
  const canGoNextStats = canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

  const handlePrevStats = () => {
    setStatsStartIndex((prev) => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex((prev) => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filtered.slice(startIndex, endIndex);
  const startItem = filtered.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filtered.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFilterJobRequestId("");
    setJobRequestTitle("");
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("jobRequestId");
    setSearchParams(newParams);
  };

  const hasActiveFilters = Boolean(searchTerm || statusFilter || filterJobRequestId);


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hồ sơ ứng tuyển</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">Tổng quan các hồ sơ ứng viên Sales có thể theo dõi</p>
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

          {showStats && (
            <div className="mb-8 animate-fade-in">
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsSlice.map((stat, idx) => (
                    <div
                      key={`${stat.title}-${statsStartIndex + idx}`}
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
                              : stat.color === "red"
                              ? "bg-red-100 text-red-600 group-hover:bg-red-200"
                              : stat.color === "gray"
                              ? "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                              : stat.color === "teal"
                              ? "bg-teal-100 text-teal-600 group-hover:bg-teal-200"
                              : "bg-warning-100 text-warning-600 group-hover:bg-warning-200"
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
                      disabled={!canGoPrevStats}
                      className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                        canGoPrevStats
                          ? "h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300"
                          : "h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed"
                      }`}
                      aria-label="Xem thống kê phía trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStats}
                      disabled={!canGoNextStats}
                      className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                        canGoNextStats
                          ? "h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300"
                          : "h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed"
                      }`}
                      aria-label="Xem thống kê tiếp theo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {canShowStatsNav && (
              <div className="mt-3 flex justify-end text-xs text-neutral-500 lg:hidden">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStats}
                    disabled={!canGoPrevStats}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoPrevStats
                        ? "bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300"
                        : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed"
                    }`}
                    aria-label="Xem thống kê phía trước"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStats}
                    disabled={!canGoNextStats}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoNextStats
                        ? "bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300"
                        : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed"
                    }`}
                    aria-label="Xem thống kê tiếp theo"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}

          {filterJobRequestId && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                  <Briefcase className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-900">
                    Yêu cầu tuyển dụng:
                  </span>
                  <span className="text-sm font-semibold text-primary-700">
                    {jobRequestTitle || `Job Request #${filterJobRequestId}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên, email, tiêu đề yêu cầu..."
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                />
              </div>
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
              >
                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}</span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Xóa bộ lọc</span>
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="space-y-4">
                  {/* Status Filter Tabs */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Trạng thái
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatusFilter("")}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-300 whitespace-nowrap rounded-xl border-2 ${
                          statusFilter === ""
                            ? "border-blue-600 text-blue-600 bg-blue-50"
                            : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        Tất cả
                      </button>
                      {[
                        { value: "Submitted", label: "Đã nộp hồ sơ", icon: FileText },
                        { value: "Interviewing", label: "Đang xem xét phỏng vấn", icon: Clock },
                        { value: "Hired", label: "Đã tuyển", icon: CheckCircle },
                        { value: "Rejected", label: "Đã từ chối", icon: XCircle },
                      ].map(({ value, label, icon: Icon }) => {
                        const count = applications.filter(app => app.status === value).length;
                        return (
                          <button
                            key={value}
                            onClick={() => setStatusFilter(value)}
                            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-300 whitespace-nowrap rounded-xl border-2 ${
                              statusFilter === value
                                ? "border-blue-600 text-blue-600 bg-blue-50"
                                : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
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

        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách hồ sơ</h2>
              <div className="flex items-center gap-4">
                {filtered.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filtered.length}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === totalPages || totalPages === 0
                          ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    TA phụ trách
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Ứng viên
                  </th>                 
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Yêu cầu tuyển dụng
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-400">
                      Không tìm thấy hồ sơ phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((app, index) => {
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
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + index + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-700">{app.submitterName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <UserStar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">
                            {app.talentName ?? (app.talentCV?.version ? `v${app.talentCV.version}` : "—")}
                          </span>
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
                          <span className="text-sm font-semibold text-primary-700">
                            {app.jobRequest?.title ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center gap-2">
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap text-center ${
                              statusColors[app.status] ?? "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {statusLabels[app.status] ?? app.status}
                          </span>
                          {isIdle7Days && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Idle {daysSinceUpdate}d+
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-700">{formatTime(app.updatedAt ?? app.createdAt)}</span>
                          <span className="text-xs text-neutral-400">{formatDate(app.updatedAt ?? app.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          to={`/sales/applications/${app.id}`}
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem</span>
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
