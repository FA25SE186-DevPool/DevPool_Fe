import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { partnerDashboardService, type PartnerTalentSummary } from '../../services/PartnerDashboard';
import { WORKING_MODE } from '../../constants/WORKING_MODE';
import { locationService, type Location } from '../../services/location';
import { useState } from 'react';

const statusLabels = {
  'Available': 'Sẵn sàng',
  'Working': 'Đang làm việc',
  'Applying': 'Đang ứng tuyển',
  'Unavailable': 'Tạm ngưng',
  'Busy': 'Đang bận'
};

export default function PartnerTalents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [talents, setTalents] = useState<PartnerTalentSummary[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<PartnerTalentSummary[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [workingModeFilter, setWorkingModeFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Locations for mapping locationId to location name
  const [locations, setLocations] = useState<Location[]>([]);

  // Dropdown states
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isWorkingModeDropdownOpen, setIsWorkingModeDropdownOpen] = useState(false);


  // Stats data - ensure talents is always an array
  const talentsArray = Array.isArray(talents) ? talents : [];
  const stats = [
    {
      title: 'Tổng Nhân Sự',
      value: talentsArray.length.toString(),
      color: 'blue',
      icon: <Users className="w-6 h-6" />,
      status: null
    },
    {
      title: 'Sẵn Sàng',
      value: talentsArray.filter(t => t.status === 'Available').length.toString(),
      color: 'green',
      icon: <User className="w-6 h-6" />,
      status: 'Available'
    },
    {
      title: 'Đang Làm Việc',
      value: talentsArray.filter(t => t.status === 'Working').length.toString(),
      color: 'blue',
      icon: <Briefcase className="w-6 h-6" />,
      status: 'Working'
    },
    {
      title: 'Đang Phỏng Vấn',
      value: talentsArray.filter(t => t.status === 'Interviewing').length.toString(),
      color: 'orange',
      icon: <User className="w-6 h-6" />,
      status: 'Interviewing'
    },
    {
      title: 'Đang Ứng Tuyển',
      value: talentsArray.filter(t => t.status === 'Applying').length.toString(),
      color: 'purple',
      icon: <User className="w-6 h-6" />,
      status: 'Applying'
    }
  ];

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.Items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setLoading(true);
        setError('');

        // Backend automatically gets userId from JWT token
        const talentsData = await partnerDashboardService.getMyTalents();
        setTalents(talentsData);
        setFilteredTalents(talentsData);
      } catch (err: any) {
        console.error('Error fetching talents:', err);
        setError(err.message || 'Không thể tải danh sách nhân sự');
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, [user]);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationData = await locationService.getAll({ excludeDeleted: true });
        setLocations(ensureArray<Location>(locationData));
      } catch (err) {
        console.error('Error fetching locations:', err);
        setLocations([]);
      }
    };

    fetchLocations();
  }, []);

  // Filter talents based on search and filters
  useEffect(() => {
    let filtered = talents;

    if (searchTerm) {
      filtered = filtered.filter(talent =>
        talent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(talent => talent.status === statusFilter);
    }

    if (locationFilter !== null) {
      filtered = filtered.filter(talent => talent.locationId === locationFilter);
    }

    if (workingModeFilter !== null) {
      filtered = filtered.filter(talent => talent.workingMode === workingModeFilter);
    }

    setFilteredTalents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, locationFilter, workingModeFilter, talents]);

  // Pagination
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTalents = filteredTalents.slice(startIndex, endIndex);
  const startItem = filteredTalents.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTalents.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setLocationFilter(null);
    setWorkingModeFilter(null);
  };

  const hasActiveFilters = Boolean(searchTerm || statusFilter || locationFilter !== null || workingModeFilter !== null);


  const getWorkingModeLabel = (workingMode?: number): string => {
    if (!workingMode || workingMode === 0) return '—';

    const modes: string[] = [];
    if (workingMode & WORKING_MODE.Onsite) modes.push('Tại văn phòng');
    if (workingMode & WORKING_MODE.Remote) modes.push('Từ xa');
    if (workingMode & WORKING_MODE.Hybrid) modes.push('Kết hợp');
    if (workingMode & WORKING_MODE.Flexible) modes.push('Linh hoạt');

    return modes.join(', ') || '—';
  };

  // Helper functions để lấy display text cho dropdown
  const getLocationDisplayText = () => {
    if (locationFilter === null) return 'Tất cả địa điểm';
    const location = locations.find(l => l.id === locationFilter);
    return location?.name || 'Tất cả địa điểm';
  };

  const getStatusDisplayText = () => {
    if (!statusFilter) return 'Tất cả trạng thái';
    return statusLabels[statusFilter as keyof typeof statusLabels] || 'Tất cả trạng thái';
  };

  const getWorkingModeDisplayText = () => {
    if (workingModeFilter === null) return 'Tất cả chế độ';
    const mode = getWorkingModeLabel(workingModeFilter);
    return mode === '—' ? 'Tất cả chế độ' : mode;
  };


  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách nhân sự...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Partner Portal" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân sự</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">
                  Danh sách nhân sự của đối tác
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
          </div>

          {/* Stats Cards */}
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8 animate-fade-in">
            {stats.map((stat, index) => (
              <div
                key={index}
                onClick={() => setStatusFilter(stat.status || "")}
                className={`group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border cursor-pointer ${
                  statusFilter === stat.status || (statusFilter === "" && stat.status === null)
                    ? 'border-primary-500 bg-primary-50 shadow-glow'
                    : 'border-neutral-100 hover:border-primary-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      statusFilter === stat.status || (statusFilter === "" && stat.status === null)
                        ? 'text-primary-700'
                        : 'text-neutral-600 group-hover:text-neutral-700'
                    }`}>{stat.title}</p>
                    <p className={`text-3xl font-bold mt-2 transition-colors duration-300 ${
                      statusFilter === stat.status || (statusFilter === "" && stat.status === null)
                        ? 'text-primary-700'
                        : 'text-gray-900 group-hover:text-primary-700'
                    }`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full transition-all duration-300 ${
                    stat.color === 'blue'
                      ? statusFilter === stat.status || (statusFilter === "" && stat.status === null)
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                      : stat.color === 'green'
                      ? statusFilter === stat.status
                        ? 'bg-secondary-200 text-secondary-700'
                        : 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                      : stat.color === 'purple'
                      ? statusFilter === stat.status
                        ? 'bg-accent-200 text-accent-700'
                        : 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                      : stat.color === 'orange'
                      ? statusFilter === stat.status
                        ? 'bg-warning-200 text-warning-700'
                        : 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                      : statusFilter === stat.status
                        ? 'bg-accent-200 text-accent-700'
                        : 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                  }`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
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
                  placeholder="Tìm kiếm theo tên, email, mã..."
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
                    {[searchTerm, statusFilter, locationFilter !== null ? '1' : '', workingModeFilter !== null ? '1' : ''].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 bg-white">
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Xóa bộ lọc</span>
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft animate-fade-in">
                  <div className="flex flex-wrap gap-4">
                    {/* Trạng thái filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Trạng thái
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
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
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  !statusFilter
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Tất cả trạng thái
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Available');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Available'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Sẵn sàng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Working');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Working'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Đang làm việc
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Interviewing');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Interviewing'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Đang phỏng vấn
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Applying');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Applying'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Đang ứng tuyển
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Unavailable');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Unavailable'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Tạm nghỉ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusFilter('Busy');
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  statusFilter === 'Busy'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Bận
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Địa điểm filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Địa điểm
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                        >
                          <span className="text-sm text-neutral-700">{getLocationDisplayText()}</span>
                          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLocationDropdownOpen && (
                          <div
                            className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                            onMouseLeave={() => {
                              setIsLocationDropdownOpen(false);
                              setLocationSearch('');
                            }}
                          >
                            <div className="p-3 border-b border-neutral-100">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <input
                                  type="text"
                                  value={locationSearch}
                                  onChange={(e) => setLocationSearch(e.target.value)}
                                  placeholder="Tìm địa điểm..."
                                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setLocationFilter(null);
                                  setIsLocationDropdownOpen(false);
                                  setLocationSearch('');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  locationFilter === null
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Tất cả địa điểm
                              </button>
                              {locations
                                .filter((location) =>
                                  !locationSearch || location.name.toLowerCase().includes(locationSearch.toLowerCase())
                                )
                                .map((location) => (
                                  <button
                                    type="button"
                                    key={location.id}
                                    onClick={() => {
                                      setLocationFilter(location.id);
                                      setIsLocationDropdownOpen(false);
                                      setLocationSearch('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      locationFilter === location.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                  >
                                    {location.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chế độ làm việc filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Chế độ làm việc
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsWorkingModeDropdownOpen(!isWorkingModeDropdownOpen)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                        >
                          <span className="text-sm text-neutral-700">{getWorkingModeDisplayText()}</span>
                          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isWorkingModeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isWorkingModeDropdownOpen && (
                          <div
                            className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                            onMouseLeave={() => setIsWorkingModeDropdownOpen(false)}
                          >
                            <div className="max-h-56 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkingModeFilter(null);
                                  setIsWorkingModeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  workingModeFilter === null
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Tất cả chế độ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkingModeFilter(WORKING_MODE.Onsite);
                                  setIsWorkingModeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  workingModeFilter === WORKING_MODE.Onsite
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Tại văn phòng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkingModeFilter(WORKING_MODE.Remote);
                                  setIsWorkingModeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  workingModeFilter === WORKING_MODE.Remote
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Từ xa
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkingModeFilter(WORKING_MODE.Hybrid);
                                  setIsWorkingModeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  workingModeFilter === WORKING_MODE.Hybrid
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Kết hợp
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkingModeFilter(WORKING_MODE.Flexible);
                                  setIsWorkingModeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  workingModeFilter === WORKING_MODE.Flexible
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                Linh hoạt
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Talents List */}
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
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Họ tên</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Địa điểm</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap">Chế độ làm việc</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredTalents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có nhân sự nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc để tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTalents.map((talent, i) => {
                    const location = locations.find(l => l.id === talent.locationId);
                    const workingModeLabel = getWorkingModeLabel(talent.workingMode);

                    return (
                      <tr
                        key={talent.talentId}
                        onClick={() => navigate(`/partner/talents/${talent.talentId}`)}
                        className="group cursor-pointer hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                      >
                        <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold text-primary-700">{talent.code || '—'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-600" />
                            </div>
                            <div
                              className="min-w-0 max-w-[220px] font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300 truncate"
                              title={talent.fullName}
                            >
                              {talent.fullName || '—'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-neutral-700">
                          {talent.email || '—'}
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-neutral-700">
                          {location?.name || '—'}
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-neutral-700">
                          {workingModeLabel}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium leading-5 ${
                            talent.status === 'Available' ? 'bg-green-100 text-green-800' :
                            talent.status === 'Working' ? 'bg-blue-100 text-blue-800' :
                            talent.status === 'Interviewing' ? 'bg-orange-100 text-orange-800' :
                            talent.status === 'Applying' ? 'bg-purple-100 text-purple-800' :
                            talent.status === 'Unavailable' ? 'bg-gray-100 text-gray-800' :
                            talent.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[talent.status as keyof typeof statusLabels] || talent.status || '—'}
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
