import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Briefcase, MapPin, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Ban } from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { Button } from "../../../components/ui/button";
import { useTalents } from "../../../hooks/useTalents";
import { useTalentFilters } from "../../../hooks/useTalentFilters";
import { useLookupData } from "../../../hooks/useLookupData";
import { TalentStats } from "../../../components/ta_staff/talents/TalentStats";
import { TalentFilters } from "../../../components/ta_staff/talents/TalentFilters";
import { TalentTable } from "../../../components/ta_staff/talents/TalentTable";
import { type Talent, talentService } from "../../../services/Talent";
import { clientTalentBlacklistService, type ClientTalentBlacklist } from "../../../services/ClientTalentBlacklist";
import PageLoader from "../../../components/common/PageLoader";

export default function ListDev() {
  // ========== HOOKS - Logic được tách ra hooks ==========
  const { talents, myManagedTalents, loading } = useTalents();
  const { partners, locations, loading: lookupLoading } = useLookupData({ includeTalentData: true });
  const [activeTab, setActiveTab] = useState<"all" | "my" | "blacklist">("my");
  const [blacklistedTalents, setBlacklistedTalents] = useState<Talent[]>([]);
  const [loadingBlacklisted, setLoadingBlacklisted] = useState(false);
  const currentTalentsList = activeTab === "all" ? talents : activeTab === "blacklist" ? blacklistedTalents : myManagedTalents;
  const {
    filters,
    setSearchTerm,
    setLocation,
    setStatus,
    setWorkingMode,
    setPartnerId,
    resetFilters,
    filteredTalents
  } = useTalentFilters(currentTalentsList);

  // ========== State cho UI ==========
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statsStartIndex, setStatsStartIndex] = useState(0);
  const itemsPerPage = 10;
  const statsPageSize = 4;

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


  // ========== Load blacklisted talents on mount ==========
  useEffect(() => {
    const fetchBlacklistedTalents = async () => {
      
      try {
        setLoadingBlacklisted(true);
        // Lấy tất cả blacklist records (active only)
        const blacklistData = await clientTalentBlacklistService.getAll({
          isActive: true,
          excludeDeleted: true,
        });
        const blacklists = ensureArray<ClientTalentBlacklist>(blacklistData);
        
        // Lấy unique talent IDs
        const uniqueTalentIds = [...new Set(blacklists.map(b => b.talentId))];
        
        // Fetch thông tin talent từ các IDs
        const talentPromises = uniqueTalentIds.map(id => 
          talentService.getById(id).catch(() => null)
        );
        const talentResults = await Promise.all(talentPromises);
        const validTalents = talentResults.filter((t): t is Talent => t !== null);
        
        setBlacklistedTalents(validTalents);
      } catch (err) {
        console.error("❌ Không thể tải danh sách talent bị blacklist:", err);
        setBlacklistedTalents([]);
      } finally {
        setLoadingBlacklisted(false);
      }
    };
    
    fetchBlacklistedTalents();
  }, []); // Only run on mount to show correct count in tab

  // ========== Tính toán stats ==========
  const stats = useMemo(() => [
    {
      title: activeTab === "all" ? "Tổng nhân sự" : "Nhân sự của tôi",
      value: currentTalentsList.length.toString(),
      color: "blue" as const,
      icon: <Users className="w-6 h-6" />,
      status: undefined, // Không filter, hiển thị tất cả
    },
    {
      title: "Sẵn sàng làm việc",
      value: currentTalentsList.filter((t) => t.status === "Available").length.toString(),
      color: "green" as const,
      icon: <Briefcase className="w-6 h-6" />,
      status: "Available",
    },
    {
      title: "Đang bận",
      value: currentTalentsList.filter((t) => t.status === "Busy").length.toString(),
      color: "orange" as const,
      icon: <MapPin className="w-6 h-6" />,
      status: "Busy",
    },
    {
      title: "Đang làm việc",
      value: currentTalentsList.filter((t) => t.status === "Working").length.toString(),
      color: "blue" as const,
      icon: <Briefcase className="w-6 h-6" />,
      status: "Working",
    },
    {
      title: "Đang ứng tuyển",
      value: currentTalentsList.filter((t) => t.status === "Applying").length.toString(),
      color: "purple" as const,
      icon: <Users className="w-6 h-6" />,
      status: "Applying",
    },
    {
      title: "Tạm ngưng",
      value: currentTalentsList.filter((t) => t.status === "Unavailable").length.toString(),
      color: "gray" as const,
      icon: <MapPin className="w-6 h-6" />,
      status: "Unavailable",
    },
  ], [currentTalentsList, activeTab]);

  // ========== Pagination ==========
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTalents = filteredTalents.slice(startIndex, endIndex);
  const startItem = filteredTalents.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTalents.length);

  // Reset page khi filter thay đổi hoặc chuyển tab
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // ========== Handlers ==========

  const handlePrevStats = () => {
    setStatsStartIndex((prev) => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex((prev) => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  // ========== Loading state ==========
  if (loading || lookupLoading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1">
          <PageLoader />
        </div>
      </div>
    );
  }

  // ========== RENDER - Chỉ UI, logic đã được tách ra ==========
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Danh Sách Nhân Sự</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">
                  Quản lý và theo dõi nhân sự trong hệ thống DevPool
                </p>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center justify-center w-7 h-7 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors duration-300"
                  title={showStats ? "Ẩn thống kê" : "Hiện thống kê"}
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Link to="/ta/talents/create">
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
                onClick={() => setActiveTab("blacklist")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === "blacklist"
                    ? "border-red-600 text-red-600 bg-red-50"
                    : "border-transparent text-neutral-600 hover:text-red-600 hover:bg-neutral-50"
                }`}
              >
                <Ban className="w-4 h-4" />
                Nhân sự bị blacklist
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                  {blacklistedTalents.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats - Component tái sử dụng (ẩn khi ở tab blacklist) */}
        {showStats && activeTab !== "blacklist" && (
          <TalentStats
            stats={stats}
            startIndex={statsStartIndex}
            pageSize={statsPageSize}
            onPrev={handlePrevStats}
            onNext={handleNextStats}
            onStatClick={(status) => {
              if (status === undefined) {
                // Reset filter nếu click vào "Tổng nhân sự"
                resetFilters();
              } else {
                // Set filter theo status
                setStatus(status);
              }
            }}
          />
        )}

        {/* Filters - Component tái sử dụng (ẩn khi ở tab blacklist) */}
        {activeTab !== "blacklist" && (
          <TalentFilters
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            searchTerm={filters.searchTerm}
            onSearchChange={setSearchTerm}
            filterLocation={filters.location}
            onLocationChange={setLocation}
            filterStatus={filters.status}
            onStatusChange={setStatus}
            filterWorkingMode={filters.workingMode}
            onWorkingModeChange={setWorkingMode}
            filterPartnerId={filters.partnerId}
            onPartnerIdChange={setPartnerId}
            locations={locations}
            partners={partners}
            onReset={resetFilters}
          />
        )}

        {/* Table - Component tái sử dụng */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === "blacklist" ? "Danh sách nhân sự bị blacklist" : "Danh sách nhân sự"}
              </h2>
              <div className="flex items-center gap-4">
                {filteredTalents.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredTalents.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 nhân sự</span>
                )}
              </div>
            </div>
          </div>
          {loadingBlacklisted ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải danh sách talent bị blacklist...</p>
            </div>
          ) : (
            <TalentTable
              talents={paginatedTalents}
              locations={locations}
              partners={partners}
              startIndex={startIndex}
              loading={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
