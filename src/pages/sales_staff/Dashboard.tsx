import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Users, Target, FileText,
  TrendingUp, Briefcase, AlertCircle, Loader2
} from "lucide-react";
import Sidebar from "../../components/common/Sidebar";
import { sidebarItems } from "../../components/sidebar/sales";
import { jobRequestService, type JobRequest, JobRequestStatus } from "../../services/JobRequest";
import { talentApplicationService, type TalentApplication } from "../../services/TalentApplication";
import { clientCompanyService, type ClientCompany } from "../../services/ClientCompany";
import { projectService, type Project } from "../../services/Project";
import { dashboardService, type ProjectAssignmentDashboardModel } from "../../services/Dashboard";

type DashboardTab = 'sales-pipeline' | 'project-assignment';

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales-pipeline');
  
  // Sales Pipeline states
  const [loading, setLoading] = useState(true);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [applications, setApplications] = useState<TalentApplication[]>([]);
  const [clientCompanies, setClientCompanies] = useState<ClientCompany[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Project Assignment Dashboard states
  const [loadingProjectAssignment, setLoadingProjectAssignment] = useState(false);
  const [errorProjectAssignment, setErrorProjectAssignment] = useState<string | null>(null);
  const [projectAssignmentData, setProjectAssignmentData] = useState<ProjectAssignmentDashboardModel | null>(null);

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
        setLoading(true);
        const [jobRequestsData, applicationsData, clientCompaniesData, projectsData] = await Promise.all([
          jobRequestService.getAll({ excludeDeleted: true }),
          talentApplicationService.getAll({ excludeDeleted: true }),
          clientCompanyService.getAll({ excludeDeleted: true }),
          projectService.getAll({ excludeDeleted: true })
        ]);

        setJobRequests(ensureArray<JobRequest>(jobRequestsData));
        setApplications(ensureArray<TalentApplication>(applicationsData));
        setClientCompanies(ensureArray<ClientCompany>(clientCompaniesData));
        setProjects(ensureArray<Project>(projectsData));
      } catch (error) {
        console.error("❌ Lỗi tải dữ liệu dashboard Sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'project-assignment' && !projectAssignmentData && !loadingProjectAssignment && !errorProjectAssignment) {
      fetchProjectAssignmentData();
    }
  }, [activeTab]);

  const fetchProjectAssignmentData = async () => {
    try {
      setLoadingProjectAssignment(true);
      setErrorProjectAssignment(null);
      const data = await dashboardService.getProjectAssignmentDashboard();
      setProjectAssignmentData(data);
    } catch (err: any) {
      // Chỉ log error nếu không phải là NOT_IMPLEMENTED (expected behavior)
      if (err.code !== 'NOT_IMPLEMENTED' && !err.message?.includes('chưa được triển khai')) {
        console.error('Error fetching project assignment data:', err);
      }
      
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setErrorProjectAssignment('NOT_IMPLEMENTED');
      } else {
        setErrorProjectAssignment(err.message || 'Không thể tải dữ liệu dự án & phân công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingProjectAssignment(false);
    }
  };

  const totalJobRequests = jobRequests.length;
  const approvedJobRequests = jobRequests.filter(jr => jr.status === JobRequestStatus.Approved).length;

  const totalApplications = applications.length;
  const interviewScheduledApplications = applications.filter(app => app.status === "Interviewing").length;
  const interviewingApplications = applications.filter(app => app.status === "Interviewing").length;
  const hiredApplications = applications.filter(app => app.status === "Hired").length;
  const rejectedApplications = applications.filter(app => app.status === "Rejected").length;
  const withdrawnApplications = applications.filter(app => app.status === "Withdrawn").length;

  const activeClientCompanies = clientCompanies.filter(company => !company.isDeleted).length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const newClientsThisMonth = clientCompanies.filter(company => {
    if (!company.createdAt) return false;
    const createdDate = new Date(company.createdAt);
    if (Number.isNaN(createdDate.getTime())) return false;
    return createdDate.getFullYear() === currentYear && createdDate.getMonth() === currentMonth;
  }).length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(project => project.status?.toLowerCase() === "ongoing").length;

  const monthlyPipelineData = (() => {
    const map = new Map<string, { pipeline: number; won: number }>();

    applications.forEach(app => {
      const createdDate = new Date(app.createdAt);
      if (Number.isNaN(createdDate.getTime())) return;
      const key = `${createdDate.getFullYear()}-${createdDate.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, { pipeline: 0, won: 0 });
      }
      const entry = map.get(key)!;
      entry.pipeline += 1;
      if (app.status === "Hired") {
        entry.won += 1;
      }
    });

    const results: { month: string; pipeline: number; won: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = `T${date.getMonth() + 1}`;
      const entry = map.get(key) ?? { pipeline: 0, won: 0 };
      results.push({ month: label, pipeline: entry.pipeline, won: entry.won });
    }

    return results;
  })();

  const stageFunnelData = [
    { stage: "Đã lên lịch", count: interviewScheduledApplications },
    { stage: "Phỏng vấn", count: interviewingApplications },
    { stage: "Đã tuyển", count: hiredApplications },
    { stage: "Từ chối", count: rejectedApplications },
    { stage: "Đã rút", count: withdrawnApplications }
  ].filter(item => item.count > 0);

  const stageFunnelChartData = stageFunnelData.length > 0
    ? stageFunnelData
    : [{ stage: "Chưa có dữ liệu", count: 0 }];

  // Navigation handlers
  const handleNavigateToJobRequests = () => navigate('/sales/job-requests');
  const handleNavigateToApplications = () => navigate('/sales/applications');
  const handleNavigateToClients = () => navigate('/sales/clients');
  const handleNavigateToProjects = () => navigate('/sales/projects');

  const primaryStats: Array<{
    title: string;
    value: string;
    description: string;
    icon: any;
    color: string;
    onClick?: () => void;
  }> = [
    {
      title: "Yêu cầu tuyển dụng",
      value: totalJobRequests.toString(),
      description: `${approvedJobRequests} yêu cầu đã duyệt`,
      icon: Target,
      color: "primary",
      onClick: handleNavigateToJobRequests
    },
    {
      title: "Hồ sơ ứng tuyển",
      value: totalApplications.toString(),
      description: `${interviewingApplications} hồ sơ đang xử lý`,
      icon: FileText,
      color: "secondary",
      onClick: handleNavigateToApplications
    },
    {
      title: "Công ty khách hàng",
      value: activeClientCompanies.toString(),
      description: `${newClientsThisMonth} công ty mới trong tháng`,
      icon: Users,
      color: "accent",
      onClick: handleNavigateToClients
    },
    {
      title: "Dự án đang theo dõi",
      value: totalProjects.toString(),
      description: `${activeProjects} đang thực hiện`,
      icon: Briefcase,
      color: "purple",
      onClick: handleNavigateToProjects
    }
  ];


  // Sales Pipeline Dashboard Content
  const renderSalesPipelineDashboard = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {primaryStats.map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              className={`group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200 ${
                stat.onClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color === 'primary' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                  stat.color === 'secondary' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                    stat.color === 'accent' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                      stat.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' :
                        'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                  } transition-all duration-300`}>
                  {stat.icon && <stat.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />}
                </div>
              </div>
              <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                {stat.description}
              </p>
            </div>
          ))}
        </div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Pipeline theo tháng">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyPipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toString()} />
                <Legend />
                <Line type="monotone" dataKey="pipeline" name="Hồ sơ mới" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="won" name="Đã tuyển" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Phễu tuyển dụng">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageFunnelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    );
  };

  // Project Assignment Dashboard Content
  const renderProjectAssignmentDashboard = () => {
    if (loadingProjectAssignment) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu dự án & phân công...</p>
          </div>
        </div>
      );
    }

    if (errorProjectAssignment) {
      if (errorProjectAssignment === 'NOT_IMPLEMENTED' || errorProjectAssignment.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <Briefcase className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Dashboard Dự án & Phân công đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <button
                onClick={() => setActiveTab('sales-pipeline')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Sales Pipeline
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Không thể tải dữ liệu</p>
            <p className="text-red-600 text-sm mb-4">{errorProjectAssignment}</p>
            <button
              onClick={fetchProjectAssignmentData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!projectAssignmentData) return null;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Projects Overview */}
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tổng quan Dự án</h3>
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Tổng Dự án</span>
                <span className="text-2xl font-bold text-gray-900">{projectAssignmentData.totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đang hoạt động</span>
                <span className="text-lg font-semibold text-green-600">{projectAssignmentData.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đã hoàn thành</span>
                <span className="text-lg font-semibold text-blue-600">{projectAssignmentData.completedProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đã lên kế hoạch</span>
                <span className="text-lg font-semibold text-amber-600">{projectAssignmentData.plannedProjects}</span>
              </div>
            </div>
          </div>

          {/* Assignments Overview */}
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tổng quan Phân công</h3>
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Tổng Phân công</span>
                <span className="text-2xl font-bold text-gray-900">{projectAssignmentData.totalAssignments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đang hoạt động</span>
                <span className="text-lg font-semibold text-green-600">{projectAssignmentData.activeAssignments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đang soạn thảo</span>
                <span className="text-lg font-semibold text-gray-600">{projectAssignmentData.draftAssignments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Đã hoàn thành</span>
                <span className="text-lg font-semibold text-blue-600">{projectAssignmentData.completedAssignments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects Details */}
        {projectAssignmentData.activeProjectsDetails && projectAssignmentData.activeProjectsDetails.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án đang hoạt động</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Tên dự án</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Công ty</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Phân công</th>
                  </tr>
                </thead>
                <tbody>
                  {projectAssignmentData.activeProjectsDetails.slice(0, 10).map((project) => (
                    <tr key={project.projectId} className="border-b border-neutral-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{project.projectName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-600">{project.clientName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {getProjectStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-600">
                          {project.activeAssignmentCount}/{project.assignmentCount} hoạt động
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>
    );
  };

  const getProjectStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      Ongoing: "Đang thực hiện",
      Planned: "Đã lên kế hoạch",
      Completed: "Đã hoàn thành",
      OnHold: "Tạm dừng",
      Cancelled: "Đã hủy"
    };
    return statusMap[status] || status;
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-neutral-600 mt-1">Theo dõi hiệu suất và pipeline bán hàng</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sales-pipeline')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'sales-pipeline'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Sales Pipeline
            </button>
            <button
              onClick={() => setActiveTab('project-assignment')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'project-assignment'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Dự án & Phân công
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'sales-pipeline' && renderSalesPipelineDashboard()}
        {activeTab === 'project-assignment' && renderProjectAssignmentDashboard()}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 hover:shadow-lg transition-all">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
