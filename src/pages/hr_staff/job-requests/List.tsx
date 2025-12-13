import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    Users,
    Briefcase,
    Building2,
    Target,
    Eye,
    ChevronLeft,
    ChevronRight,
    XCircle,
    Layers,
    ClipboardList
} from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { projectService, type Project } from "../../../services/Project";
import { jobRoleLevelService, type JobRoleLevel } from "../../../services/JobRoleLevel";
import { jobSkillService, type JobSkill } from "../../../services/JobSkill";
import { skillService, type Skill } from "../../../services/Skill";
import { talentApplicationService, type TalentApplication } from "../../../services/TalentApplication";

interface HRJobRequest {
    id: number;
    code: string;
    title: string;
    companyName: string;
    projectName: string;
    positionName: string;
    quantity: number;
    workingMode: string;
    status: string;
    skills: string[];
    applicationCount: number; // Số lượng hồ sơ ứng tuyển
}

const workingModeLabels: Record<number, string> = {
    0: "Không xác định",
    1: "Tại văn phòng",
    2: "Từ xa",
    4: "Kết hợp",
    8: "Linh hoạt"
};

const statusLabels: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Closed",
    3: "Rejected"
};

const statusLabelDisplay: Record<string, string> = {
    Pending: "Chờ duyệt",
    Approved: "Đã duyệt",
    Closed: "Đã đóng",
    Rejected: "Từ chối"
};

export default function HRJobRequestList() {
    const [requests, setRequests] = useState<HRJobRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<HRJobRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔍 Search + Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterCompany, setFilterCompany] = useState("");
    const [filterProject, setFilterProject] = useState("");
    const [filterPosition, setFilterPosition] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const statsPageSize = 4;
    const [statsStartIndex, setStatsStartIndex] = useState(0);

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

    // Stats data
