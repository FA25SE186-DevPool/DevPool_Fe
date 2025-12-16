
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Briefcase, Clock, UserPlus, Building2, Target, Users, ClipboardList, Loader2, AlertCircle, BarChart3, Activity } from 'lucide-react';
import {
  LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/ta_staff';
import { talentService, type Talent } from '../../../services/Talent';
import { applyService, type Apply } from '../../../services/Apply';
import { applyActivityService, type ApplyActivity } from '../../../services/ApplyActivity';
import { jobRequestService, type JobRequest, JobRequestStatus } from '../../../services/JobRequest';
import { talentCVService } from '../../../services/TalentCV';
import { partnerService, type Partner } from '../../../services/Partner';
import { projectService, type Project } from '../../../services/Project';
import { clientCompanyService, type ClientCompany } from '../../../services/ClientCompany';
import { dashboardService, type TalentManagementDashboardModel } from '../../../services/Dashboard';

type DashboardTab = 'overview' | 'talent-management';

interface RecentApplication {
  id: number;
  talentName: string;
  jobTitle: string;
  status: string;
  createdAt: string;
}

interface RecentJobRequest {
  id: number;
  title: string;
  companyName: string;
  projectName: string;
  status: string;
  quantity: number;
  createdAt?: string;
}


export default function HRDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Overview tab states
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [applications, setApplications] = useState<Apply[]>([]);
  const [, setActivities] = useState<ApplyActivity[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentJobRequests, setRecentJobRequests] = useState<RecentJobRequest[]>([]);

  // Talent Management Dashboard states
  const [loadingTalentManagement, setLoadingTalentManagement] = useState(false);
  const [errorTalentManagement, setErrorTalentManagement] = useState<string | null>(null);
  const [talentManagementData, setTalentManagementData] = useState<TalentManagementDashboardModel | null>(null);

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
        setLoading(true);

        // Fetch all data in parallel
        const [talentsData, applicationsData, activitiesData, jobRequestsData, partnersData, projectsData, clientCompaniesData] = await Promise.all([
          talentService.getAll({ excludeDeleted: true }),
          applyService.getAll(),
          applyActivityService.getAll({ excludeDeleted: true }),
          jobRequestService.getAll({ excludeDeleted: true }),
          partnerService.getAll(),
          projectService.getAll({ excludeDeleted: true }),
          clientCompanyService.getAll({ excludeDeleted: true })
        ]);

        // Ensure all data are arrays
        const talentsArray = ensureArray<Talent>(talentsData);
        const applicationsArray = ensureArray<Apply>(applicationsData);
        const activitiesArray = ensureArray<ApplyActivity>(activitiesData);
        const jobRequestsArray = ensureArray<JobRequest>(jobRequestsData);
        const partnersArray = ensureArray<Partner>(partnersData);
        const projectsArray = ensureArray<Project>(projectsData);
        const clientCompaniesArray = ensureArray<ClientCompany>(clientCompaniesData);

        setTalents(talentsArray);
        setApplications(applicationsArray);
        setActivities(activitiesArray);
        setJobRequests(jobRequestsArray);
        setPartners(partnersArray);

        // Get recent applications with talent names (only Submitted status)
        const recentApps = applicationsArray
          .filter((app: Apply) => app.status === 'Submitted')
          .sort((a: Apply, b: Apply) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        const recentAppsWithDetails = await Promise.all(
          recentApps.map(async (app: Apply) => {
            try {
              const [cv, jobRequest] = await Promise.all([
                talentCVService.getById(app.cvId),
                jobRequestService.getById(app.jobRequestId)
              ]);

              const talent = talentsArray.find((t: Talent) => t.id === cv.talentId);

              return {
                id: app.id,
                talentName: talent?.fullName || 'N/A',
                jobTitle: jobRequest.title,
                status: app.status,
                createdAt: app.createdAt
              };
            } catch {
              return {
                id: app.id,
                talentName: 'N/A',
                jobTitle: 'N/A',
                status: app.status,
                createdAt: app.createdAt
              };
            }
          })
        );
        setRecentApplications(recentAppsWithDetails);

        // Get recent job requests
        const companyDict: Record<number, ClientCompany> = {};
        clientCompaniesArray.forEach((c: ClientCompany) => (companyDict[c.id] = c));

        const projectDict: Record<number, Project> = {};
        projectsArray.forEach((p: Project) => (projectDict[p.id] = p));

        const recentJobReqs = jobRequestsArray
          .filter((jr: JobRequest) => jr.status === JobRequestStatus.Pending)
          .sort((a: JobRequest, b: JobRequest) => b.id - a.id)
          .slice(0, 5)
          .map((jr: JobRequest) => {
            const project = projectDict[jr.projectId];
            const company = project ? companyDict[project.clientCompanyId] : undefined;
            const statusLabels: Record<number, string> = {
              [JobRequestStatus.Pending]: 'Chờ duyệt',
              [JobRequestStatus.Approved]: 'Đã duyệt',
              [JobRequestStatus.Closed]: 'Đã đóng',
              [JobRequestStatus.Rejected]: 'Đã từ chối'
            };
            return {
              id: jr.id,
              title: jr.title,
              companyName: company?.name || 'N/A',
              projectName: project?.name || 'N/A',
              status: statusLabels[jr.status] || 'N/A',
              quantity: jr.quantity,
              createdAt: ''
            };
          });
        setRecentJobRequests(recentJobReqs);
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'talent-management' && !talentManagementData && !loadingTalentManagement && !errorTalentManagement) {
      fetchTalentManagementData();
    }
  }, [activeTab]);

  const fetchTalentManagementData = async () => {
    try {
      setLoadingTalentManagement(true);
      setErrorTalentManagement(null);
      const data = await dashboardService.getTalentManagementDashboard();
      setTalentManagementData(data);
    } catch (err: any) {
      // Chỉ log error nếu không phải là NOT_IMPLEMENTED (expected behavior)
      if (err.code !== 'NOT_IMPLEMENTED' && !err.message?.includes('chưa được triển khai')) {
        console.error('Error fetching talent management data:', err);
      }
      
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setErrorTalentManagement('NOT_IMPLEMENTED');
      } else {
        setErrorTalentManagement(err.message || 'Không thể tải dữ liệu talent management. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingTalentManagement(false);
    }
  };

  // Calculate stats
  const totalTalents = talents.length;
  const totalApplications = applications.length;
  const totalJobRequests = jobRequests.length;
  const totalPartners = partners.length;

  // Job Requests stats
  const pendingJobRequests = jobRequests.filter(jr => jr.status === JobRequestStatus.Pending).length;

  // Applications by status
  const interviewingCount = applications.filter(app => app.status === 'Interviewing').length;

  const stats = [
    {
      title: 'Nhân Sự',
      value: totalTalents.toString(),
      change: 'Tổng số trong hệ thống',
      trend: 'up',
      color: 'blue',
      icon: Users,
      route: '/ta/developers'
    },
    {
      title: 'Đối Tác',
      value: totalPartners.toString(),
      change: 'Tổng số trong hệ thống',
      trend: 'up',
      color: 'orange',
      icon: Building2,
      route: '/ta/partners'
    },
    {
      title: 'Yêu Cầu Tuyển Dụng',
      value: totalJobRequests.toString(),
      change: `${pendingJobRequests} chờ duyệt`,
      trend: 'up',
      color: 'purple',
      icon: Briefcase,
      route: '/ta/job-requests'
    },    
    {
      title: 'Hồ Sơ Ứng Tuyển',
      value: totalApplications.toString(),
      change: `${interviewingCount} đang phỏng vấn`,
      trend: 'up',
      color: 'green',
      icon: ClipboardList,
      route: '/ta/applications'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-sky-100 text-sky-800';
      case 'Interviewing': return 'bg-cyan-100 text-cyan-800';
      case 'Hired': return 'bg-purple-100 text-purple-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Submitted': return 'Đã nộp hồ sơ';
      case 'Interviewing': return 'Đang xem xét phỏng vấn';
      case 'Hired': return 'Đã tuyển';
      case 'Rejected': return 'Đã từ chối';
      case 'Withdrawn': return 'Đã rút';
      default: return status;
    }
  };


  // Overview Dashboard Content
  const renderOverviewDashboard = () => {
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              onClick={() => navigate(stat.route)}
              className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color === 'blue' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                  stat.color === 'green' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                    stat.color === 'purple' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                      'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                  } transition-all duration-300`}>
                  {stat.icon && <stat.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />}
                </div>
              </div>
              <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Job Requests and Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Job Requests */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 animate-fade-in">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Yêu Cầu Tuyển Dụng Gần Đây</h2>
                <button
                  onClick={() => navigate('/ta/job-requests')}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors duration-300 hover:scale-105 transform"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentJobRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Chưa có yêu cầu nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJobRequests.map((jr) => (
                    <div
                      key={jr.id}
                      onClick={() => navigate(`/ta/job-requests/${jr.id}`)}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-primary-50 rounded-xl hover:from-primary-50 hover:to-accent-50 transition-all duration-300 border border-neutral-200 hover:border-primary-300 cursor-pointer"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors duration-300">{jr.title}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                          <span className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                            {jr.companyName}
                          </span>
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                            {jr.quantity} vị trí
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${jr.status === 'Chờ duyệt' ? 'bg-orange-100 text-orange-800' :
                            jr.status === 'Đã duyệt' ? 'bg-green-100 text-green-800' :
                              jr.status === 'Đã đóng' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {jr.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 animate-fade-in">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Ứng Tuyển Gần Đây</h2>
                <button
                  onClick={() => navigate('/ta/applications')}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors duration-300 hover:scale-105 transform"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentApplications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Chưa có ứng tuyển nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/ta/applications/${app.id}`)}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-primary-50 rounded-xl hover:from-primary-50 hover:to-accent-50 transition-all duration-300 border border-neutral-200 hover:border-primary-300 cursor-pointer"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors duration-300">{app.talentName}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                            {app.jobTitle}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                            {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Talent Management Dashboard Content
  const renderTalentManagementDashboard = () => {
    if (loadingTalentManagement) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu talent management...</p>
          </div>
        </div>
      );
    }

    if (errorTalentManagement) {
      if (errorTalentManagement === 'NOT_IMPLEMENTED' || errorTalentManagement.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <BarChart3 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Talent Management Dashboard đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Overview
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
            <p className="text-red-600 text-sm mb-4">{errorTalentManagement}</p>
            <button
              onClick={fetchTalentManagementData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!talentManagementData) return null;

    return (
      <div className="space-y-6">
        {/* Talent Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Tổng Nhân Sự</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{talentManagementData.totalTalents}</p>
              </div>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{talentManagementData.activeTalents}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Sẵn sàng</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{talentManagementData.availableTalents}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Đang Tuyển Dụng</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{talentManagementData.onboardingTalents}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* New Talents Trend Chart */}
        {talentManagementData.newTalentsTrend && talentManagementData.newTalentsTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Talents mới</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={talentManagementData.newTalentsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newTalents" name="Talents mới" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="leavingTalents" name="Talents rời đi" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="netChange" name="Thay đổi ròng" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    );
  };

  if (loading && activeTab === 'overview') {
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
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chào mừng, TA Staff</h1>
          <p className="text-neutral-600 mt-1">Quản lý tuyển dụng và nhân sự hiệu quả</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('talent-management')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'talent-management'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Quản Lý Nhân Sự
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewDashboard()}
        {activeTab === 'talent-management' && renderTalentManagementDashboard()}
      </div>
    </div>
  );
}
