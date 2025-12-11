import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Calendar, Building2, CheckCircle, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { sidebarItems } from '../../../components/sidebar/developer';
import { partnerContractPaymentService, type PartnerContractPaymentModel } from '../../../services/PartnerContractPayment';
import { partnerService, type Partner } from '../../../services/Partner';
import { talentService, type Talent } from '../../../services/Talent';
import { talentAssignmentService } from '../../../services/TalentAssignment';
import { useAuth } from '../../../context/AuthContext';
import { decodeJWT } from '../../../services/Auth';

type ContractUnion = PartnerContractPaymentModel & { 
    type: 'partner';
    status?: string;
    startDate?: string;
    endDate?: string | null;
};

export default function DeveloperContractsList() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<ContractUnion[]>([]);
    const [filteredContracts, setFilteredContracts] = useState<ContractUnion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [error, setError] = useState('');
    const [currentTalentId, setCurrentTalentId] = useState<number | null>(null);
    
    // Store related data for display
    const [partnersMap, setPartnersMap] = useState<Map<number, Partner>>(new Map());
    
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
                // Lấy userId từ token hoặc user object
                const token = localStorage.getItem('accessToken');
                let userId: string | null = null;
                
                if (token) {
                    const decoded = decodeJWT(token);
                    userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || user.id;
                } else {
                    userId = user.id;
                }
                
                if (!userId) return;
                
                // Tìm talent bằng userId
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
                
                // Fetch contracts and partners in parallel
                // Chỉ lấy hợp đồng ở trạng thái Approved (hoặc Active nếu Approved được map thành Active)
                const [partnerContractsData, partnersData] = await Promise.all([
                    partnerContractPaymentService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
                    partnerService.getAll()
                ]);
                
                // Filter chỉ lấy hợp đồng Approved hoặc Active
                const approvedContracts = (Array.isArray(partnerContractsData) ? partnerContractsData : []).filter((c: PartnerContractPaymentModel) => {
                    const status = (c.contractStatus || '').toLowerCase();
                    return status === 'approved' || status === 'active';
                });

                // Map PartnerContractPayment sang format hiển thị
                const partnerContracts: ContractUnion[] = approvedContracts.map((c: PartnerContractPaymentModel) => ({
                    ...c,
                    type: 'partner' as const,
                    status: c.contractStatus || 'approved', // Map contractStatus sang status
                    // Sử dụng createdAt làm startDate tạm thời, hoặc có thể lấy từ projectPeriod
                    startDate: c.createdAt || new Date().toISOString(),
                    endDate: null,
                    // Thêm partnerId tạm thời, sẽ cần fetch từ talentAssignment
                    partnerId: 0, // Sẽ được cập nhật sau
                } as ContractUnion));
                
                // Fetch talentAssignments để lấy partnerId cho partner contracts
                try {
                    const assignmentPromises = partnerContracts.map(async (contract) => {
                        try {
                            const assignment = await talentAssignmentService.getById(contract.talentAssignmentId);
                            return { contractId: contract.id, partnerId: assignment.partnerId };
                        } catch {
                            return { contractId: contract.id, partnerId: null };
                        }
                    });
                    const assignmentResults = await Promise.all(assignmentPromises);
                    
                    // Cập nhật partnerId cho các contracts
                    assignmentResults.forEach((result) => {
                        if (result) {
                            const contract = partnerContracts.find(c => c.id === result.contractId);
                            if (contract) {
                                (contract as any).partnerId = result.partnerId || 0;
                            }
                        }
                    });
                } catch (err) {
                    console.error("⚠️ Không thể tải thông tin talent assignment:", err);
                }

                const allContracts = partnerContracts.sort((a, b) => {
                    const dateA = new Date(a.startDate || a.createdAt || new Date().toISOString()).getTime();
                    const dateB = new Date(b.startDate || b.createdAt || new Date().toISOString()).getTime();
                    return dateB - dateA; // Mới nhất trước
                });

                setContracts(allContracts);
                setFilteredContracts(allContracts);

                // Create maps for quick lookup
                const partnersMapData = new Map<number, Partner>();
                (Array.isArray(partnersData) ? partnersData : []).forEach((p: Partner) => {
                    partnersMapData.set(p.id, p);
                });
                setPartnersMap(partnersMapData);
            } catch (err: any) {
                console.error("❌ Lỗi tải danh sách hợp đồng:", err);
                setError(err.message || "Không thể tải danh sách hợp đồng");
            } finally {
                setLoading(false);
            }
        };

        if (currentTalentId) {
            fetchData();
        }
    }, [currentTalentId]);

    useEffect(() => {
        let filtered = [...contracts];
        
        // Tất cả contracts đã được filter chỉ lấy Approved/Active ở fetchData, nên không cần filter thêm theo status
        
        if (searchTerm) {
            filtered = filtered.filter(c => {
                const contractNumber = c.contractNumber?.toLowerCase() || '';
                const searchLower = searchTerm.toLowerCase();
                const partnerId = (c as any).partnerId || 0;
                const partnerName = partnersMap.get(partnerId)?.companyName?.toLowerCase() || '';
                return contractNumber.includes(searchLower) || partnerName.includes(searchLower);
            });
        }
        
        setFilteredContracts(filtered);
        setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
    }, [searchTerm, contracts, partnersMap]);

    // Tính toán pagination
    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedContracts = filteredContracts.slice(startIndex, endIndex);
    const startItem = filteredContracts.length > 0 ? startIndex + 1 : 0;
    const endItem = Math.min(endIndex, filteredContracts.length);

    const normalizeStatus = (status?: string | null) => (status ?? '').toLowerCase();

    const getStatusColor = (status: string) => {
        const normalized = normalizeStatus(status);
        switch (normalized) {
            case 'active':
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';        
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'expired':
                return 'bg-blue-100 text-blue-800';
            case 'terminated':
                return 'bg-red-100 text-red-800';
            case 'rejected':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        const normalized = normalizeStatus(status);
        switch (normalized) {
            case 'active':
            case 'approved':
                return 'Đã duyệt';
            case 'pending':
                return 'Chờ duyệt';
            case 'draft':
                return 'Bản nháp';
            case 'expired':
                return 'Đã hết hạn';
            case 'terminated':
                return 'Đã chấm dứt';
            case 'rejected':
                return 'Đã từ chối';
            default:
                return status;
        }
    };

    const matchesStatus = (statusValue: string | null | undefined, target: string) => {
        const normalized = normalizeStatus(statusValue);
        if (target === 'expired') {
            return normalized === 'expired';
        }
        if (target === 'terminated') {
            return normalized === 'terminated';
        }
        if (target === 'rejected') {
            return normalized === 'rejected';
        }
        return normalized === target;
    };

    const countStatus = (...statuses: string[]) =>
        contracts.filter(c => statuses.some(status => matchesStatus(c.status, status))).length;

    const getCompanyName = (contract: ContractUnion) => {
        const partnerId = (contract as any).partnerId || 0;
        return partnersMap.get(partnerId)?.companyName || '—';
    };

    const stats = useMemo(() => [
        {
            title: 'Tổng Hợp Đồng',
            value: contracts.length.toString(),
            color: 'blue',
            icon: <FileText className="w-6 h-6" />
        },
        {
            title: 'Đang Hiệu Lực',
            value: countStatus('active').toString(),
            color: 'green',
            icon: <CheckCircle className="w-6 h-6" />
        },
        {
            title: 'Chờ Duyệt',
            value: countStatus('pending').toString(),
            color: 'orange',
            icon: <Clock className="w-6 h-6" />
        },
        {
            title: 'Bản nháp',
            value: countStatus('draft').toString(),
            color: 'gray',
            icon: <FileText className="w-6 h-6" />
        },
        {
            title: 'Đã hết hạn',
            value: countStatus('expired').toString(),
            color: 'blue',
            icon: <CheckCircle className="w-6 h-6" />
        },
        {
            title: 'Đã chấm dứt',
            value: countStatus('terminated').toString(),
            color: 'red',
            icon: <AlertCircle className="w-6 h-6" />
        }
    ], [contracts]);

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
                        <p className="text-gray-500">Đang tải danh sách hợp đồng...</p>
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
                            { label: "Hợp đồng" }
                        ]}
                    />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hợp Đồng Của Tôi</h1>
                            <p className="text-neutral-600 mt-1">Danh sách tất cả hợp đồng của bạn</p>
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
                                    placeholder="Tìm kiếm theo mã hợp đồng, đối tác..."
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
                                    {/* Reset Button */}
                                    <button
                                        onClick={() => {
                                            setFilterStatus('');
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
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách hợp đồng</h2>
                            <div className="flex items-center gap-4">
                                {filteredContracts.length > 0 ? (
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
                                            {startItem}-{endItem} trong số {filteredContracts.length}
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
                                    <span className="text-sm text-neutral-600">Tổng: 0 hợp đồng</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã hợp đồng</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Đối tác</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thời hạn</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredContracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="w-8 h-8 text-neutral-400" />
                                                </div>
                                                <p className="text-neutral-500 text-lg font-medium">Không có hợp đồng nào phù hợp</p>
                                                <p className="text-neutral-400 text-sm mt-1">
                                                    {searchTerm || filterStatus
                                                        ? 'Thử thay đổi bộ lọc để tìm kiếm'
                                                        : 'Bạn chưa có hợp đồng nào'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedContracts.map((contract, i) => (
                                        <tr
                                            key={`${contract.type}-${contract.id}`}
                                            className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                                        >
                                            <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                                                    {contract.contractNumber}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm font-medium text-neutral-700">
                                                        {getCompanyName(contract)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">
                                                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '—'} {contract.endDate ? `- ${new Date(contract.endDate).toLocaleDateString('vi-VN')}` : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status || '')}`}>
                                                    {getStatusText(contract.status || '')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/developer/contracts/${contract.id}`}
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

