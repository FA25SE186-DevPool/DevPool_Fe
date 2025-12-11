import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { jobRequestService } from "../../../services/JobRequest";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { projectService, type Project } from "../../../services/Project";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from "../../../services/JobRoleLevel";
import { jobRoleService } from "../../../services/JobRole";
import { skillService, type Skill } from "../../../services/Skill";
import { locationService } from "../../../services/location";
import { applyProcessTemplateService } from "../../../services/ApplyProcessTemplate";
import { Button } from "../../../components/ui/button";
import { jobSkillService, type JobSkill } from "../../../services/JobSkill";
import { talentApplicationService } from "../../../services/TalentApplication";
import {  
  Edit, 
  Trash2, 
  Building2, 
  Briefcase, 
  Users, 
  FileText, 
  Target,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Layers,
  Star,
  Eye,
  Search,
  UserStar,
  FileUser,
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface JobRequestDetail {
  id: number;
  code: string;
  title: string;
  projectName?: string;
  clientCompanyName?: string;
  jobPositionName?: string;
  level: string;
  quantity: number;
  budgetPerMonth?: number | null;
  status: string;
  workingMode?: number;
  locationId?: number | null;
  description?: string;
  requirements?: string;
  jobSkills?: { id: number; name: string }[];
}

export default function JobRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState<JobRequestDetail | null>(null);
  const [jobSkills, setJobSkills] = useState<{ id: number; name: string }[]>([]);
  const [jobRoleName, setJobRoleName] = useState<string>("—");
  const [locationName, setLocationName] = useState<string>("—");
  const [applyProcessTemplateName, setApplyProcessTemplateName] = useState<string>("—");
  const [jobRoleLevelDisplay, setJobRoleLevelDisplay] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("general");
  
  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status and labels


  const workingModeLabels: Record<number, string> = {
    0: "Không xác định",
    1: "Tại văn phòng",
    2: "Từ xa",
    4: "Kết hợp",
    8: "Linh hoạt",
  };

  const statusLabels: Record<string, string> = {
    Submitted: "Đã nộp hồ sơ",
    Interviewing: "Đang xem xét phỏng vấn",
    Hired: "Đã tuyển",
    Rejected: "Đã từ chối",
    Withdrawn: "Đã rút",
  };

  const statusColors: Record<string, string> = {
    Submitted: "bg-sky-100 text-sky-800",
    Interviewing: "bg-cyan-100 text-cyan-800",
    Hired: "bg-purple-100 text-purple-800",
    Rejected: "bg-red-100 text-red-800",
    Withdrawn: "bg-gray-100 text-gray-800",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          jobReqData,
          allProjects,
          allCompanies,
          allPositions,
          allSkills,
        ] = await Promise.all([
          jobRequestService.getById(Number(id)),
          projectService.getAll() as Promise<Project[]>,
          clientCompanyService.getAll() as Promise<ClientCompany[]>,
          jobRoleLevelService.getAll() as Promise<JobRoleLevel[]>,
          skillService.getAll() as Promise<Skill[]>,
        ]);

        const project = allProjects.find((p) => p.id === jobReqData.projectId);
        const clientCompany = project
          ? allCompanies.find((c) => c.id === project.clientCompanyId)
          : null;
        const position = allPositions.find(
          (pos) => pos.id === jobReqData.jobRoleLevelId
        );

        if (position) {
          try {
            const role = await jobRoleService.getById(position.jobRoleId);
            setJobRoleName(role?.name ?? "—");
            
            // Format level text
            const getLevelText = (level: number): string => {
              const levelMap: Record<number, string> = {
                [TalentLevel.Junior]: "Junior",
                [TalentLevel.Middle]: "Middle",
                [TalentLevel.Senior]: "Senior",
                [TalentLevel.Lead]: "Lead"
              };
              return levelMap[level] || "Unknown";
            };
            
            // Set display text với name và level
            const levelText = getLevelText(position.level);
            setJobRoleLevelDisplay(`${position.name} - ${levelText}`);
          } catch {}
        }

        // Resolve names for related entities
        if (jobReqData.locationId) {
          try {
            const loc = await locationService.getById(jobReqData.locationId);
            setLocationName(loc?.name ?? "—");
          } catch {}
        }
        if (jobReqData.applyProcessTemplateId) {
          try {
            const apt = await applyProcessTemplateService.getById(jobReqData.applyProcessTemplateId);
            setApplyProcessTemplateName(apt?.name ?? "—");
          } catch {}
        }

        const jobReqWithExtra: JobRequestDetail = {
          ...jobReqData,
          projectName: project?.name || "—",
          clientCompanyName: clientCompany?.name || "—",
          jobPositionName: position?.name || "—",
        };

        const jobSkillData = await jobSkillService.getAll({
          jobRequestId: Number(id),
        }) as JobSkill[];

        const skills = jobSkillData.map((js) => {
          const found = allSkills.find((s) => s.id === js.skillsId);
          return { id: js.skillsId, name: found?.name || "Không xác định" };
        });

        setJobRequest(jobReqWithExtra);
        console.log("Job Request chi tiết:", jobReqWithExtra);
        setJobSkills(skills);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết Job Request:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch applications when applications tab is active
  useEffect(() => {
    const fetchApplications = async () => {
      if (activeTab !== "applications" || !id) return;
      
      try {
        setApplicationsLoading(true);
        const response = await talentApplicationService.getByJobRequest(Number(id));
        
        if (response?.success && response?.data?.applications) {
          // Map applications with talent and submitter info from response
          const enrichedApplications = response.data.applications.map((app: any) => {
            const talentName = app.talent?.fullName || "—";
            const submitterName = app.submitter?.fullName || app.submittedBy?.toString() || "—";
            
            return {
              ...app,
              talentName,
              submitterName,
            };
          });
          
          setApplications(enrichedApplications);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error("❌ Lỗi tải danh sách hồ sơ:", err);
        setApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [activeTab, id]);

  // 🗑️ Xóa yêu cầu tuyển dụng
  const handleDelete = async () => {
    if (!id) return;
    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa yêu cầu tuyển dụng này?");
    if (!confirm) return;

    try {
      await jobRequestService.delete(Number(id));
      alert("✅ Đã xóa yêu cầu tuyển dụng thành công!");
      navigate("/sales/job-requests");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa yêu cầu tuyển dụng!");
    }
  };

  // ✏️ Chuyển sang trang sửa
  const handleEdit = () => {
    navigate(`/sales/job-requests/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu yêu cầu tuyển dụng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobRequest) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy yêu cầu tuyển dụng</p>
            <Link 
              to="/sales/job-requests"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Status configuration
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 0:
        return {
          label: "Chờ duyệt",
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="w-4 h-4" />,
          bgColor: "bg-yellow-50"
        };
      case 1:
        return {
          label: "Đã duyệt",
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-green-50"
        };
      case 2:
        return {
          label: "Đã đóng",
          color: "bg-gray-100 text-gray-800",
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-gray-50"
        };
      case 3:
        return {
          label: "Bị từ chối",
          color: "bg-red-100 text-red-800",
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-red-50"
        };
      default:
        return {
          label: "Không xác định",
          color: "bg-gray-100 text-gray-800",
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: "bg-gray-50"
        };
    }
  };

  const statusConfig = getStatusConfig(Number(jobRequest.status));
  const isDisabled = [1, 2, 3].includes(Number(jobRequest.status));

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Yêu cầu tuyển dụng", to: "/sales/job-requests" },
              { label: jobRequest?.title || "Chi tiết yêu cầu" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobRequest.title}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết yêu cầu tuyển dụng của khách hàng
              </p>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor} border border-neutral-200`}>
                {statusConfig.icon}
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                disabled={isDisabled}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                  isDisabled
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                }`}
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDisabled}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                  isDisabled
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                }`}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "general"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "description"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Mô tả công việc
              </button>
              <button
                onClick={() => setActiveTab("requirements")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "requirements"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Yêu cầu ứng viên
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "skills"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Star className="w-4 h-4" />
                Kỹ năng yêu cầu
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeTab === "applications"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileUser className="w-4 h-4" />
                Danh sách hồ sơ
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <InfoItem 
                  label="Mã yêu cầu" 
                  value={jobRequest.code ?? "—"} 
                  icon={<FileText className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Công ty khách hàng" 
                  value={jobRequest.clientCompanyName ?? "—"} 
                  icon={<Building2 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Dự án" 
                  value={jobRequest.projectName ?? "—"} 
                  icon={<Layers className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Loại vị trí tuyển dụng" 
                  value={jobRoleName} 
                  icon={<Users className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Vị trí tuyển dụng" 
                  value={jobRoleLevelDisplay} 
                  icon={<Users className="w-4 h-4" />}
                />            
                <InfoItem 
                  label="Số lượng tuyển dụng" 
                  value={jobRequest.quantity?.toString() || "—"} 
                  icon={<Users className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Khu vực làm việc" 
                  value={locationName} 
                  icon={<Building2 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Chế độ làm việc" 
                  value={workingModeLabels[Number(jobRequest.workingMode ?? 0)] ?? "—"} 
                  icon={<Target className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mẫu quy trình ứng tuyển" 
                  value={applyProcessTemplateName} 
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
            )}

            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none animate-fade-in">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {jobRequest.description || "Chưa có mô tả công việc cụ thể"}
                </p>
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="prose prose-sm max-w-none animate-fade-in">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {jobRequest.requirements || "Chưa có yêu cầu cụ thể cho ứng viên"}
                </p>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="animate-fade-in">
                {jobSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {jobSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="group inline-flex items-center gap-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-4 py-2 rounded-xl text-sm font-medium border border-primary-200 hover:from-primary-200 hover:to-primary-300 transition-all duration-300 hover:scale-105 transform"
                      >
                        <Target className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có kỹ năng yêu cầu</p>
                    <p className="text-neutral-400 text-sm mt-1">Thêm kỹ năng để tìm ứng viên phù hợp</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "applications" && (
              <div className="animate-fade-in">
                {/* Search & Filter */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo tên ứng viên, người nộp..."
                        className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="Submitted">Đã nộp hồ sơ</option>
                      <option value="Interviewing">Đang xem xét phỏng vấn</option>
                      <option value="Hired">Đã tuyển</option>
                      <option value="Rejected">Đã từ chối</option>
                      <option value="Withdrawn">Đã rút</option>
                    </select>
                  </div>
                </div>

                {/* Applications Table */}
                {applicationsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Đang tải danh sách hồ sơ...</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      let filtered = [...applications];
                      if (searchTerm) {
                        const lowerSearch = searchTerm.toLowerCase();
                        filtered = filtered.filter((a) => 
                          a.submitterName?.toLowerCase().includes(lowerSearch) ||
                          a.talentName?.toLowerCase().includes(lowerSearch)
                        );
                      }
                      if (filterStatus) {
                        filtered = filtered.filter((a) => a.status === filterStatus);
                      }
                      
                      const totalPages = Math.ceil(filtered.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedApplications = filtered.slice(startIndex, endIndex);
                      const startItem = filtered.length > 0 ? startIndex + 1 : 0;
                      const endItem = Math.min(endIndex, filtered.length);

                      return (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50">
                                <tr>
                                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Người nộp</th>
                                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên ứng viên</th>
                                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Phiên bản CV</th>
                                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ngày nộp</th>
                                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {filtered.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="text-center py-12">
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                          <FileText className="w-8 h-8 text-neutral-400" />
                                        </div>
                                        <p className="text-neutral-500 text-lg font-medium">Không có hồ sơ nào</p>
                                        <p className="text-neutral-400 text-sm mt-1">Chưa có hồ sơ ứng tuyển cho yêu cầu này</p>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedApplications.map((app, i) => {
                                    // Tính toán idle và cảnh báo
                                    const getLastUpdatedTime = () => {
                                      if (app.updatedAt) return new Date(app.updatedAt);
                                      return new Date(app.createdAt);
                                    };
                                    const lastUpdated = getLastUpdatedTime();
                                    const daysSinceUpdate = Math.floor(
                                      (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
                                    );
                                    const isIdle5Days = daysSinceUpdate >= 5;
                                    const isIdle10Days = daysSinceUpdate > 10;
                                    const isIdle7Days = daysSinceUpdate >= 7; // Giữ cho tag "Idle 7d+"

                                    return (
                                    <tr
                                      key={app.id}
                                      className={`group transition-all duration-300 ${
                                        isIdle5Days 
                                          ? isIdle10Days
                                            ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-500"
                                            : "bg-amber-50/50 hover:bg-amber-100/70 border-l-4 border-amber-500"
                                          : "hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50"
                                      }`}
                                    >
                                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-neutral-400" />
                                          <span className="text-sm font-medium text-neutral-700">{app.submitterName || app.submittedBy}</span>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                          <UserStar className="w-4 h-4 text-neutral-400" />
                                          <span className="text-sm text-neutral-700">{app.talentName ?? "—"}</span>
                                          {/* Icon cảnh báo bên cạnh tên ứng viên */}
                                          {isIdle5Days && (
                                            <span
                                              title={isIdle10Days 
                                                ? `⚠️ Cần chú ý: Đã ${daysSinceUpdate} ngày không cập nhật (Quá 10 ngày)` 
                                                : `⚠️ Cần chú ý: Đã ${daysSinceUpdate} ngày không cập nhật (5-10 ngày)`
                                              }
                                              className="inline-flex items-center"
                                            >
                                              <AlertTriangle 
                                                className={`w-4 h-4 flex-shrink-0 ${
                                                  isIdle10Days ? "text-red-600" : "text-amber-600"
                                                }`}
                                              />
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className="text-sm text-neutral-700">{app.talentCV?.version ? `v${app.talentCV.version}` : "—"}</span>
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                            {statusLabels[app.status] ?? app.status}
                                          </span>
                                          {isIdle7Days && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                              Idle {daysSinceUpdate}d+
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        <span className="text-sm text-neutral-700">{new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        <Link
                                          to={`/sales/applications/${app.id}`}
                                          className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                                        >
                                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                          <span className="text-sm font-medium">Xem</span>
                                        </Link>
                                      </td>
                                    </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Pagination */}
                          {filtered.length > 0 && (
                            <div className="mt-6 flex items-center justify-between">
                              <div className="text-sm text-neutral-600">
                                Hiển thị {startItem}-{endItem} trong số {filtered.length} hồ sơ
                              </div>
                              <div className="flex items-center gap-2">
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
                                <span className="text-sm text-neutral-600 px-2">
                                  Trang {currentPage}/{totalPages}
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
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}
