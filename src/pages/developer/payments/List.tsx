import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, Building2, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, CreditCard, Eye } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { sidebarItems } from '../../../components/developer/SidebarItems';
import { partnerContractPaymentService, type PartnerContractPaymentModel } from '../../../services/PartnerContractPayment';
import { partnerService, type Partner } from '../../../services/Partner';
import { talentService, type Talent } from '../../../services/Talent';
import { projectPeriodService, type ProjectPeriodModel } from '../../../services/ProjectPeriod';
import { talentAssignmentService, type TalentAssignmentModel } from '../../../services/TalentAssignment';
import { useAuth } from '../../../contexts/AuthContext';
import { decodeJWT } from '../../../services/Auth';

export default function DeveloperPaymentsList() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<PartnerContractPaymentModel[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<PartnerContractPaymentModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPeriodId, setFilterPeriodId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [currentTalentId, setCurrentTalentId] = useState<number | null>(null);
    
    // Store related data for display
    const [partnersMap, setPartnersMap] = useState<Map<number, Partner>>(new Map());
    // Removed contractsMap - no longer using PartnerContract
    const [periodsMap, setPeriodsMap] = useState<Map<number, ProjectPeriodModel>>(new Map());
    const [assignmentsMap, setAssignmentsMap] = useState<Map<number, TalentAssignmentModel>>(new Map());
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const statsPageSize = 4;
    const [statsStartIndex, setStatsStartIndex] = useState(0);

    // Lấy talentId từ user hiện tại
    useEffect(() => {
        const fetchTalentId = async () => {
            if (!user) return;
            
            try {
                const token = localStorage.getItem('accessToken');
                let userId: string | null = null;
                
                if (token) {
                    const decoded = decodeJWT(token);
                    userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || user.id;
                } else {
                    userId = user.id;
                }
                
                if (!userId) return;
                
                const talents = await talentService.getAll({ excludeDeleted: true });
                const talent = Array.isArray(talents) 
                    ? talents.find((t: Talent) => t.userId === userId)
                    : null;
                
                if (talent) {
                    setCurrentTalentId(talent.id);
                } else {
                    setError('Không tìm thấy thông tin nhân sự của bạn. Vui lòng liên hệ TA.');
                }
            } catch (err: any) {
                console.error('❌ Lỗi tìm talent:', err);
                setError('Không thể tải thông tin nhân sự. Vui lòng thử lại sau.');
            }
        };
        
        fetchTalentId();
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentTalentId) return;
            
            try {
                setLoading(true);
                setError('');
                
                // Fetch payments, partners, periods, and assignments in parallel
                const [partnerPaymentsData, partnersData] = await Promise.all([
                    partnerContractPaymentService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
                    partnerService.getAll()
                ]);

                // Process partner payments (thanh toán từ DevPool cho talent)
                // Chỉ hiển thị các trạng thái: pending, processing, paid
                const allowedStatuses = ['pending', 'processing', 'paid'];
                const partnerPayments = Array.isArray(partnerPaymentsData) ? partnerPaymentsData : []
                    .filter((p: PartnerContractPaymentModel) => {
                        const normalizedStatus = (p.paymentStatus || '').toLowerCase();
                        return allowedStatuses.includes(normalizedStatus);
                    })
                    .sort((a: PartnerContractPaymentModel, b: PartnerContractPaymentModel) => {
                        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
                        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
                        return dateB - dateA; // Mới nhất trước
                    });

                // Get unique period IDs and assignment IDs
                const periodIds = [...new Set(partnerPayments.map((p: PartnerContractPaymentModel) => p.projectPeriodId))] as number[];
                const assignmentIds = [...new Set(partnerPayments.map((p: PartnerContractPaymentModel) => p.talentAssignmentId))] as number[];
                
                // Fetch all periods and assignments
                const [periodsData, assignmentsData] = await Promise.all([
                    Promise.all(periodIds.map((periodId) => projectPeriodService.getById(periodId).catch(() => null))),
                    Promise.all(assignmentIds.map((assignmentId) => talentAssignmentService.getById(assignmentId).catch(() => null)))
                ]);

                setPayments(partnerPayments);
                setFilteredPayments(partnerPayments);

                // Create maps for quick lookup
                const partnersMapData = new Map<number, Partner>();
                (Array.isArray(partnersData) ? partnersData : []).forEach((p: Partner) => {
                    partnersMapData.set(p.id, p);
                });
                setPartnersMap(partnersMapData);

                // Create periods map
                const periodsMapData = new Map<number, ProjectPeriodModel>();
                periodsData.forEach((period: ProjectPeriodModel | null) => {
                    if (period) {
                        periodsMapData.set(period.id, period);
                    }
                });
                setPeriodsMap(periodsMapData);

                // Create assignments map
                const assignmentsMapData = new Map<number, TalentAssignmentModel>();
                assignmentsData.forEach((assignment: TalentAssignmentModel | null) => {
                    if (assignment) {
                        assignmentsMapData.set(assignment.id, assignment);
                    }
                });
                setAssignmentsMap(assignmentsMapData);
            } catch (err: any) {
                console.error("❌ Lỗi tải danh sách thanh toán:", err);
                setError(err.message || "Không thể tải danh sách thanh toán");
            } finally {
                setLoading(false);
            }
        };

        if (currentTalentId) {
            fetchData();
        }
    }, [currentTalentId]);

    useEffect(() => {
        let filtered = [...payments];
        
        if (searchTerm) {
            filtered = filtered.filter(p => {
                const searchLower = searchTerm.toLowerCase();
                const assignment = assignmentsMap.get(p.talentAssignmentId);
                if (!assignment) return false;
                const partnerName = partnersMap.get(assignment.partnerId)?.companyName?.toLowerCase() || '';
                return partnerName.includes(searchLower);
            });
        }
        
        if (filterStatus) {
            filtered = filtered.filter(p => matchesStatus(p.paymentStatus, filterStatus));
        }
        
        if (filterPeriodId !== null) {
            filtered = filtered.filter(p => p.projectPeriodId === filterPeriodId);
        }
        
        setFilteredPayments(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterPeriodId, payments, partnersMap, assignmentsMap]);

    // Tính toán pagination
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
    const startItem = filteredPayments.length > 0 ? startIndex + 1 : 0;
    const endItem = Math.min(endIndex, filteredPayments.length);

    const normalizeStatus = (status?: string | null) => (status ?? '').toLowerCase();

    const getStatusColor = (status: string) => {
        const normalized = normalizeStatus(status);
        switch (normalized) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'pendingcalculation':
                return 'bg-yellow-100 text-yellow-800';
            case 'pendingapproval':
                return 'bg-blue-100 text-blue-800';
            case 'approved':
                return 'bg-purple-100 text-purple-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'invoiced':
                return 'bg-indigo-100 text-indigo-800';
            case 'overdue':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        const normalized = normalizeStatus(status);
        switch (normalized) {
            case 'paid':
                return 'Đã thanh toán';
            case 'pending':
                return 'Chờ xử lý';
            case 'processing':
                return 'Đang xử lý';
            case 'pendingcalculation':
                return 'Chờ tính toán';
            case 'pendingapproval':
                return 'Chờ duyệt';
            case 'approved':
                return 'Đã duyệt';
            case 'rejected':
                return 'Đã từ chối';
            case 'invoiced':
                return 'Đã xuất hóa đơn';
            case 'overdue':
                return 'Quá hạn';
            default:
                return status;
        }
    };

    const matchesStatus = (statusValue: string | null | undefined, target: string) => {
        const normalized = normalizeStatus(statusValue);
        return normalized === target.toLowerCase();
    };

    const countStatus = (...statuses: string[]) =>
        payments.filter(p => statuses.some(status => matchesStatus(p.paymentStatus, status))).length;

    const getCompanyName = (payment: PartnerContractPaymentModel) => {
        const assignment = assignmentsMap.get(payment.talentAssignmentId);
        return assignment ? partnersMap.get(assignment.partnerId)?.companyName || '—' : '—';
    };

    const formatPeriod = (payment: PartnerContractPaymentModel) => {
        const period = periodsMap.get(payment.projectPeriodId);
        if (!period) return '—';
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return `${monthNames[period.periodMonth - 1]}/${period.periodYear}`;
    };

    const getAmount = (payment: PartnerContractPaymentModel) => {
        return payment.actualAmountVND || payment.totalPaidAmount || 0;
    };

    const stats = useMemo(() => [
        {
            title: 'Tổng Thanh Toán',
            value: payments.length.toString(),
            color: 'blue',
            icon: <CreditCard className="w-6 h-6" />
        },
        {
            title: 'Đã Thanh Toán',
            value: countStatus('paid').toString(),
            color: 'green',
            icon: <CheckCircle className="w-6 h-6" />
        },
        {
            title: 'Chờ Xử Lý',
            value: countStatus('pending', 'processing').toString(),
            color: 'orange',
            icon: <Clock className="w-6 h-6" />
        },
        {
            title: 'Đang xử lý',
            value: countStatus('processing').toString(),
            color: 'purple',
            icon: <Clock className="w-6 h-6" />
        }
    ], [payments]);

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

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="Developer" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải danh sách thanh toán...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="Developer" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-red-500 text-lg font-medium mb-2">Lỗi tải dữ liệu</p>
                        <p className="text-gray-500">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar items={sidebarItems} title="Developer" />

            <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8 animate-slide-up">
                    <Breadcrumb
                        items={[
                            { label: "Thanh toán" }
                        ]}
                    />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Trạng Thái Thanh Toán</h1>
                            <p className="text-neutral-600 mt-1">Theo dõi các khoản thanh toán từ DevPool cho bạn</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats.length > 0 && (
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
                                                        : stat.color === 'green'
                                                            ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                                                            : stat.color === 'purple'
                                                                ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                                                                : stat.color === 'red'
                                                                    ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                                                                    : stat.color === 'gray'
                                                                        ? 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                                                                        : 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
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
                <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in relative z-30">
                    <div className="p-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo công ty đối tác..."
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Filter by Status */}
                                    <div className="relative">
                                        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="pending">Chờ xử lý</option>
                                            <option value="processing">Đang xử lý</option>
                                            <option value="paid">Đã thanh toán</option>
                                        </select>
                                    </div>
                                    
                                    {/* Filter by Period */}
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <select
                                            value={filterPeriodId || ''}
                                            onChange={(e) => setFilterPeriodId(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                                        >
                                            <option value="">Tất cả kỳ thanh toán</option>
                                            {Array.from(periodsMap.values())
                                                .sort((a, b) => {
                                                    if (a.periodYear !== b.periodYear) {
                                                        return b.periodYear - a.periodYear;
                                                    }
                                                    return b.periodMonth - a.periodMonth;
                                                })
                                                .map((period) => {
                                                    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                                                                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                                                    return (
                                                        <option key={period.id} value={period.id}>
                                                            {monthNames[period.periodMonth - 1]}/{period.periodYear}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                    
                                    {/* Reset Button */}
                                    <button
                                        onClick={() => {
                                            setFilterStatus('');
                                            setFilterPeriodId(null);
                                            setSearchTerm('');
                                        }}
                                        className="group flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 transform self-end"
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
                                            {startItem}-{endItem} trong số {filteredPayments.length}
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
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Kỳ thanh toán</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Công ty đối tác</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Giờ làm</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tổng tiền</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ngày thanh toán</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                                    <CreditCard className="w-8 h-8 text-neutral-400" />
                                                </div>
                                                <p className="text-neutral-500 text-lg font-medium">Không có thanh toán nào phù hợp</p>
                                                <p className="text-neutral-400 text-sm mt-1">
                                                    {searchTerm || filterStatus
                                                        ? 'Thử thay đổi bộ lọc để tìm kiếm'
                                                        : 'Bạn chưa có thanh toán nào từ DevPool'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPayments.map((payment, i) => (
                                        <tr
                                            key={payment.id}
                                            className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                                        >
                                            <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">
                                                        {formatPeriod(payment)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm font-medium text-neutral-700">
                                                        {getCompanyName(payment)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <span className="text-sm text-neutral-700">
                                                    {payment.reportedHours || 0}h
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN').format(getAmount(payment))} VNĐ
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">
                                                        {payment.paymentDate
                                                            ? new Date(payment.paymentDate).toLocaleDateString('vi-VN')
                                                            : '—'
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.paymentStatus)}`}>
                                                    {getStatusText(payment.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/developer/payments/${payment.id}`}
                                                        className="group inline-flex items-center gap-1 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                                                    >
                                                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="text-sm font-medium">Xem</span>
                                                    </Link>
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

