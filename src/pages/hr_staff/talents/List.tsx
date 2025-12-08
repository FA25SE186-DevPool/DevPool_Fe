import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  Briefcase,
  MapPin,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Mail,
  UserPlus,
} from "lucide-react";

import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/hr_staff/SidebarItems";
import { Button } from "../../../components/ui/button";
import { talentService, type Talent, type CreateDeveloperAccountModel } from "../../../services/Talent";
import { WorkingMode } from "../../../constants/WORKING_MODE";

const statusLabels: Record<string, { label: string; badgeClass: string }> = {
  Available: {
    label: "Sẵn sàng",
    badgeClass: "bg-green-100 text-green-800",
  },
  Busy: {
    label: "Đang bận",
    badgeClass: "bg-yellow-100 text-yellow-800",
  },
  Working: {
    label: "Đang làm việc",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  Applying: {
    label: "Đang ứng tuyển",
    badgeClass: "bg-purple-100 text-purple-800",
  },
  Unavailable: {
    label: "Tạm ngưng",
    badgeClass: "bg-gray-100 text-gray-700",
  },
};
import { locationService, type Location } from "../../../services/location";
import { partnerService, type Partner } from "../../../services/Partner";

export default function ListDev() {
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [myManagedTalents, setMyManagedTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState<number | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  // Bộ lọc
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWorkingMode, setFilterWorkingMode] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

  // Thống kê - dựa trên tab hiện tại
  const currentTalentsList = activeTab === "all" ? talents : myManagedTalents;
  const stats = [
    {
      title: activeTab === "all" ? "Tổng nhân sự" : "Nhân sự của tôi",
      value: currentTalentsList.length.toString(),
      color: "blue",
      icon: <Users className="w-6 h-6" />,
    },
    {
    title: "Sẵn sàng làm việc",
      value: currentTalentsList.filter((t) => t.status === "Available").length.toString(),
      color: "green",
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      title: "Đang bận",
      value: currentTalentsList.filter((t) => t.status === "Busy").length.toString(),
      color: "orange",
      icon: <MapPin className="w-6 h-6" />,
    },
  {
    title: "Đang làm việc",
    value: currentTalentsList.filter((t) => t.status === "Working").length.toString(),
    color: "blue",
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    title: "Đang ứng tuyển",
    value: currentTalentsList.filter((t) => t.status === "Applying").length.toString(),
    color: "purple",
    icon: <Users className="w-6 h-6" />,
  },
    {
      title: "Tạm ngưng",
      value: currentTalentsList
        .filter((t) => t.status === "Unavailable")
        .length.toString(),
      color: "gray",
      icon: <XCircle className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex((prev) => Math.min(prev, maxIndex));
  }, [stats.length, statsPageSize]);

  // Lấy dữ liệu talent + location + partners
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [talentData, locationData, partnerData, myManagedData] = await Promise.all([
          talentService.getAll(),
          locationService.getAll({ excludeDeleted: true }),
          partnerService.getAll(),
          talentService.getMyManagedTalents().catch(() => []), // Nếu lỗi, trả về mảng rỗng
        ]);
        
        const sortedTalents = [...talentData].sort((a, b) => {
          const createdAtA = (a as { createdAt?: string }).createdAt;
          const createdAtB = (b as { createdAt?: string }).createdAt;

          const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
          const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;

          if (timeA !== timeB) {
            return timeB - timeA;
          }

          return b.id - a.id;
        });

        const sortedMyManaged = [...myManagedData].sort((a, b) => {
          const createdAtA = (a as { createdAt?: string }).createdAt;
          const createdAtB = (b as { createdAt?: string }).createdAt;

          const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
          const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;

          if (timeA !== timeB) {
            return timeB - timeA;
          }

          return b.id - a.id;
        });

        setTalents(sortedTalents);
        setMyManagedTalents(sortedMyManaged);
        setFilteredTalents(sortedTalents);
        setLocations(locationData);
        setPartners(partnerData);
      } catch (err) {
        console.error("❌ Không thể tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refresh my managed talents khi chuyển tab
  useEffect(() => {
    if (activeTab === "my") {
      const fetchMyManaged = async () => {
        try {
          const myManagedData = await talentService.getMyManagedTalents();
          const sorted = [...myManagedData].sort((a, b) => {
            const createdAtA = (a as { createdAt?: string }).createdAt;
            const createdAtB = (b as { createdAt?: string }).createdAt;
            const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
            const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
            if (timeA !== timeB) {
              return timeB - timeA;
            }
            return b.id - a.id;
          });
          setMyManagedTalents(sorted);
        } catch (err) {
          console.error("❌ Không thể tải nhân sự của tôi:", err);
        }
      };
      fetchMyManaged();
    }
  }, [activeTab]);

  // Lọc dữ liệu - dựa trên tab hiện tại
  useEffect(() => {
    const sourceList = activeTab === "all" ? talents : myManagedTalents;
    let filtered = [...sourceList];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.fullName.toLowerCase().includes(searchLower) ||
        (t.email && t.email.toLowerCase().includes(searchLower))
      );
    }

    if (filterLocation)
      filtered = filtered.filter((t) => {
        const locationName =
          locations.find((loc) => loc.id === t.locationId)?.name || "";
        return locationName
          .toLowerCase()
          .includes(filterLocation.toLowerCase());
      });

    if (filterStatus)
      filtered = filtered.filter((t) => t.status === filterStatus);

    if (filterWorkingMode)
      filtered = filtered.filter(
        (t) => t.workingMode === Number(filterWorkingMode)
      );

    setFilteredTalents(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterLocation, filterStatus, filterWorkingMode, talents, myManagedTalents, locations, activeTab]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTalents = filteredTalents.slice(startIndex, endIndex);
  const startItem = filteredTalents.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTalents.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterLocation("");
    setFilterStatus("");
    setFilterWorkingMode("");
  };

  const handleCreateAccount = async (talent: Talent) => {
    if (!talent.email) {
      alert("Talent không có email, không thể cấp tài khoản");
      return;
    }

    if (talent.status !== "Working") {
      alert("Chỉ có thể cấp tài khoản cho talent có trạng thái 'Đang làm việc'");
      return;
    }

    if (talent.userId) {
      alert("Talent này đã có tài khoản");
      return;
    }

    const confirmCreate = window.confirm(
      `Bạn có chắc muốn cấp tài khoản cho ${talent.fullName}?\n\nEmail: ${talent.email}\nMật khẩu sẽ được gửi qua email.`
    );

    if (!confirmCreate) return;

    setIsCreatingAccount(talent.id);
    try {
      const payload: CreateDeveloperAccountModel = {
        email: talent.email,
      };

      const result = await talentService.createDeveloperAccount(talent.id, payload);
      
      if (result.success) {
        alert(`Đã cấp tài khoản thành công cho ${talent.fullName}.\nEmail: ${talent.email}\nMật khẩu đã được gửi qua email.`);
        // Refresh cả hai danh sách
        const [talentData, myManagedData] = await Promise.all([
          talentService.getAll(),
          talentService.getMyManagedTalents().catch(() => []),
        ]);
        
        const sortedTalents = [...talentData].sort((a, b) => {
          const createdAtA = (a as { createdAt?: string }).createdAt;
          const createdAtB = (b as { createdAt?: string }).createdAt;
          const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
          const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
          if (timeA !== timeB) {
            return timeB - timeA;
          }
          return b.id - a.id;
        });
        
        const sortedMyManaged = [...myManagedData].sort((a, b) => {
          const createdAtA = (a as { createdAt?: string }).createdAt;
          const createdAtB = (b as { createdAt?: string }).createdAt;
          const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
          const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
          if (timeA !== timeB) {
            return timeB - timeA;
          }
          return b.id - a.id;
        });
        
        setTalents(sortedTalents);
        setMyManagedTalents(sortedMyManaged);
        // Cập nhật filteredTalents dựa trên tab hiện tại
        const currentList = activeTab === "all" ? sortedTalents : sortedMyManaged;
        setFilteredTalents(currentList);
      } else {
        alert(result.message || "Không thể cấp tài khoản. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi cấp tài khoản:", err);
      let errorMessage = "Không thể cấp tài khoản. Vui lòng thử lại.";
      if (err && typeof err === 'object') {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsCreatingAccount(null);
    }
  };

  const handlePrevStats = () => {
    setStatsStartIndex((prev) => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex((prev) => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  const statsSlice = stats.slice(
    statsStartIndex,
    Math.min(statsStartIndex + statsPageSize, stats.length)
  );
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrev = canShowStatsNav && statsStartIndex > 0;
  const canGoNext =
    canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

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
        {/* Tiêu đề */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Danh sách nhân sự" }
            ]}
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Danh Sách Nhân Sự
              </h1>
              <p className="text-neutral-600 mt-1">
                Quản lý và theo dõi developer trong hệ thống DevPool
              </p>
            </div>
            <Link to="/ta/developers/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo nhân sự mới
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === "all"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50"
                }`}
              >
                Tất cả nhân sự
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                  {talents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === "my"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50"
                }`}
              >
                Nhân sự của tôi
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                  {myManagedTalents.length}
                </span>
              </button>
            </div>
          </div>

        {/* Thống kê */}
        <div className="mb-8 animate-fade-in">
          <div className="relative">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                      stat.color === "blue"
                        ? "bg-primary-100 text-primary-600 group-hover:bg-primary-200"
                        : stat.color === "green"
                        ? "bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200"
                        : stat.color === "purple"
                        ? "bg-accent-100 text-accent-600 group-hover:bg-accent-200"
                        : stat.color === "gray"
                        ? "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
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
                  disabled={!canGoPrev}
                  className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                    canGoPrev
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
                  disabled={!canGoNext}
                  className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                    canGoNext
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
          {canShowStatsNav && (
            <div className="mt-3 flex justify-end text-xs text-neutral-500 lg:hidden">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStats}
                  disabled={!canGoPrev}
                  className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                    canGoPrev
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
                  disabled={!canGoNext}
                  className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                    canGoNext
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
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email nhân sự..."
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
                <span className="font-medium">
                  {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                </span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Tên khu vực làm việc..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                  >
                    <option value="">Trạng thái</option>
                    <option value="Available">Sẵn sàng làm việc</option>
                    <option value="Busy">Đang bận</option>
                    <option value="Working">Đang làm việc</option>
                    <option value="Applying">Đang ứng tuyển</option>
                    <option value="Unavailable">Tạm ngưng</option>
                  </select>
                  <select
                    value={filterWorkingMode}
                    onChange={(e) => setFilterWorkingMode(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                  >
                    <option value="">Hình thức làm việc</option>
                    <option value={WorkingMode.Remote.toString()}>Làm việc từ xa</option>
                    <option value={WorkingMode.Onsite.toString()}>Tại văn phòng</option>
                    <option value={WorkingMode.Hybrid.toString()}>Kết hợp</option>
                    <option value={WorkingMode.Flexible.toString()}>Linh hoạt</option>
                  </select>
                  <button
                    onClick={handleResetFilters}
                    className="group flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 transform"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách nhân sự</h2>
              <div className="flex items-center gap-4">
                {filteredTalents.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredTalents.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 nhân sự</span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">
                    #
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Mã
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">
                    đối tác
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Họ và tên
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Email
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">
                    Trạng thái
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">
                    Tài khoản
                  </th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredTalents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có nhân sự nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo nhân sự mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTalents.map((t, i) => {
                    const partnerName =
                      partners.find((p) => p.id === t.currentPartnerId)?.companyName ||
                      "—";
                    return (
                      <tr
                        key={t.id}
                        className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                      >
                        <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold text-primary-700">
                            {t.code || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-neutral-700">
                            {partnerName}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            {t.fullName}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{t.email || "—"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {(() => {
                            const statusInfo = statusLabels[t.status] || {
                              label: t.status,
                              badgeClass: "bg-gray-100 text-gray-700",
                            };
                            return (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}
                              >
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {t.userId ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                              Đã có
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs font-semibold">
                              Chưa có
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/ta/developers/${t.id}`}
                              state={{ tab: 'cvs' }}
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-xs font-medium">Xem</span>
                            </Link>
                            {t.status === "Working" && !t.userId && (
                              <button
                                onClick={() => handleCreateAccount(t)}
                                disabled={isCreatingAccount === t.id}
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-green-200"
                                title="Cấp tài khoản"
                              >
                                {isCreatingAccount === t.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-medium">Đang tạo...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4" />
                                    <span className="text-xs font-medium">Cấp account</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
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
