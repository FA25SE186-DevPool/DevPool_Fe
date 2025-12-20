import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/accountant";
import { Button } from "../../../components/ui/button";
import { projectService, type Project } from "../../../services/Project";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { marketService, type Market } from "../../../services/Market";
import {
  Search,
  Filter,
  Building2,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Pause,
  X
} from "lucide-react";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");
  const [filterMarketId, setFilterMarketId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Stats pagination
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

  const formatViDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Stats data
  const stats = [
    {
      title: 'Tổng Dự Án',
      value: projects.length.toString(),
      color: 'blue',
      icon: <Layers className="w-6 h-6" />
    },
    {
      title: 'Đã Lên Kế Hoạch',
      value: projects.filter(p => p.status === 'Planned').length.toString(),
      color: 'orange',
      icon: <CalendarDays className="w-6 h-6" />
    },
    {
      title: 'Đang Thực Hiện',
      value: projects.filter(p => p.status === 'Ongoing').length.toString(),
      color: 'green',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: 'Tạm Dừng',
      value: projects.filter(p => p.status === 'OnHold').length.toString(),
      color: 'yellow',
      icon: <Pause className="w-6 h-6" />
    },
    {
      title: 'Đã Hoàn Thành',
      value: projects.filter(p => p.status === 'Completed').length.toString(),
      color: 'purple',
      icon: <Building2 className="w-6 h-6" />
    }
  ];

  // Stats slice và navigation
  const statsSlice = stats.slice(
    statsStartIndex,
    Math.min(statsStartIndex + statsPageSize, stats.length)
  );
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrevStats = canShowStatsNav && statsStartIndex > 0;
  const canGoNextStats = canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex((prev) => Math.min(prev, maxIndex));
  }, [stats.length, statsPageSize]);

  const handlePrevStats = () => {
    setStatsStartIndex((prev) => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex((prev) =>
      Math.min(Math.max(0, stats.length - statsPageSize), prev + statsPageSize)
    );
  };

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
      try {
        setLoading(true);
        const [projectRes, companyRes, marketRes] = await Promise.all([
          projectService.getAll({ excludeDeleted: true }),
          clientCompanyService.getAll({ excludeDeleted: true }),
          marketService.getAll({ excludeDeleted: true }),
        ]);

        // Ensure all data are arrays - handle PagedResult with Items/items or direct array
        const projectsArray = ensureArray<Project>(projectRes);
        const companiesArray = ensureArray<ClientCompany>(companyRes);
        const marketsArray = ensureArray<Market>(marketRes);

        // Sắp xếp dự án: mới nhất lên đầu (theo createdAt hoặc id)
        const sortedProjects = [...projectsArray].sort((a, b) => {
          const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          if (dateA !== 0 || dateB !== 0) {
            return dateB - dateA; // Mới nhất lên đầu
          }
          return b.id - a.id; // Nếu không có createdAt, sắp xếp theo id giảm dần
        });

        setProjects(sortedProjects);
        setFilteredProjects(sortedProjects);
        setCompanies(companiesArray);
        setMarkets(marketsArray);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách dự án:", err);
        setProjects([]);
        setFilteredProjects([]);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const company = companies.find(c => c.id === p.clientCompanyId);
        return (
          p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterMarketId) {
      const marketIdNum = Number(filterMarketId);
      filtered = filtered.filter(p => p.marketId === marketIdNum);
    }

    // Lọc theo khoảng thời gian dự án (thông minh, không cần nhập ngày cụ thể)
    if (filterDateRange) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const daysMap: Record<string, number> = {
        "7": 7,
        "30": 30,
        "90": 90,
        "180": 180,
        "365": 365
      };

      const days = daysMap[filterDateRange] ?? 0;

      if (days > 0) {
        const start = new Date(today);
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);

        const filterStartTime = start.getTime();
        const filterEndTime = today.getTime();

        const parseDate = (value?: string | null): number | null => {
          if (!value) return null;
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) return null;
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        filtered = filtered.filter(p => {
          const projectStart = parseDate(p.startDate as string);
          if (projectStart === null) return false;

          const projectEnd = parseDate(p.endDate as string | null);

          // Nếu có ngày kết thúc: dự án nằm trong khoảng nếu khoảng (startDate, endDate) giao với (filterStart, filterEnd)
          if (projectEnd !== null) {
            return projectEnd >= filterStartTime && projectStart <= filterEndTime;
          }

          // Nếu không có ngày kết thúc: chỉ cần startDate nằm trong hoặc sau filterStart và trước / bằng filterEnd
          return projectStart >= filterStartTime && projectStart <= filterEndTime;
        });
      }
    }

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterStatus, filterMarketId, filterDateRange, projects, companies]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
  const startItem = filteredProjects.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredProjects.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterMarketId("");
    setFilterDateRange("");
    setIsStatusDropdownOpen(false);
    setIsMarketDropdownOpen(false);
    setIsDateRangeDropdownOpen(false);
  };

  const hasActiveFilters = Boolean(searchTerm || filterStatus || filterMarketId || filterDateRange);

  const statusLabels: Record<string, string> = {
    Planned: "Đã lên kế hoạch",
    Ongoing: "Đang thực hiện",
    OnHold: "Tạm dừng",
    Completed: "Đã hoàn thành"
  };

  const getStatusFilterLabel = () => {
    if (!filterStatus) return "Tất cả trạng thái";
    return statusLabels[filterStatus] || "Tất cả trạng thái";
  };

  const getMarketFilterLabel = () => {
    if (!filterMarketId) return "Tất cả thị trường";
    const market = markets.find((m) => m.id === Number(filterMarketId));
    return market?.name || "Tất cả thị trường";
  };

  const filteredMarkets = markets
    .filter(market =>
      market.name.toLowerCase().includes(marketSearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const getDateRangeFilterLabel = () => {
    if (!filterDateRange) return "Tất cả thời gian";
    switch (filterDateRange) {
      case "7":
        return "7 ngày gần nhất";
      case "30":
        return "30 ngày gần nhất";
      case "90":
        return "3 tháng gần nhất";
      case "180":
        return "6 tháng gần nhất";
      case "365":
        return "12 tháng gần nhất";
      default:
        return "Tất cả thời gian";
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Staff Accountant" />
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
      <Sidebar items={sidebarItems} title="Staff Accountant" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dự án</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">Quản lý và theo dõi các dự án khách hàng</p>
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
                      <div className={`p-3 rounded-full ${stat.color === 'blue' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                          stat.color === 'green' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                            stat.color === 'purple' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                              stat.color === 'yellow' ? 'bg-warning-100 text-warning-600 group-hover:bg-warning-200' :
                                stat.color === 'red' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' :
                                  'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
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
                    disabled={!canGoPrevStats}
                    className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      canGoPrevStats
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
                    disabled={!canGoNextStats}
                    className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      canGoNextStats
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
                    disabled={!canGoPrevStats}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoPrevStats
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
                    disabled={!canGoNextStats}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoNextStats
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
                  placeholder="Tìm kiếm theo mã dự án, tên dự án, tên công ty..."
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
                    {[searchTerm, filterStatus, filterMarketId, filterDateRange].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <Button onClick={handleResetFilters} variant="outline" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Trạng thái - dropdown giống loại đối tác */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusDropdownOpen((prev) => !prev);
                        setIsMarketDropdownOpen(false);
                        setIsDateRangeDropdownOpen(false);
                      }}
                      className="w-full h-10 flex items-center justify-between px-4 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                    >
                      <span className="text-sm text-neutral-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neutral-400" />
                        {getStatusFilterLabel()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isStatusDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isStatusDropdownOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => setIsStatusDropdownOpen(false)}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus("");
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !filterStatus ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus("Planned");
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterStatus === "Planned"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Đã lên kế hoạch
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus("Ongoing");
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterStatus === "Ongoing"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Đang thực hiện
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus("OnHold");
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterStatus === "OnHold"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tạm dừng
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterStatus("Completed");
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterStatus === "Completed"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Đã hoàn thành
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thị trường - dropdown giống loại đối tác */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMarketDropdownOpen((prev) => !prev);
                        setIsStatusDropdownOpen(false);
                        setIsDateRangeDropdownOpen(false);
                      }}
                      className="w-full h-10 flex items-center justify-between px-4 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                    >
                      <span className="text-sm text-neutral-700 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        {getMarketFilterLabel()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isMarketDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isMarketDropdownOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => setIsMarketDropdownOpen(false)}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={marketSearch}
                              onChange={(e) => setMarketSearch(e.target.value)}
                              placeholder="Tìm thị trường..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterMarketId("");
                              setMarketSearch("");
                              setIsMarketDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !filterMarketId ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả thị trường
                          </button>
                          {filteredMarkets.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy thị trường phù hợp</p>
                          ) : (
                            filteredMarkets.map((market) => (
                              <button
                                key={market.id}
                                type="button"
                                onClick={() => {
                                  setFilterMarketId(String(market.id));
                                  setMarketSearch("");
                                  setIsMarketDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  filterMarketId === String(market.id)
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {market.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thời gian dự án - dropdown giống loại đối tác */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateRangeDropdownOpen((prev) => !prev);
                        setIsStatusDropdownOpen(false);
                        setIsMarketDropdownOpen(false);
                      }}
                      className="w-full h-10 flex items-center justify-between px-4 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                    >
                      <span className="text-sm text-neutral-700 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-neutral-400" />
                        {getDateRangeFilterLabel()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isDateRangeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isDateRangeDropdownOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => setIsDateRangeDropdownOpen(false)}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !filterDateRange
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả thời gian
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("7");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterDateRange === "7"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            7 ngày gần nhất
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("30");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterDateRange === "30"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            30 ngày gần nhất
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("90");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterDateRange === "90"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            3 tháng gần nhất
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("180");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterDateRange === "180"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            6 tháng gần nhất
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDateRange("365");
                              setIsDateRangeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterDateRange === "365"
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            12 tháng gần nhất
                          </button>
                        </div>
                      </div>
                    )}
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
              <h2 className="text-lg font-semibold text-gray-900">Danh sách dự án</h2>
              <div className="flex items-center gap-4">
                {filteredProjects.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredProjects.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 dự án</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã dự án</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên dự án</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Công ty khách hàng</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ngày bắt đầu</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap">Ngày kết thúc</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Layers className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có dự án nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc tạo dự án mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p, i) => {
                    const company = companies.find(c => c.id === p.clientCompanyId);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/accountant/projects/${p.id}`)}
                        className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-neutral-900">
                            <span>{startIndex + i + 1}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-neutral-600">
                            {p.code || "—"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-2 font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            <Layers className="w-4 h-4 text-neutral-400" />
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <Building2 className="w-4 h-4 text-neutral-400" />
                            <span>{company?.name ?? "—"}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <CalendarDays className="w-4 h-4 text-neutral-400" />
                            <span>{formatViDate(p.startDate as string)}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <CalendarDays className="w-4 h-4 text-neutral-400" />
                            <span>{formatViDate(p.endDate as string | null)}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              p.status === 'Ongoing'
                                ? 'bg-blue-100 text-blue-800'
                                : p.status === 'Planned'
                                ? 'bg-yellow-100 text-yellow-800'
                                : p.status === 'OnHold'
                                ? 'bg-purple-100 text-purple-800'
                                : p.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {statusLabels[p.status] || "—"}
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

