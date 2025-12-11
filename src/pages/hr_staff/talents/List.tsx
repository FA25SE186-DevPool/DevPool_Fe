import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Briefcase, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { Button } from "../../../components/ui/button";
import { useTalents } from "../../../hooks/useTalents";
import { useTalentFilters } from "../../../hooks/useTalentFilters";
import { TalentStats } from "../../../components/ta_staff/talents/TalentStats";
import { TalentFilters } from "../../../components/ta_staff/talents/TalentFilters";
import { TalentTable } from "../../../components/ta_staff/talents/TalentTable";
import { locationService, type Location } from "../../../services/location";
import { partnerService, type Partner } from "../../../services/Partner";
import { type Talent, type CreateDeveloperAccountModel } from "../../../services/Talent";
import PageLoader from "../../../components/common/PageLoader";

export default function ListDev() {
  // ========== HOOKS - Logic được tách ra hooks ==========
  const { talents, myManagedTalents, loading, createDeveloperAccount } = useTalents();
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const currentTalentsList = activeTab === "all" ? talents : myManagedTalents;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statsStartIndex, setStatsStartIndex] = useState(0);
  const itemsPerPage = 10;
  const statsPageSize = 4;

  // ========== Load lookup data ==========
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [locationData, partnerData] = await Promise.all([
          locationService.getAll({ excludeDeleted: true }),
          partnerService.getAll(),
        ]);
        setLocations(locationData);
        setPartners(partnerData);
      } catch (err) {
        console.error("❌ Không thể tải dữ liệu lookup:", err);
      }
    };
    fetchLookupData();
  }, []);

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

  // Reset page khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ========== Handlers ==========
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
      const payload: CreateDeveloperAccountModel = { email: talent.email };
      const success = await createDeveloperAccount(talent.id, payload);
      
      if (success) {
        alert(`Đã cấp tài khoản thành công cho ${talent.fullName}.\nEmail: ${talent.email}\nMật khẩu đã được gửi qua email.`);
      } else {
        alert("Không thể cấp tài khoản. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi cấp tài khoản:", err);
      const errorMessage = err?.message || err?.response?.data?.message || "Không thể cấp tài khoản. Vui lòng thử lại.";
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

  // ========== Loading state ==========
  if (loading) {
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
          <Breadcrumb items={[{ label: "Danh sách nhân sự" }]} />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Danh Sách Nhân Sự</h1>
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
        </div>

        {/* Stats - Component tái sử dụng */}
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

        {/* Filters - Component tái sử dụng */}
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

        {/* Table - Component tái sử dụng */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách nhân sự</h2>
              <div className="flex items-center gap-4">
                {filteredTalents.length > 0 ? (
                  <>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="flex items-center justify-center w-8 h-8 p-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredTalents.length}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="flex items-center justify-center w-8 h-8 p-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 nhân sự</span>
                )}
              </div>
            </div>
          </div>
          <TalentTable
            talents={paginatedTalents}
            locations={locations}
            partners={partners}
            startIndex={startIndex}
            loading={false}
            isCreatingAccount={isCreatingAccount}
            onCreateAccount={handleCreateAccount}
          />
        </div>
      </div>
    </div>
  );
}
