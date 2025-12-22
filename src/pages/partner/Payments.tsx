import { useEffect, useState } from 'react';
import {
  DollarSign,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { partnerDashboardService, type PartnerMonthlyPayment, type PartnerPaymentDetail } from '../../services/PartnerDashboard';

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Processing': 'bg-blue-100 text-blue-800',
  'Paid': 'bg-green-100 text-green-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Rejected': 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  'Pending': 'Chờ xử lý',
  'Processing': 'Đang xử lý',
  'Paid': 'Đã thanh toán',
  'Overdue': 'Quá hạn',
  'Rejected': 'Từ chối'
};

const contractStatusLabels = {
  'Draft': 'Nháp',
  'Verified': 'Đã xác minh',
  'Approved': 'Đã duyệt',
  'Rejected': 'Từ chối'
};

export default function PartnerPayments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState<PartnerMonthlyPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PartnerMonthlyPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PartnerPaymentDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, [user, monthFilter, yearFilter]);

  // Filter payments based on search and status
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.talentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.talentCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(payment => payment.paymentStatus === statusFilter);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const paymentsData = await partnerDashboardService.getMonthlyPayments(yearFilter, monthFilter);
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Không thể tải danh sách thanh toán');
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = async (payment: PartnerMonthlyPayment) => {
    try {
      setModalLoading(true);
      setIsModalOpen(true);
      const paymentDetail = await partnerDashboardService.getPaymentDetail(payment.paymentId);
      setSelectedPayment(paymentDetail);
    } catch (error) {
      console.error('Error fetching payment detail:', error);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  const hasActiveFilters = Boolean(searchTerm || statusFilter);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  const startItem = filteredPayments.length > 0 ? startIndex + 1 : 0;

  // Stats data
  const paymentsArray = Array.isArray(payments) ? payments : [];
  const stats = [
    {
      title: 'Tổng thanh toán',
      value: paymentsArray.length.toString(),
      color: 'blue',
      icon: <DollarSign className="w-6 h-6" />,
      status: null
    },
    {
      title: 'Đã thanh toán',
      value: paymentsArray.filter(p => p.paymentStatus === 'Paid').length.toString(),
      color: 'green',
      icon: <CheckCircle className="w-6 h-6" />,
      status: 'Paid'
    },
    {
      title: 'Đang xử lý',
      value: paymentsArray.filter(p => p.paymentStatus === 'Processing').length.toString(),
      color: 'blue',
      icon: <Clock className="w-6 h-6" />,
      status: 'Processing'
    },
    {
      title: 'Chờ xử lý',
      value: paymentsArray.filter(p => p.paymentStatus === 'Pending').length.toString(),
      color: 'yellow',
      icon: <AlertCircle className="w-6 h-6" />,
      status: 'Pending'
    }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '—';
    const currencySymbol = currency === 'USD' ? '$' : '₫';
    return `${amount.toLocaleString('vi-VN')} ${currencySymbol}`;
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-500">Đang tải danh sách thanh toán...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
              <h1 className="text-3xl font-bold text-gray-900">Quản lý thanh toán</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-neutral-600">
                  Theo dõi thanh toán và lương cho nhân sự
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

          {/* Month/Year Filter */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Tháng:</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    Tháng {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700">Năm:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
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
                        : stat.color === 'yellow'
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
                  placeholder="Tìm kiếm theo tên nhân sự, dự án..."
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
                    {[searchTerm, statusFilter].filter(Boolean).length}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Trạng thái thanh toán</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                      >
                        <span className="text-sm text-neutral-700">
                          {statusFilter ? statusLabels[statusFilter as keyof typeof statusLabels] || 'Tất cả' : 'Tất cả trạng thái'}
                        </span>
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
                                setStatusFilter('Pending');
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                statusFilter === 'Pending'
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Chờ xử lý
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusFilter('Processing');
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                statusFilter === 'Processing'
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Đang xử lý
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusFilter('Paid');
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                statusFilter === 'Paid'
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Đã thanh toán
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusFilter('Overdue');
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                statusFilter === 'Overdue'
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              Quá hạn
                            </button>
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

        {/* Payments List */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách thanh toán</h2>
              <div className="flex items-center gap-4">
                {filteredPayments.length > 0 ? (
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
                      {startItem}-{Math.min(endIndex, filteredPayments.length)} trong số {filteredPayments.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 thanh toán</span>
                )}
              </div>
            </div>
          </div>

          {paginatedPayments.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 text-lg font-medium text-center">Không có thanh toán nào phù hợp</p>
              <p className="text-neutral-400 text-sm mt-1 text-center">Thử thay đổi bộ lọc hoặc chọn tháng khác</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Nhân sự</th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Dự án</th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thời gian</th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Số giờ</th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Giá trị</th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {paginatedPayments.map((payment, i) => (
                      <tr
                        key={payment.paymentId}
                        className="group cursor-pointer hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                      >
                        <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-primary-700 group-hover:text-primary-800 transition-colors">
                                {payment.talentName || '—'}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {payment.talentCode || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-neutral-900">
                          <div>
                            <div className="font-semibold text-secondary-700">{payment.projectName || '—'}</div>
                            <div className="text-sm text-neutral-500">{payment.periodDisplay || '—'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-neutral-700">
                          <div className="flex flex-col">
                            <span>Tháng {payment.periodMonth}/{payment.periodYear}</span>
                            {payment.paymentDate && (
                              <span className="text-xs text-neutral-400">
                                Thanh toán: {formatDate(payment.paymentDate)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium leading-5 ${
                            statusColors[payment.paymentStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[payment.paymentStatus as keyof typeof statusLabels] || payment.paymentStatus || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-neutral-900">
                          <div className="flex flex-col">
                            <span>{payment.reportedHours || 0}h thực tế</span>
                            <span className="text-xs text-neutral-500">{payment.standardHours || 0}h tiêu chuẩn</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-neutral-900">
                          <div className="flex flex-col">
                            <span className="font-semibold">{formatCurrency(payment.actualAmountVND, 'VND')}</span>
                            {payment.plannedAmountVND && (
                              <span className="text-xs text-neutral-500">
                                Dự kiến: {formatCurrency(payment.plannedAmountVND, 'VND')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => openPaymentModal(payment)}
                            className="flex items-center justify-center w-8 h-8 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {modalLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải chi tiết thanh toán...</p>
              </div>
            ) : selectedPayment ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Chi tiết thanh toán</h2>
                      <p className="text-gray-600">Thanh toán tháng {selectedPayment.periodMonth}/{selectedPayment.periodYear}</p>
                    </div>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID thanh toán</label>
                        <span className="text-gray-900 font-mono">{selectedPayment.paymentId}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhân sự</label>
                        <span className="text-gray-900">{selectedPayment.talentName || '—'}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân sự</label>
                        <span className="text-gray-900 font-mono">{selectedPayment.talentCode || '—'}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                        <span className="text-gray-900">{selectedPayment.projectName || '—'}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedPayment.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedPayment.paymentStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          selectedPayment.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                          selectedPayment.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusLabels[selectedPayment.paymentStatus as keyof typeof statusLabels] || selectedPayment.paymentStatus || '—'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hợp đồng</label>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedPayment.contractStatus === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          selectedPayment.contractStatus === 'Verified' ? 'bg-blue-100 text-blue-800' :
                          selectedPayment.contractStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                          selectedPayment.contractStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contractStatusLabels[selectedPayment.contractStatus as keyof typeof contractStatusLabels] || selectedPayment.contractStatus || '—'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thanh toán</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedPayment.paymentDate ? formatDate(selectedPayment.paymentDate) : 'Chưa thanh toán'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số giờ làm việc</label>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Thực tế:</span>
                            <span className="text-sm font-medium">{selectedPayment.reportedHours || 0}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tiêu chuẩn:</span>
                            <span className="text-sm font-medium">{selectedPayment.standardHours || 0}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">OT:</span>
                            <span className="text-sm font-medium">{selectedPayment.otHours || 0}h</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị thanh toán</label>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Dự kiến:</span>
                            <span className="text-sm font-medium">{formatCurrency(selectedPayment.plannedAmountVND, 'VND')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Thực tế:</span>
                            <span className="text-sm font-medium text-green-600">{formatCurrency(selectedPayment.actualAmountVND, 'VND')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tỷ giá:</span>
                            <span className="text-sm font-medium">{selectedPayment.exchangeRate || 1}x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment proofs */}
                  {selectedPayment.paymentProofs && selectedPayment.paymentProofs.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chứng từ thanh toán</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPayment.paymentProofs.map((proof) => (
                          <div key={proof.documentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{proof.documentType || 'Chứng từ'}</p>
                              <p className="text-xs text-gray-500">
                                Upload: {proof.uploadedAt ? formatDate(proof.uploadedAt) : '—'}
                              </p>
                            </div>
                            {proof.fileUrl && (
                              <a
                                href={proof.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-800"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedPayment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPayment.notes}</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
