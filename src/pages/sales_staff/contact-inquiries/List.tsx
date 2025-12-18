import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Calendar, 
  User,
  Building2,
  Filter, 
  Search, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/sales';
import { 
  contactInquiryService, 
  type ContactInquiryModel,
  type ContactInquiryFilterModel,
  ContactInquiryStatus,
  type ContactInquiryStatusType
} from '../../../services/ContactInquiry';

export default function ContactInquiryListPage() {
  const [inquiries, setInquiries] = useState<ContactInquiryModel[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<ContactInquiryModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ContactInquiryStatusType | ''>('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);

  const statusLabels: Record<ContactInquiryStatusType, string> = {
    New: "Mới",
    InProgress: "Đang xử lý",
    Closed: "Đã đóng"
  };

  const statusColors: Record<ContactInquiryStatusType, string> = {
    New: "bg-blue-100 text-blue-800",
    InProgress: "bg-yellow-100 text-yellow-800",
    Closed: "bg-gray-100 text-gray-800"
  };

  // Helper function to normalize status (handle both number and string)
  const normalizeStatus = (status: any): ContactInquiryStatusType => {
    if (typeof status === 'number') {
      // Map enum numbers to strings (New=1, InProgress=2, Closed=3)
      const enumMap: Record<number, ContactInquiryStatusType> = {
        1: ContactInquiryStatus.New,
        2: ContactInquiryStatus.InProgress,
        3: ContactInquiryStatus.Closed,
      };
      return enumMap[status] || ContactInquiryStatus.New;
    }
    if (typeof status === 'string') {
      // If it's already a string, check if it's a valid status
      if (status === 'New' || status === 'InProgress' || status === 'Closed') {
        return status as ContactInquiryStatusType;
      }
      // Try to match case-insensitive
      const lower = status.toLowerCase();
      if (lower === 'new') return ContactInquiryStatus.New;
      if (lower === 'inprogress' || lower === 'in progress') return ContactInquiryStatus.InProgress;
      if (lower === 'closed') return ContactInquiryStatus.Closed;
    }
    return ContactInquiryStatus.New; // Default fallback
  };

  // Stats data
  const stats = [
    {
      title: 'Tổng Yêu Cầu',
      value: totalCount.toString(),
      color: 'blue',
      icon: <Mail className="w-6 h-6" />
    },
    {
      title: 'Mới',
      value: inquiries.filter(i => normalizeStatus(i.status) === ContactInquiryStatus.New).length.toString(),
      color: 'blue',
      icon: <AlertCircle className="w-6 h-6" />
    },
    {
      title: 'Đang xử lý',
      value: inquiries.filter(i => normalizeStatus(i.status) === ContactInquiryStatus.InProgress).length.toString(),
      color: 'yellow',
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: 'Đã đóng',
      value: inquiries.filter(i => normalizeStatus(i.status) === ContactInquiryStatus.Closed).length.toString(),
      color: 'gray',
      icon: <CheckCircle className="w-6 h-6" />
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const filter: ContactInquiryFilterModel = {
          excludeDeleted: true,
          pageNumber: pageNumber,
          pageSize: pageSize,
          status: filterStatus || undefined,
          assignedTo: filterAssignedTo || undefined,
          fullName: searchTerm || undefined,
          email: searchTerm || undefined,
          subject: searchTerm || undefined
        };

        const result = await contactInquiryService.getAll(filter);
        setInquiries(result.items);
        setFilteredInquiries(result.items);
        setTotalCount(result.totalCount);
      } catch (err: any) {
        console.error("❌ Lỗi tải danh sách yêu cầu liên hệ:", err);
        setError(err.message || "Không thể tải danh sách yêu cầu liên hệ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pageNumber, pageSize, filterStatus, filterAssignedTo, searchTerm]);

  // Client-side filtering for search
  useEffect(() => {
    let filtered = [...inquiries];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.fullName.toLowerCase().includes(searchLower) ||
        i.email.toLowerCase().includes(searchLower) ||
        i.subject.toLowerCase().includes(searchLower) ||
        (i.company && i.company.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredInquiries(filtered);
    setCurrentPage(1);
  }, [searchTerm, inquiries]);

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(startIndex, endIndex);
  const startItem = filteredInquiries.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredInquiries.length);

  const statsSlice = stats.slice(statsStartIndex, Math.min(statsStartIndex + statsPageSize, stats.length));
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrevStats = statsStartIndex > 0;
  const canGoNextStats = statsStartIndex + statsPageSize < stats.length;

  const handlePrevStats = () => {
    setStatsStartIndex(prev => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex(prev => Math.min(stats.length - statsPageSize, prev + statsPageSize));
  };

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex(prev => Math.min(prev, maxIndex));
  }, [stats.length]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterAssignedTo('');
    setPageNumber(1);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Đang tải danh sách yêu cầu liên hệ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-4 sm:p-8 min-w-0">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Yêu Cầu Liên Hệ</h1>
              <p className="text-neutral-600 mt-1">Quản lý và theo dõi các yêu cầu liên hệ từ khách hàng</p>
            </div>
          </div>

          {/* Stats Cards */}
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
                          : stat.color === 'yellow'
                            ? 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
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
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in relative z-30">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 w-full sm:min-w-0 sm:max-w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, công ty, tiêu đề..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filter by Status */}
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as ContactInquiryStatusType | '')}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value={ContactInquiryStatus.New}>Mới</option>
                      <option value={ContactInquiryStatus.InProgress}>Đang xử lý</option>
                      <option value={ContactInquiryStatus.Closed}>Đã đóng</option>
                    </select>
                  </div>

                  {/* Filter by Assigned To */}
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Lọc theo người được giao"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterAssignedTo}
                      onChange={(e) => setFilterAssignedTo(e.target.value)}
                    />
                  </div>

                  {/* Reset Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={handleResetFilters}
                      className="w-full px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors duration-300"
                    >
                      Đặt lại bộ lọc
                    </button>
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
              <h2 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu liên hệ</h2>
              <div className="flex items-center gap-4">
                {filteredInquiries.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredInquiries.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 yêu cầu</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-full">
            <table className="w-full table-auto">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Khách hàng</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden lg:table-cell">Công ty</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-3 px-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden lg:table-cell">Người được giao</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden md:table-cell">Ngày tạo</th>
                  <th className="py-3 px-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                      <p>Không có yêu cầu liên hệ nào</p>
                    </td>
                  </tr>
                ) : (
                  paginatedInquiries.map((inquiry, index) => (
                    <tr key={inquiry.id} className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300">
                      <td className="py-3 px-3 text-sm font-medium text-neutral-900">{startIndex + index + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300 truncate" title={inquiry.fullName}>
                            {inquiry.fullName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate" title={inquiry.company || '—'}>
                            {inquiry.company || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-neutral-700 break-words line-clamp-2" title={inquiry.subject}>
                          {inquiry.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {(() => {
                          const normalizedStatus = normalizeStatus(inquiry.status);
                          return (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
                              {statusLabels[normalizedStatus] || normalizedStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserCheck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate" title={inquiry.assignedToName || '—'}>
                            {inquiry.assignedToName || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 break-words">
                            {formatDate(inquiry.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/sales/contact-inquiries/${inquiry.id}`}
                          className="group inline-flex items-center gap-1 px-2 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-xs font-medium hidden sm:inline">Xem</span>
                        </Link>
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

