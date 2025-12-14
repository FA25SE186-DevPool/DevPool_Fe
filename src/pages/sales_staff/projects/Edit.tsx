import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { projectService, type Project, type ProjectPayload, type ProjectStatusUpdateModel } from "../../../services/Project";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { marketService, type Market } from "../../../services/Market";
import { industryService, type Industry } from "../../../services/Industry";
import { projectPeriodService } from "../../../services/ProjectPeriod";
import { clientContractPaymentService } from "../../../services/ClientContractPayment";
import { partnerContractPaymentService } from "../../../services/PartnerContractPayment";
import {
  Briefcase,
  Save,
  FileText,
  CalendarDays,
  Building2,
  Globe2,
  Factory,
  CheckCircle,
  AlertCircle,
  X,
  Search
} from "lucide-react";

export default function ProjectEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [company, setCompany] = useState<ClientCompany | null>(null);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [industrySearch, setIndustrySearch] = useState("");
    const [marketSearch, setMarketSearch] = useState("");
    const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<
        Partial<Omit<ProjectPayload, "industryIds">> & { industryIds: number[] }
    >({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "",
        clientCompanyId: undefined,
        marketId: undefined,
        industryIds: [],
    });
    const [originalStatus, setOriginalStatus] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;

                // Lấy dự án
                const proj = await projectService.getById(Number(id));
                setProject(proj);
                
                // Lấy công ty
                const comp = await clientCompanyService.getById(proj.clientCompanyId);
                setCompany(comp);

                // Lấy danh sách Market và Industry
                const [mkList, indList] = await Promise.all([
                    marketService.getAll({ excludeDeleted: true }),
                    industryService.getAll({ excludeDeleted: true }),
                ]);
                setMarkets(ensureArray<Market>(mkList));
                setIndustries(ensureArray<Industry>(indList));

                // Gán giá trị mặc định cho form
                setFormData({
                    name: proj.name,
                    description: proj.description ?? "",
                    startDate: formatDate(proj.startDate),
                    endDate: formatDate(proj.endDate),
                    status: proj.status,
                    clientCompanyId: proj.clientCompanyId,
                    marketId: proj.marketId,
                    industryIds: proj.industryIds ?? [],
                });
                setOriginalStatus(proj.status);
            } catch (err) {
                console.error("❌ Lỗi tải dữ liệu dự án:", err);
                alert("Không thể tải dữ liệu dự án!");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (name === "industryIds") return;
        
        // Nếu xóa EndDate, set về empty string
        if (name === "endDate" && value === "") {
            setFormData(prev => ({ ...prev, [name]: "" }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear errors khi user thay đổi
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleIndustryChange = (id: number, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            industryIds: checked
                ? [...prev.industryIds, id]
                : prev.industryIds.filter(selectedId => selectedId !== id),
        }));
    };

    const filteredIndustries = industries.filter(industry =>
        industry.name.toLowerCase().includes(industrySearch.toLowerCase())
    );

    const filteredMarkets = markets.filter(m =>
        !marketSearch || m.name.toLowerCase().includes(marketSearch.toLowerCase())
    );

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSaving(true);
        setError("");
        setSuccess(false);
        setFieldErrors({});

        // Nếu status là Ongoing, chỉ validate EndDate và Status
        if (originalStatus === "Ongoing") {
            // Validation: Status (bắt buộc)
            if (!formData.status) {
                setError("⚠️ Vui lòng chọn trạng thái dự án!");
                setSaving(false);
                return;
            }

            // Validation: EndDate - phải sau StartDate (nếu có)
            if (formData.endDate && formData.startDate) {
                const startDate = new Date(formData.startDate);
                const endDate = new Date(formData.endDate);
                if (endDate < startDate) {
                    setFieldErrors({ endDate: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!" });
                    setError("⚠️ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
                    setSaving(false);
                    return;
                }
            }
        } else {
            // Validation đầy đủ cho các trạng thái khác
            // Validation: Tên dự án
            if (!formData.name?.trim()) {
                setFieldErrors({ name: "Tên dự án không được để trống!" });
                setError("⚠️ Tên dự án không được để trống!");
                setSaving(false);
                return;
            }

            // Validation: StartDate - không cho ngày tương lai quá vô lý (> 5 năm)
            if (formData.startDate) {
                const startDate = new Date(formData.startDate);
                const today = new Date();
                const fiveYearsLater = new Date(today);
                fiveYearsLater.setFullYear(today.getFullYear() + 5);
                
                if (startDate > fiveYearsLater) {
                    setFieldErrors({ startDate: "Ngày bắt đầu không được quá 5 năm trong tương lai!" });
                    setError("⚠️ Ngày bắt đầu không được quá 5 năm trong tương lai!");
                    setSaving(false);
                    return;
                }
            }

            // Validation: EndDate - phải sau StartDate (nếu có)
            if (formData.endDate && formData.startDate) {
                const startDate = new Date(formData.startDate);
                const endDate = new Date(formData.endDate);
                if (endDate < startDate) {
                    setFieldErrors({ endDate: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!" });
                    setError("⚠️ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
                    setSaving(false);
                    return;
                }
            }

            if (!formData.status) {
                setError("⚠️ Vui lòng chọn trạng thái dự án!");
                setSaving(false);
                return;
            }
            if (!formData.marketId) {
                setError("⚠️ Vui lòng chọn thị trường!");
                setSaving(false);
                return;
            }
            if (!formData.industryIds || formData.industryIds.length === 0) {
                setError("⚠️ Vui lòng chọn ít nhất một lĩnh vực!");
                setSaving(false);
                return;
            }
        }

        // Kiểm tra chuyển status: Completed → status khác (disable)
        if (originalStatus === "Completed" && formData.status !== "Completed") {
            setError("⚠️ Không thể thay đổi trạng thái từ 'Đã hoàn thành' sang trạng thái khác!");
            setSaving(false);
            return;
        }

        // Kiểm tra chuyển status: Planned → chỉ cho phép chuyển sang Ongoing
        if (originalStatus === "Planned" && formData.status !== "Planned" && formData.status !== "Ongoing") {
            setError("⚠️ Từ trạng thái 'Planned' chỉ có thể chuyển sang 'Ongoing'!");
            setSaving(false);
            return;
        }

        // Kiểm tra chuyển status: Ongoing → chỉ cho phép chuyển sang Completed, OnHold
        if (originalStatus === "Ongoing" && formData.status !== "Ongoing" && 
            formData.status !== "Completed" && formData.status !== "OnHold") {
            setError("⚠️ Từ trạng thái 'Ongoing' chỉ có thể chuyển sang 'Completed' hoặc 'OnHold'!");
            setSaving(false);
            return;
        }

        // Kiểm tra chuyển status: Ongoing → Completed (check active contracts)
        if (originalStatus === "Ongoing" && formData.status === "Completed") {
            try {
                // Lấy tất cả ProjectPeriod của project
                const periods = await projectPeriodService.getAll({ 
                    projectId: Number(id), 
                    excludeDeleted: true 
                });
                const periodIds = Array.isArray(periods) 
                    ? periods.map((p: any) => p.id)
                    : [];
                
                if (periodIds.length > 0) {
                    // Lấy tất cả ClientContractPayment và PartnerContractPayment của các period
                    const allClientPayments: any[] = [];
                    const allPartnerPayments: any[] = [];
                    
                    for (const periodId of periodIds) {
                        const [clientPayments, partnerPayments] = await Promise.all([
                            clientContractPaymentService.getAll({ 
                                projectPeriodId: periodId, 
                                excludeDeleted: true 
                            }),
                            partnerContractPaymentService.getAll({ 
                                projectPeriodId: periodId, 
                                excludeDeleted: true 
                            })
                        ]);
                        
                        const clientArray = Array.isArray(clientPayments) ? clientPayments : ((clientPayments as any)?.items || []);
                        const partnerArray = Array.isArray(partnerPayments) ? partnerPayments : ((partnerPayments as any)?.items || []);
                        
                        allClientPayments.push(...clientArray);
                        allPartnerPayments.push(...partnerArray);
                    }
                    
                    // Filter active contracts
                    const activeContracts = [
                        ...allClientPayments.filter((c: any) => 
                            c.contractStatus === "Active" || c.contractStatus === "Ongoing"
                        ),
                        ...allPartnerPayments.filter((c: any) => 
                            c.contractStatus === "Active" || c.contractStatus === "Ongoing"
                        )
                    ];
                    
                    if (activeContracts.length > 0) {
                        const confirmed = window.confirm(
                            `Dự án còn ${activeContracts.length} hợp đồng chưa kết thúc. Bạn có chắc chắn đóng dự án?`
                        );
                        if (!confirmed) {
                            setSaving(false);
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("❌ Lỗi kiểm tra hợp đồng:", err);
                // Vẫn cho phép tiếp tục nếu không check được
            }
        }

        // Kiểm tra chuyển status: Ongoing → OnHold (cảnh báo nhẹ)
        if (originalStatus === "Ongoing" && formData.status === "OnHold") {
            const confirmed = window.confirm(
                "Dự án tạm dừng – không thể tạo Job Request mới. Bạn có chắc chắn muốn tạm dừng dự án?"
            );
            if (!confirmed) {
                setSaving(false);
                return;
            }
        }

        // Xác nhận trước khi lưu
        const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
        if (!confirmed) {
            setSaving(false);
            return;
        }

        const toUTCDateString = (dateStr?: string | null) => {
            if (!dateStr) return null;
            // Parse date string (YYYY-MM-DD) và tạo UTC date để tránh timezone offset
            const [year, month, day] = dateStr.split('-').map(Number);
            const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            return d.toISOString();
        };

        // Kiểm tra xem có chỉ thay đổi status không
        const onlyStatusChanged = project && 
            formData.status !== originalStatus &&
            formData.name === project.name &&
            formData.description === (project.description ?? "") &&
            formData.startDate === formatDate(project.startDate) &&
            formData.endDate === formatDate(project.endDate) &&
            formData.clientCompanyId === project.clientCompanyId &&
            formData.marketId === project.marketId &&
            JSON.stringify(formData.industryIds.sort()) === JSON.stringify((project.industryIds ?? []).sort());

        try {
            if (onlyStatusChanged && formData.status) {
                // Chỉ thay đổi status - dùng API change-status
                const statusPayload: ProjectStatusUpdateModel = {
                    newStatus: formData.status,
                    notes: null
                };
                
                const result = await projectService.updateStatus(Number(id), statusPayload);
                
                // Kiểm tra kết quả
                if (!result.isSuccess && !result.success) {
                    throw new Error(result.message || "Không thể thay đổi trạng thái dự án");
                }
            } else {
                // Cập nhật toàn bộ - dùng API update
                const payload: ProjectPayload = {
                    name: formData.name ?? "",
                    description: formData.description ?? "",
                    startDate: toUTCDateString(formData.startDate) ?? "",
                    endDate: toUTCDateString(formData.endDate),
                    status: formData.status,
                    clientCompanyId: formData.clientCompanyId!,
                    marketId: Number(formData.marketId),
                    industryIds: formData.industryIds.map(id => Number(id)),
                };

                await projectService.update(Number(id), payload);
            }
            
            setSuccess(true);
            setTimeout(() => navigate(`/sales/projects/${id}`), 1500);
        } catch (err: any) {
            console.error("❌ Lỗi cập nhật dự án:", err);
            setError(err.message || "Không thể cập nhật dự án. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const isReadOnly = originalStatus !== "Planned";
    const isStatusDisabled = originalStatus === "Completed";
    const canEditEndDate = originalStatus === "Planned" || originalStatus === "Ongoing";
    const canEditStatus = originalStatus === "Planned" || originalStatus === "Ongoing";

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="Sales Staff" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="Sales Staff" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-red-500 text-lg font-medium">Không tìm thấy dự án</p>
                        <Link 
                            to="/sales/projects"
                            className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
                        >
                            Quay lại danh sách
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar items={sidebarItems} title="Sales Staff" />

            <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8 animate-slide-up">
                    <Breadcrumb
                        items={[
                            { label: "Dự án", to: "/sales/projects" },
                            { label: project ? project.name : "Chi tiết", to: `/sales/projects/${id}` },
                            { label: "Chỉnh sửa" }
                        ]}
                    />

                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa dự án</h1>
                            <p className="text-neutral-600 mb-4">
                                Cập nhật thông tin dự án khách hàng
                            </p>
                            
                            {/* Status Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-50 border border-warning-200">
                                <Briefcase className="w-4 h-4 text-warning-600" />
                                <span className="text-sm font-medium text-warning-800">
                                    Chỉnh sửa: {project.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
                        <div className="p-6 border-b border-neutral-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Thông tin dự án</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Tên dự án */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Tên dự án <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={isReadOnly}
                                    className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 ${
                                        isReadOnly ? "bg-neutral-50 cursor-not-allowed" : "bg-white"
                                    }`}
                                    placeholder="Nhập tên dự án"
                                />
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    disabled={isReadOnly}
                                    rows={4}
                                    className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 resize-none ${
                                        isReadOnly ? "bg-neutral-50 cursor-not-allowed" : "bg-white"
                                    }`}
                                    placeholder="Nhập mô tả dự án..."
                                />
                            </div>

                            {/* Ngày bắt đầu & kết thúc */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        max={formData.endDate || undefined}
                                        disabled={isReadOnly}
                                        className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 ${
                                            fieldErrors.startDate
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-neutral-200 focus:border-primary-500"
                                        } ${
                                            isReadOnly ? "bg-neutral-50 cursor-not-allowed" : "bg-white"
                                        }`}
                                    />
                                    {fieldErrors.startDate && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {fieldErrors.startDate}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        Ngày kết thúc
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate ?? ""}
                                            onChange={handleChange}
                                            min={formData.startDate || undefined}
                                            disabled={!canEditEndDate}
                                            className={`w-full border rounded-xl px-4 py-3 focus:ring-primary-500 ${
                                                fieldErrors.endDate
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-neutral-200 focus:border-primary-500"
                                            } ${
                                                !canEditEndDate ? "bg-neutral-50 cursor-not-allowed" : "bg-white"
                                            }`}
                                        />
                                        {!formData.endDate && canEditEndDate && (
                                            <div className="absolute -bottom-6 left-0 text-xs text-neutral-500 mt-1">
                                                💡 Bạn có thể để trống ngày kết thúc nếu chưa xác định
                                            </div>
                                        )}
                                    </div>
                                    {fieldErrors.endDate && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {fieldErrors.endDate}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client & Market Information */}
                    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
                        <div className="p-6 border-b border-neutral-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary-100 rounded-lg">
                                    <Building2 className="w-5 h-5 text-secondary-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Thông tin khách hàng & thị trường</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Company Info */}
                            {company && (
                                <div className="bg-neutral-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4 text-neutral-600" />
                                        <span className="text-sm font-medium text-neutral-600">Công ty khách hàng</span>
                                    </div>
                                    <p className="text-gray-900 font-semibold">{company.name}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                    <Globe2 className="w-4 h-4" />
                                    Thị trường <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => !isReadOnly && setIsMarketDropdownOpen(prev => !prev)}
                                        className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                                            <Globe2 className="w-4 h-4 text-neutral-400" />
                                            <span>
                                                {formData.marketId
                                                    ? markets.find(m => m.id === Number(formData.marketId))?.name || "Chọn thị trường"
                                                    : "Chọn thị trường"}
                                            </span>
                                        </div>
                                        <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                                    </button>
                                    {isMarketDropdownOpen && (
                                        <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                                            <div className="p-3 border-b border-neutral-100">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        value={marketSearch}
                                                        onChange={(e) => setMarketSearch(e.target.value)}
                                                        placeholder="Tìm thị trường..."
                                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, marketId: undefined }));
                                                        setMarketSearch("");
                                                        setIsMarketDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                                        !formData.marketId
                                                            ? "bg-primary-50 text-primary-700"
                                                            : "hover:bg-neutral-50 text-neutral-700"
                                                    }`}
                                                >
                                                    Tất cả thị trường
                                                </button>
                                                {filteredMarkets.length === 0 ? (
                                                    <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy thị trường phù hợp</p>
                                                ) : (
                                                    filteredMarkets.map(m => (
                                                        <button
                                                            type="button"
                                                            key={m.id}
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, marketId: m.id }));
                                                                setIsMarketDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                                                formData.marketId === m.id
                                                                    ? "bg-primary-50 text-primary-700"
                                                                    : "hover:bg-neutral-50 text-neutral-700"
                                                            }`}
                                                        >
                                                            {m.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                    <Factory className="w-4 h-4" />
                                    Lĩnh vực <span className="text-red-500">*</span>
                                </label>
                                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={industrySearch}
                                            onChange={(e) => setIndustrySearch(e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Tìm kiếm lĩnh vực..."
                                            className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-primary-500 bg-white"
                                        />
                                        {industrySearch && (
                                            <button
                                                type="button"
                                                onClick={() => setIndustrySearch("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                                aria-label="Xoá tìm kiếm lĩnh vực"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-neutral-600">
                                        <span>
                                            Đã chọn:{" "}
                                            <span className="font-semibold">
                                                {formData.industryIds.length}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    industryIds: [],
                                                }))
                                            }
                                            className="text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Bỏ chọn hết
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {filteredIndustries.map((industry) => (
                                            <label
                                                key={industry.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                                                    formData.industryIds.includes(industry.id)
                                                        ? "bg-primary-50 border-primary-200"
                                                        : "bg-white border-neutral-200 hover:border-primary-200"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                                    checked={formData.industryIds.includes(industry.id)}
                                                    disabled={isReadOnly}
                                                    onChange={(e) =>
                                                        handleIndustryChange(
                                                            industry.id,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <span className="text-sm font-medium text-neutral-700">
                                                    {industry.name}
                                                </span>
                                            </label>
                                        ))}
                                        {!filteredIndustries.length && (
                                            <div className="col-span-2 text-center text-sm text-neutral-500 py-6">
                                                Không tìm thấy lĩnh vực phù hợp
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Trạng thái <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEditStatus || isStatusDisabled}
                                        className={`w-full md:w-auto flex-1 border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                                            (!canEditStatus || isStatusDisabled) ? "opacity-50 cursor-not-allowed bg-neutral-50" : ""
                                        }`}
                                    >
                                        <option value="">-- Chọn trạng thái --</option>
                                        {originalStatus === "Planned" && (
                                            <>
                                                <option value="Planned">Đã lên kế hoạch (Planned)</option>
                                                <option value="Ongoing">Đang thực hiện (Ongoing)</option>
                                            </>
                                        )}
                                        {originalStatus === "Ongoing" && (
                                            <>
                                                <option value="Ongoing">Đang thực hiện (Ongoing)</option>
                                                <option value="Completed">Đã hoàn thành (Completed)</option>
                                                <option value="OnHold">Tạm dừng (OnHold)</option>
                                            </>
                                        )}
                                        {originalStatus === "Completed" && (
                                            <option value="Completed">Đã hoàn thành (Completed)</option>
                                        )}
                                        {originalStatus === "OnHold" && (
                                            <>
                                                <option value="OnHold">Tạm dừng (OnHold)</option>
                                                <option value="Ongoing">Đang thực hiện (Ongoing)</option>
                                            </>
                                        )}
                                        {!originalStatus && (
                                            <>
                                                <option value="Planned">Đã lên kế hoạch (Planned)</option>
                                                <option value="Ongoing">Đang thực hiện (Ongoing)</option>
                                                <option value="Completed">Đã hoàn thành (Completed)</option>
                                                <option value="OnHold">Tạm dừng (OnHold)</option>
                                            </>
                                        )}
                                    </select>

                                    {/* Nút xác nhận thay đổi trạng thái riêng (submit form) */}
                                    <button
                                        type="submit"
                                        disabled={saving || !formData.status || (!canEditStatus || isStatusDisabled)}
                                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Xác nhận thay đổi trạng thái
                                    </button>
                                </div>
                                {isReadOnly && originalStatus !== "Completed" && originalStatus !== "Ongoing" && (
                                    <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Chỉ có thể chỉnh sửa thông tin dự án khi ở trạng thái "Planned"
                                    </p>
                                )}
                                {originalStatus === "Ongoing" && (
                                    <p className="mt-1 text-sm text-blue-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Ở trạng thái "Ongoing" chỉ có thể chỉnh sửa ngày kết thúc và trạng thái
                                    </p>
                                )}
                                {isStatusDisabled && (
                                    <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Không thể thay đổi trạng thái từ "Đã hoàn thành"
                                    </p>
                                )}
                                {originalStatus === "Planned" && !isReadOnly && (
                                    <p className="mt-1 text-sm text-blue-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Từ "Planned" chỉ có thể chuyển sang "Ongoing"
                                    </p>
                                )}
                                {originalStatus === "Ongoing" && !isReadOnly && (
                                    <p className="mt-1 text-sm text-blue-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Từ "Ongoing" có thể chuyển sang "Completed" hoặc "OnHold"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    {(error || success) && (
                        <div className="animate-fade-in">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="text-green-700 font-medium">
                                        ✅ Cập nhật dự án thành công! Đang chuyển hướng...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <Link
                            to={`/sales/projects/${id}`}
                            className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
                        >
                            <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || (isReadOnly && originalStatus !== "Ongoing")}
                            className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