const stats = [
        {
            title: 'Tổng Yêu Cầu',
            value: requests.length.toString(),
            color: 'blue',
            icon: <Briefcase className="w-6 h-6" />
        },
        {
            title: 'Chưa Duyệt',
            value: requests.filter(r => r.status === 'Pending').length.toString(),
            color: 'orange',
            icon: <Target className="w-6 h-6" />
        },
        {
            title: 'Đã Duyệt',
            value: requests.filter(r => r.status === 'Approved').length.toString(),
            color: 'purple',
            icon: <Users className="w-6 h-6" />
        },
        {
            title: 'Đã từ chối',
            value: requests.filter(r => r.status === 'Rejected').length.toString(),
            color: 'red',
            icon: <XCircle className="w-6 h-6" />
        },
        {
            title: 'Đã đóng',
            value: requests.filter(r => r.status === 'Closed').length.toString(),
            color: 'gray',
            icon: <Briefcase className="w-6 h-6" />
        }
    ];

    useEffect(() => {
        const maxIndex = Math.max(0, stats.length - statsPageSize);
        setStatsStartIndex((prev) => Math.min(prev, maxIndex));
    }, [stats.length, statsPageSize]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [jobReqs, companies, projects, positions, jobSkills, skills, applications] =
                    await Promise.all([
                        jobRequestService.getAll(),
                        clientCompanyService.getAll(),
                        projectService.getAll(),
                        jobRoleLevelService.getAll(),
                        jobSkillService.getAll(),
                        skillService.getAll(),
                        talentApplicationService.getAll({ excludeDeleted: true }),
                    ]);

                // Ensure all data are arrays
                const jobReqsArray = ensureArray<JobRequest>(jobReqs);
                const companiesArray = ensureArray<ClientCompany>(companies);
                const projectsArray = ensureArray<Project>(projects);
                const positionsArray = ensureArray<JobRoleLevel>(positions);
                const jobSkillsArray = ensureArray<JobSkill>(jobSkills);
                const skillsArray = ensureArray<Skill>(skills);
                const applicationsArray = ensureArray<TalentApplication>(applications);

                // Lấy tất cả yêu cầu
                const filteredReqs = [...jobReqsArray].sort((a, b) => {
                    const metaA = a as { createdAt?: string };
                    const metaB = b as { createdAt?: string };
                    const timeA = metaA.createdAt ? new Date(metaA.createdAt).getTime() : 0;
                    const timeB = metaB.createdAt ? new Date(metaB.createdAt).getTime() : 0;

                    if (timeA !== timeB) {
                        return timeB - timeA;
                    }

                    return b.id - a.id;
                });

                const projectDict: Record<number, Project> = {};
                projectsArray.forEach((p) => (projectDict[p.id] = p));

                const companyDict: Record<number, ClientCompany> = {};
                companiesArray.forEach((c) => (companyDict[c.id] = c));

                const positionDict: Record<number, JobRoleLevel> = {};
                positionsArray.forEach((p) => (positionDict[p.id] = p));

                const skillDict: Record<number, string> = {};
                skillsArray.forEach((s) => (skillDict[s.id] = s.name));

                const groupedJobSkills: Record<number, string[]> = {};
                jobSkillsArray.forEach((js) => {
                    if (!groupedJobSkills[js.jobRequestId])
                        groupedJobSkills[js.jobRequestId] = [];
                    groupedJobSkills[js.jobRequestId].push(skillDict[js.skillsId] || "—");
                });

                // Đếm số lượng hồ sơ ứng tuyển cho mỗi job request
                const applicationCountMap: Record<number, number> = {};
                applicationsArray.forEach((app: TalentApplication) => {
                    if (!applicationCountMap[app.jobRequestId]) {
                        applicationCountMap[app.jobRequestId] = 0;
                    }
                    applicationCountMap[app.jobRequestId]++;
                });

                const mapped: HRJobRequest[] = filteredReqs.map((r) => {
                    const project = projectDict[r.projectId];
                    const company = project ? companyDict[project.clientCompanyId] : undefined;
                    const position = positionDict[r.jobRoleLevelId];
                    return {
                        id: r.id,
                        code: r.code,
                        title: r.title,
                        companyName: company?.name ?? "—",
                        projectName: project?.name ?? "—",
                        positionName: position?.name ?? "—",
                        quantity: r.quantity,
                        workingMode: workingModeLabels[r.workingMode] ?? "—",
                        status: statusLabels[r.status] ?? "—",
                        skills: groupedJobSkills[r.id] ?? [],
                        applicationCount: applicationCountMap[r.id] || 0,
                    };
                });

                setRequests(mapped);
                setFilteredRequests(mapped);
            } catch (err) {
                console.error("❌ Lỗi tải danh sách yêu cầu TA:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 🧮 Lọc dữ liệu theo điều kiện
    useEffect(() => {
        let filtered = [...requests];

        if (searchTerm) {
            filtered = filtered.filter(
                (r) =>
                    r.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterCompany)
            filtered = filtered.filter((r) =>
                r.companyName.toLowerCase().includes(filterCompany.toLowerCase())
            );
        if (filterProject)
            filtered = filtered.filter((r) =>
                r.projectName.toLowerCase().includes(filterProject.toLowerCase())
            );
        if (filterPosition)
            filtered = filtered.filter((r) =>
                r.positionName.toLowerCase().includes(filterPosition.toLowerCase())
            );
        if (filterStatus)
            filtered = filtered.filter((r) => r.status === filterStatus);

        setFilteredRequests(filtered);
        setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
    }, [searchTerm, filterCompany, filterProject, filterPosition, filterStatus, requests]);

    // Tính toán pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    const startItem = filteredRequests.length > 0 ? startIndex + 1 : 0;
    const endItem = Math.min(endIndex, filteredRequests.length);

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
    const canGoNext = canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

    const handleResetFilters = () => {
        setSearchTerm("");
        setFilterCompany("");
        setFilterProject("");
        setFilterPosition("");
        setFilterStatus("");
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
                    <Breadcrumb
                        items={[
                            { label: "Yêu cầu tuyển dụng" }
                        ]}
                    />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu tuyển dụng</h1>
                            <p className="text-neutral-600 mt-1">Xem và duyệt yêu cầu tuyển dụng từ Sales</p>
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
                                                    : stat.color === 'green'
                                                    ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                                                    : stat.color === 'purple'
                                                    ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                                                    : stat.color === 'red'
                                                    ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
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
                                        disabled={!canGoPrev}
                                        className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                                            canGoPrev
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
                                        disabled={!canGoNext}
                                        className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                                            canGoNext
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
                                        disabled={!canGoPrev}
                                        className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                                            canGoPrev
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
                                        disabled={!canGoNext}
                                        className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                                            canGoNext
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
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
                    <div className="p-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tiêu đề..."
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Công ty khách hàng"
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                                            value={filterCompany}
                                            onChange={(e) => setFilterCompany(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Dự án"
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                                            value={filterProject}
                                            onChange={(e) => setFilterProject(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Vị trí"
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                                            value={filterPosition}
                                            onChange={(e) => setFilterPosition(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="Pending">⏳ Chờ duyệt</option>
                                        <option value="Approved">✅ Đã duyệt</option>
                                        <option value="Closed">🔒 Đã đóng</option>
                                        <option value="Rejected">❌ Từ chối</option>
                                    </select>
                                    <button
                                        onClick={handleResetFilters}
                                        className="group flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 transform"
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
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu tuyển dụng</h2>
                            <div className="flex items-center gap-4">
                                {filteredRequests.length > 0 ? (
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
                                            {startItem}-{endItem} trong số {filteredRequests.length}
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
                                    <span className="text-sm text-neutral-600">Tổng: 0 yêu cầu</span>
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
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tiêu đề</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Công ty</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Dự án</th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Vị trí</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Hồ sơ</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                                    <Briefcase className="w-8 h-8 text-neutral-400" />
                                                </div>
                                                <p className="text-neutral-500 text-lg font-medium">Không có yêu cầu nào phù hợp</p>
                                                <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo yêu cầu mới</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRequests.map((req, i) => (
                                        <tr
                                            key={req.id}
                                            className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                                        >
                                            <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-medium text-neutral-600">
                                                    {req.code || "—"}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                                                    {req.title || "(Chưa có tiêu đề)"}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">{req.companyName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">{req.projectName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-700">{req.positionName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <Link
                                                    to={`/ta/applications?jobRequestId=${req.id}`}
                                                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 transform ${req.applicationCount > 0
                                                            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                                            : 'bg-neutral-100 text-neutral-500'
                                                        }`}
                                                >
                                                    <ClipboardList className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                    <span>{req.applicationCount}</span>
                                                </Link>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'Pending' ? 'bg-warning-100 text-warning-700' :
                                                        req.status === 'Approved' ? 'bg-secondary-100 text-secondary-700' :
                                                            req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                req.status === 'Closed' ? 'bg-neutral-100 text-neutral-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {statusLabelDisplay[req.status] ?? req.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/ta/job-requests/${req.id}`}
                                                        className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
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
