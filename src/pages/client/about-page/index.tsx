import { useState, useEffect } from "react";
import {
    Users,
    CheckCircle,
    TrendingUp,
    Shield,
    Clock,
    Briefcase,
    Building2,
    Code2,
    FileCheck,
    HeartHandshake,
} from "lucide-react";
import { talentService } from "../../../services/Talent";
import { clientCompanyService } from "../../../services/ClientCompany";
import { partnerService } from "../../../services/Partner";
import { projectService } from "../../../services/Project";

export default function AboutPage() {
    const [stats, setStats] = useState([
        {
            number: "50+",
            label: "Nhân sự trong mạng lưới",
            icon: Users,
            color: "primary",
        },
        {
            number: "20+",
            label: "Dự án đang triển khai",
            icon: Briefcase,
            color: "secondary",
        },
        {
            number: "10+",
            label: "Doanh nghiệp khách hàng",
            icon: Building2,
            color: "accent",
        },
        {
            number: "10+",
            label: "Đối tác hợp tác",
            icon: CheckCircle,
            color: "success",
        },
    ]);

    // Function to format count with + suffix (round down to nearest 4)
    const formatCount = (count: number): string => {
        if (count <= 0) return "4+";
        const roundedDown = Math.floor(count / 4) * 4;
        return roundedDown > 0 ? `${roundedDown}+` : "4+";
    };

    useEffect(() => {
        const fetchStatsData = async () => {
            try {
                // Fetch all stats data in parallel
                const [talentsResult, projectsResult, clientCompaniesResult, partnersResult] = await Promise.all([
                    talentService.getAll({ excludeDeleted: true, pageSize: 1 }),
                    projectService.getAll({ excludeDeleted: true, pageSize: 1 }),
                    clientCompanyService.getAll({ excludeDeleted: true }),
                    partnerService.getAll({ excludeDeleted: true })
                ]);

                // Process counts
                const getCount = (result: any): number => {
                    if (Array.isArray(result)) return result.length;
                    if (result && typeof result === 'object') {
                        const obj = result as any;
                        if (obj.totalCount !== undefined) return obj.totalCount;
                        if (obj.data && Array.isArray(obj.data)) return obj.data.length;
                        if (obj.items && Array.isArray(obj.items)) return obj.items.length;
                    }
                    return 0;
                };

                const talentsCount = getCount(talentsResult);
                const projectsCount = getCount(projectsResult);
                const clientCompaniesCount = getCount(clientCompaniesResult);
                const partnersCount = getCount(partnersResult);

                // Update stats with real data
                setStats([
                    {
                        number: formatCount(talentsCount) || "50+",
                        label: "Nhân sự trong mạng lưới",
                        icon: Users,
                        color: "primary",
                    },
                    {
                        number: formatCount(projectsCount) || "20+",
                        label: "Dự án đang triển khai",
                        icon: Briefcase,
                        color: "secondary",
                    },
                    {
                        number: formatCount(clientCompaniesCount) || "10+",
                        label: "Doanh nghiệp khách hàng",
                        icon: Building2,
                        color: "accent",
                    },
                    {
                        number: formatCount(partnersCount) || "10+",
                        label: "Đối tác hợp tác",
                        icon: CheckCircle,
                        color: "success",
                    },
                ]);
            } catch (error) {
                console.error("❌ Lỗi tải dữ liệu thống kê trang About:", error);
                // Keep default values on error
            }
        };

        fetchStatsData();
    }, []);

    const values = [
        {
            icon: Shield,
            title: "Chất Lượng",
            description:
                "Cam kết cung cấp nguồn nhân lực chất lượng cao, đáp ứng các tiêu chuẩn khắt khe nhất.",
        },
        {
            icon: Clock,
            title: "Hiệu Quả",
            description:
                "Tối ưu hóa quy trình tuyển dụng, giúp doanh nghiệp tiết kiệm thời gian và chi phí.",
        },
        {
            icon: TrendingUp,
            title: "Phát Triển",
            description:
                "Không ngừng đổi mới và phát triển để mang đến giải pháp tốt nhất cho khách hàng.",
        },
    ];

    const services = [
        {
            icon: Code2,
            title: "Cung Cấp Nhân Sự IT",
            description: "Kết nối doanh nghiệp với developer chất lượng cao theo yêu cầu dự án: Backend, Frontend, Mobile, DevOps, QA/QC"
        },
        {
            icon: FileCheck,
            title: "Quản lý và chuẩn hóa hồ sơ nhân sự (CV)",
            description: "Quản lý dữ liệu hàng nghìn developer một cách tập trung và dễ tìm kiếm"
        },
        {
            icon: HeartHandshake,
            title: "Quản Lý Hợp Đồng",
            description: "Hỗ trợ quản lý hợp đồng 3 bên, theo dõi tiến độ, và xử lý thanh toán hàng tháng"
        },
    ];

    const workingModels = [
        {
            title: "Nhân sự trực tiếp",
            description: "Developer ký hợp đồng lao động trực tiếp với DevPool",
            icon: "01"
        },
        {
            title: "Đối tác công ty",
            description: "Nhân sự từ các công ty đối tác trong mạng lưới DevPool",
            icon: "02"
        },
        {
            title: "Freelancer chuyên nghiệp",
            description: "Developer độc lập có pháp nhân riêng, tự quản lý thuế",
            icon: "03"
        },
        {
            title: "Công ty khách hàng",
            description: "Bên yêu cầu thuê nhân sự và ký hợp đồng với DevPool để DevPool cung cấp nhân sự cho dự án",
            icon: "04"
        }
    ];
    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center max-w-4xl mx-auto mb-20 animate-fade-in-up">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent mb-6 leading-tight">
                        DevPool – hệ thống quản lý và cung cấp nhân sự CNTT theo dự án.
                    </h1>
                    <p className="text-xl text-neutral-600 leading-relaxed">
                        Nền tảng quản lý nội bộ cho công ty chuyên cung cấp nhân sự IT chuyên nghiệp cho doanh nghiệp. Chúng tôi là cầu nối tin cậy giữa developer tài năng và các công ty công nghệ hàng đầu.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-6 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={`p-3 bg-${stat.color}-100 rounded-2xl w-fit mb-4`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <div className="text-3xl font-bold text-neutral-900 mb-2">
                                {stat.number}
                            </div>
                            <div className="text-neutral-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Mission */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-8 border border-neutral-200/50 mb-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                            Sứ Mệnh Của Chúng Tôi
                        </h2>
                        <p className="text-lg text-neutral-600 leading-relaxed">
                            Tạo ra nền tảng số hóa toàn diện giúp doanh nghiệp quản lý và vận hành nguồn nhân lực hiệu quả hơn. DevPool biến quy trình tuyển dụng, cập nhật và chuẩn hóa CV, quản lý hợp đồng và thanh toán từ thủ công sang tự động, giúp tiết kiệm thời gian, giảm sai sót, tối ưu dữ liệu và nâng cao khả năng phản hồi khách hàng.
                        </p>
                    </div>
                </div>

                {/* Services */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
                        Dịch Vụ Của Chúng Tôi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {services.map((service, idx) => (
                            <div
                                key={idx}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-6 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-3 bg-primary-100 rounded-2xl w-fit mb-4">
                                    <service.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                                    {service.title}
                                </h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Working Models */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
                        Mô Hình Hợp Tác Linh Hoạt
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {workingModels.map((model, idx) => (
                            <div
                                key={idx}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-8 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
                            >
                                <div className="absolute top-4 right-4 text-6xl font-bold bg-gradient-to-br from-neutral-100/50 to-neutral-200/50 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                                    {model.icon}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent mb-4">
                                        {model.title}
                                    </h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        {model.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Values */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
                        Giá Trị Cốt Lõi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-6 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-3 bg-primary-100 rounded-2xl w-fit mb-4">
                                    <value.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl shadow-glow p-12 text-white">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6">
                            Tại Sao Chọn DevPool?
                        </h2>
                        <div className="space-y-4">
                            <p className="flex items-center gap-3 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                <span>Quy trình tuyển dụng chuyên nghiệp, minh bạch</span>
                            </p>
                            <p className="flex items-center gap-3 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                <span>Đội ngũ nhân sự được đánh giá kỹ càng về chuyên môn</span>
                            </p>
                            <p className="flex items-center gap-3 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                <span>Quản lý hợp đồng 3 bên minh bạch, đảm bảo quyền lợi các bên</span>
                            </p>
                            <p className="flex items-center gap-3 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                <span>Hệ thống báo cáo và theo dõi tiến độ làm việc hàng tháng</span>
                            </p>
                            <p className="flex items-center gap-3 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                <span>Giải pháp tùy chỉnh theo nhu cầu doanh nghiệp</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}