import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Building2,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  ChevronUp,
  ChevronDown,
  X,
  UserPlus
} from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/ta_staff';
import { Button } from '../../../components/ui/button';
import { partnerService, type Partner, PartnerType, type PartnerDetailedModel } from '../../../services/Partner';
import { talentAssignmentService, type TalentAssignmentModel } from '../../../services/TalentAssignment';
import { ROUTES } from '../../../router/routes'; 

export default function ListPartner() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerDetails, setPartnerDetails] = useState<Record<number, PartnerDetailedModel>>({});
  const [talentAssignments, setTalentAssignments] = useState<TalentAssignmentModel[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [filterTaxCode, setFilterTaxCode] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterPartnerType, setFilterPartnerType] = useState<PartnerType | null>(null);
  const [isPartnerTypeDropdownOpen, setIsPartnerTypeDropdownOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

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

  // Function to check if partner should show create account button
  // Conditions:
  // 1. Partner has at least 1 talent
  // 2. Partner has at least 1 active participation in projects (TalentAssignment with status Active)
  // 3. At least 1 talent of partner participates in the partner's first project
  const shouldShowCreateAccountButton = (partner: Partner): boolean => {
    const partnerDetail = partnerDetails[partner.id];

    // Condition 1: Partner has at least 1 talent
    if (!partnerDetail || !partnerDetail.talents || partnerDetail.talents.length === 0) {
      return false;
    }

    // Condition 2: Partner has at least 1 active participation in projects
    const partnerActiveAssignments = talentAssignments.filter(assignment =>
      assignment.partnerId === partner.id && assignment.status === "Active"
    );
    if (partnerActiveAssignments.length === 0) {
      return false;
    }

    // Condition 3: Find the partner's first project (earliest start date from active assignments)
    const sortedAssignments = partnerActiveAssignments.sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const firstProjectAssignment = sortedAssignments[0];
    const firstProjectId = firstProjectAssignment.projectId;

    // Check if any talent of this partner participates in the first project
    return partnerDetail.talents.some(talent =>
      talentAssignments.some(assignment =>
        assignment.talentId === talent.talentId &&
        assignment.projectId === firstProjectId &&
        assignment.status === "Active"
      )
    );
  };

  const maskPhone = (phone?: string | null) => {
    const raw = (phone ?? '').trim();
    if (!raw) return '—';
    // Giữ 4 số đầu + 3 số cuối, phần giữa thay bằng ***
    if (raw.length <= 7) return raw;
    return `${raw.slice(0, 4)}***${raw.slice(-3)}`;
  };

  // Stats data - ensure partners is always an array
  const partnersArray = Array.isArray(partners) ? partners : [];
  const stats = [
    {
      title: 'Tổng Đối Tác',
      value: partnersArray.length.toString(),
      color: 'blue',
      icon: <Building2 className="w-6 h-6" />,
      onClick: () => setFilterPartnerType(null)
    },
    {
      title: 'Đối Tác',
      value: partnersArray.filter(p => p.partnerType === PartnerType.Partner).length.toString(),
      color: 'green',
      icon: <Briefcase className="w-6 h-6" />,
      partnerType: PartnerType.Partner,
      onClick: () => setFilterPartnerType(PartnerType.Partner)
    },
    {
      title: 'Cá Nhân',
      value: partnersArray.filter(p => p.partnerType === PartnerType.Individual).length.toString(),
      color: 'orange',
      icon: <User className="w-6 h-6" />,
      partnerType: PartnerType.Individual,
      onClick: () => setFilterPartnerType(PartnerType.Individual)
    },
    {
      title: 'Công Ty Mình',
      value: partnersArray.filter(p => p.partnerType === PartnerType.OwnCompany).length.toString(),
      color: 'purple',
      icon: <Building2 className="w-6 h-6" />,
      partnerType: PartnerType.OwnCompany,
      onClick: () => setFilterPartnerType(PartnerType.OwnCompany)
    }
  ];

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getAll();
      // Ensure data is an array - handle PagedResult with Items/items or direct array
      const dataArray = ensureArray<Partner>(data);
      // Sắp xếp theo id giảm dần (mới nhất trước) - đối tác mới tạo sẽ có id lớn hơn
      const sortedData = [...dataArray].sort((a, b) => b.id - a.id);
      setPartners(sortedData);
      setFilteredPartners(sortedData);

      // Fetch detailed information for all partners to check account creation eligibility
      try {
        const detailPromises = sortedData.map(partner =>
          partnerService.getDetailedById(partner.id).catch(() => null)
        );
        const detailResults = await Promise.all(detailPromises);
        const detailsMap: Record<number, PartnerDetailedModel> = {};
        detailResults.forEach((detail, index) => {
          if (detail && sortedData[index]) {
            detailsMap[sortedData[index].id] = detail;
          }
        });
        setPartnerDetails(detailsMap);
      } catch (detailErr) {
        console.error("❌ Failed to fetch partner details:", detailErr);
        setPartnerDetails({});
      }

      // Fetch all talent assignments to check active participations
      try {
        const assignments = await talentAssignmentService.getAll({
          status: "Active",
          excludeDeleted: true
        });
        setTalentAssignments(assignments);
      } catch (assignmentErr) {
        console.error("❌ Failed to fetch talent assignments:", assignmentErr);
        setTalentAssignments([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch partners:", err);
      setPartners([]);
      setFilteredPartners([]);
      setPartnerDetails({});
      setTalentAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter partners based on search and filters
  useEffect(() => {
    // Ensure partners is an array
    const partnersArray = Array.isArray(partners) ? partners : [];
    let filtered = [...partnersArray];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.companyName ?? '').toLowerCase().includes(q) ||
        (p.code ?? '').toLowerCase().includes(q)
      );
    }
    if (filterTaxCode) filtered = filtered.filter((p) => p.taxCode?.includes(filterTaxCode));
    if (filterPhone) filtered = filtered.filter((p) => p.phone?.includes(filterPhone));
    if (filterPartnerType !== null) filtered = filtered.filter((p) => p.partnerType === filterPartnerType);
    // Đảm bảo vẫn sắp xếp theo id giảm dần (mới nhất trước) sau khi filter
    filtered.sort((a, b) => b.id - a.id);
    setFilteredPartners(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterTaxCode, filterPhone, filterPartnerType, partners]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPartners = filteredPartners.slice(startIndex, endIndex);
  const startItem = filteredPartners.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredPartners.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterTaxCode("");
    setFilterPhone("");
    setFilterPartnerType(null);
  };

  const hasActiveFilters = Boolean(searchTerm || filterTaxCode || filterPhone || filterPartnerType !== null);

  const getPartnerTypeDisplayText = () => {
    if (filterPartnerType === null) return "Tất cả loại đối tác";
    if (filterPartnerType === PartnerType.OwnCompany) return "Công ty mình";
    if (filterPartnerType === PartnerType.Partner) return "Đối tác";
    if (filterPartnerType === PartnerType.Individual) return "Cá nhân";
    return "Tất cả loại đối tác";
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
              <h1 className="text-3xl font-bold text-gray-900">Danh sách đối tác</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">
                  Quản lý và theo dõi thông tin các công ty đối tác
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
            <Button 
              onClick={() => navigate(ROUTES.TA_STAFF.PARTNERS.CREATE)}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Thêm đối tác mới
            </Button>
          </div>

          {/* Stats Cards */}
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  onClick={stat.onClick}
                  className={`group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border cursor-pointer ${
                    filterPartnerType === stat.partnerType || (filterPartnerType === null && stat.partnerType === undefined)
                      ? 'border-primary-500 bg-primary-50 shadow-glow'
                      : 'border-neutral-100 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        filterPartnerType === stat.partnerType || (filterPartnerType === null && stat.partnerType === undefined)
                          ? 'text-primary-700'
                          : 'text-neutral-600 group-hover:text-neutral-700'
                      }`}>{stat.title}</p>
                      <p className={`text-3xl font-bold mt-2 transition-colors duration-300 ${
                        filterPartnerType === stat.partnerType || (filterPartnerType === null && stat.partnerType === undefined)
                          ? 'text-primary-700'
                          : 'text-gray-900 group-hover:text-primary-700'
                      }`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full transition-all duration-300 ${
                      stat.color === 'blue' 
                        ? filterPartnerType === stat.partnerType || (filterPartnerType === null && stat.partnerType === undefined)
                          ? 'bg-primary-200 text-primary-700'
                          : 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                        : stat.color === 'green'
                          ? filterPartnerType === stat.partnerType
                            ? 'bg-secondary-200 text-secondary-700'
                            : 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                          : stat.color === 'purple'
                            ? filterPartnerType === stat.partnerType
                              ? 'bg-accent-200 text-accent-700'
                              : 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                            : filterPartnerType === stat.partnerType
                              ? 'bg-warning-200 text-warning-700'
                              : 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
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
                  placeholder="Tìm kiếm theo tên công ty, mã đối tác..."
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
                    {[searchTerm, filterTaxCode, filterPhone, filterPartnerType !== null ? '1' : ''].filter(Boolean).length}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mã số thuế"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterTaxCode}
                      onChange={(e) => setFilterTaxCode(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterPhone}
                      onChange={(e) => setFilterPhone(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPartnerTypeDropdownOpen(!isPartnerTypeDropdownOpen)}
                      className="w-full h-10 flex items-center justify-between px-4 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                    >
                      <span className="text-sm text-neutral-700">{getPartnerTypeDisplayText()}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isPartnerTypeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isPartnerTypeDropdownOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => setIsPartnerTypeDropdownOpen(false)}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterPartnerType(null);
                              setIsPartnerTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterPartnerType === null
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Tất cả loại đối tác
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterPartnerType(PartnerType.OwnCompany);
                              setIsPartnerTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterPartnerType === PartnerType.OwnCompany
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Công ty mình
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterPartnerType(PartnerType.Partner);
                              setIsPartnerTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterPartnerType === PartnerType.Partner
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Đối tác
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterPartnerType(PartnerType.Individual);
                              setIsPartnerTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterPartnerType === PartnerType.Individual
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Cá nhân
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
              <h2 className="text-lg font-semibold text-gray-900">Danh sách đối tác</h2>
              <div className="flex items-center gap-4">
                {filteredPartners.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredPartners.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 đối tác</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã đối tác</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên công ty</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap">Mã số thuế</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Loại</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Điện thoại</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có đối tác nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm đối tác mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPartners.map((p, i) => (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`${ROUTES.TA_STAFF.PARTNERS.LIST}/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`${ROUTES.TA_STAFF.PARTNERS.LIST}/${p.id}`);
                        }
                      }}
                      className="group cursor-pointer hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-primary-700">{p.code || '—'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div
                            className="min-w-0 max-w-[220px] font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300 truncate"
                            title={p.companyName}
                          >
                            {p.companyName}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-neutral-700">{p.taxCode || '—'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium leading-5 ${
                          p.partnerType === PartnerType.OwnCompany ? 'bg-blue-100 text-blue-800' :
                          p.partnerType === PartnerType.Partner ? 'bg-green-100 text-green-800' :
                          p.partnerType === PartnerType.Individual ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {p.partnerType === PartnerType.OwnCompany ? 'Công ty mình' :
                           p.partnerType === PartnerType.Partner ? 'Đối tác' :
                           p.partnerType === PartnerType.Individual ? 'Cá nhân' : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700" title={p.phone || undefined}>
                            {maskPhone(p.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Cấp tài khoản button - chỉ hiện khi có talent tham gia dự án đầu tiên lần đầu */}
                          {shouldShowCreateAccountButton(p) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement create partner account logic
                                alert(`Tính năng cấp tài khoản cho đối tác ${p.companyName} đang được phát triển`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
                              title="Cấp tài khoản đối tác"
                            >
                              <UserPlus className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="text-xs font-medium">Cấp tài khoản</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
