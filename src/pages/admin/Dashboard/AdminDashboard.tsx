import { sidebarItems } from '../../../components/sidebar/admin';
import Sidebar from '../../../components/common/Sidebar';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  Layers,
  FileText,
  Building2,
  Tag,
  Briefcase,
  MapPin,
  UserCog,
  UserCheck,
  DollarSign,
  Code,
  Star,
  Grid,
  Loader2,
  AlertCircle,
  BarChart3,
  Activity,
  FileCheck,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { userService } from '../../../services/User';
import { skillService } from '../../../services/Skill';
import { skillGroupService } from '../../../services/SkillGroup';
import { cvTemplateService } from '../../../services/CVTemplate';
import { certificateTypeService } from '../../../services/CertificateType';
import { jobRoleLevelService } from '../../../services/JobRoleLevel';
import { jobRoleService } from '../../../services/JobRole';
import { locationService } from '../../../services/location';
import { marketService } from '../../../services/Market';
import { industryService } from '../../../services/Industry';
import { dashboardService, type OperationsDashboardModel } from '../../../services/Dashboard';

type DashboardTab = 'overview' | 'operations';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Overview tab states
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCategories: 0,
    totalSkills: 0,
    totalCertificates: 0
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState({
    skills: 0,
    skillGroups: 0,
    cvTemplates: 0,
    certificateTypes: 0,
    jobRoleLevels: 0,
    jobRoles: 0,
    locations: 0,
    markets: 0,
    industries: 0
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  // Operations Dashboard states
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [errorOperations, setErrorOperations] = useState<string | null>(null);
  const [operationsData, setOperationsData] = useState<OperationsDashboardModel | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          usersRes,
          skillsRes,
          skillGroupsRes,
          cvTemplatesRes,
          certificateTypesRes,
          jobRoleLevelsRes,
          jobRolesRes,
          locationsRes,
          marketsRes,
          industriesRes
        ] = await Promise.all([
          userService.getAll({ excludeDeleted: true }).catch(() => ({ items: [], totalCount: 0 })),
          skillService.getAll({ excludeDeleted: true }).catch(() => []),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => []),
          cvTemplateService.getAll({ excludeDeleted: true }).catch(() => []),
          certificateTypeService.getAll({ excludeDeleted: true }).catch(() => []),
          jobRoleLevelService.getAll({ excludeDeleted: true }).catch(() => []),
          jobRoleService.getAll({ excludeDeleted: true }).catch(() => []),
          locationService.getAll({ excludeDeleted: true }).catch(() => []),
          marketService.getAll({ excludeDeleted: true }).catch(() => []),
          industryService.getAll({ excludeDeleted: true }).catch(() => [])
        ]);

        const skills = Array.isArray(skillsRes) ? skillsRes : [];
        const skillGroups = Array.isArray(skillGroupsRes) ? skillGroupsRes : [];
        const cvTemplates = Array.isArray(cvTemplatesRes) ? cvTemplatesRes : [];
        const certificateTypes = Array.isArray(certificateTypesRes) ? certificateTypesRes : [];
        const jobRoleLevels = Array.isArray(jobRoleLevelsRes) ? jobRoleLevelsRes : [];
        const jobRoles = Array.isArray(jobRolesRes) ? jobRolesRes : [];
        const locations = Array.isArray(locationsRes) ? locationsRes : [];
        const markets = Array.isArray(marketsRes) ? marketsRes : [];
        const industries = Array.isArray(industriesRes) ? industriesRes : [];

        // Đếm số loại danh mục (luôn là 9)
        const categoryTypes = 9;

        setStats({
          totalUsers: usersRes.totalCount || 0,
          totalCategories: categoryTypes,
          totalSkills: skills.length,
          totalCertificates: certificateTypes.length
        });

        setCategoryBreakdown({
          skills: skills.length,
          skillGroups: skillGroups.length,
          cvTemplates: cvTemplates.length,
          certificateTypes: certificateTypes.length,
          jobRoleLevels: jobRoleLevels.length,
          jobRoles: jobRoles.length,
          locations: locations.length,
          markets: markets.length,
          industries: industries.length
        });

        // Lấy 3 users mới nhất
        const latestUsers = (usersRes.items || []).slice(0, 3).map((user: any) => ({
          id: user.id,
          name: user.fullName,
          email: user.email,
          roles: user.roles || [],
          isActive: user.isActive,
          createdAt: user.createdAt
        }));
        setRecentUsers(latestUsers);
      } catch (error) {
        console.error('❌ Lỗi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'operations' && !operationsData && !loadingOperations && !errorOperations) {
      fetchOperationsData();
    }
  }, [activeTab]);

  const fetchOperationsData = async () => {
    try {
      setLoadingOperations(true);
      setErrorOperations(null);
      const data = await dashboardService.getOperationsDashboard();
      setOperationsData(data);
    } catch (err: any) {
      // Chỉ log error nếu không phải là NOT_IMPLEMENTED (expected behavior)
      if (err.code !== 'NOT_IMPLEMENTED' && !err.message?.includes('chưa được triển khai')) {
        console.error('Error fetching operations data:', err);
      }
      
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setErrorOperations('NOT_IMPLEMENTED');
      } else {
        setErrorOperations(err.message || 'Không thể tải dữ liệu operations. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingOperations(false);
    }
  };

  const kpiStats = [
    {
      title: 'Tổng Người Dùng',
      value: stats.totalUsers.toString(),
      icon: <Users className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Loại Danh Mục',
      value: 10,
      icon: <Grid className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Kỹ Năng',
      value: stats.totalSkills.toString(),
      icon: <Star className="w-6 h-6" />,
      color: 'purple'
    },
    {
      title: 'Loại Chứng Chỉ',
      value: stats.totalCertificates.toString(),
      icon: <FileText className="w-6 h-6" />,
      color: 'orange'
    }
  ];


  const categoryStats = [
    { name: 'Kỹ Năng (skill)', count: categoryBreakdown.skills, icon: <Star className="w-5 h-5" />, link: '/admin/categories/skills', color: 'blue' },
    { name: 'Nhóm Kỹ Năng (skill group)', count: categoryBreakdown.skillGroups, icon: <Tag className="w-5 h-5" />, link: '/admin/categories/skill-groups', color: 'green' },
    { name: 'Mẫu CV (cv template)', count: categoryBreakdown.cvTemplates, icon: <FileText className="w-5 h-5" />, link: '/admin/categories/cv-templates', color: 'purple' },
    { name: 'Loại Chứng Chỉ', count: categoryBreakdown.certificateTypes, icon: <FileText className="w-5 h-5" />, link: '/admin/categories/certificate-types', color: 'orange' },
    { name: 'Vị trí tuyển dụng (job role level)', count: categoryBreakdown.jobRoleLevels, icon: <Briefcase className="w-5 h-5" />, link: '/admin/categories/job-role-levels', color: 'blue' },
    { name: 'Loại vị trí tuyển dụng (job role)', count: categoryBreakdown.jobRoles, icon: <Briefcase className="w-5 h-5" />, link: '/admin/categories/job-roles', color: 'green' },
    { name: 'Khu vực làm việc (location)', count: categoryBreakdown.locations, icon: <MapPin className="w-5 h-5" />, link: '/admin/categories/locations', color: 'purple' },
    { name: 'Thị trường (market)', count: categoryBreakdown.markets, icon: <Building2 className="w-5 h-5" />, link: '/admin/categories/markets', color: 'orange' },
    { name: 'Lĩnh vực (industry)', count: categoryBreakdown.industries, icon: <Building2 className="w-5 h-5" />, link: '/admin/categories/industries', color: 'blue' }
  ];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Tạm khóa';
  };

  const getRoleIcon = (roles: string[]) => {
    // Ưu tiên role quan trọng nhất
    if (roles.includes('Admin')) {
      return <Shield className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors duration-300" />;
    }
    if (roles.includes('Manager')) {
      return <UserCog className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />;
    }
    if (roles.includes('TA')) {
      return <UserCheck className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />;
    }
    if (roles.includes('Sales')) {
      return <Briefcase className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors duration-300" />;
    }
    if (roles.includes('Accountant')) {
      return <DollarSign className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300" />;
    }
    if (roles.includes('Developer')) {
      return <Code className="w-5 h-5 text-cyan-600 group-hover:text-cyan-700 transition-colors duration-300" />;
    }
    // Default
    return <Users className="w-5 h-5 text-neutral-600 group-hover:text-primary-600 transition-colors duration-300" />;
  };


  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-primary-100 text-primary-600';
      case 'green': return 'bg-secondary-100 text-secondary-600';
      case 'purple': return 'bg-accent-100 text-accent-600';
      case 'orange': return 'bg-warning-100 text-warning-600';
      default: return 'bg-neutral-100 text-neutral-600';
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
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {kpiStats.map((stat, index) => (
            <div key={index} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'blue' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                  stat.color === 'green' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                  stat.color === 'purple' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                  'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                } transition-all duration-300`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown Cards */}
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Chi Tiết Danh Mục (10 Loại)</h2>
              <Link 
                to="/admin/categories/skills"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors duration-300 hover:scale-105 transform"
              >
                Xem tất cả
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categoryStats.map((cat, index) => (
                <Link
                  key={index}
                  to={cat.link}
                  className="group p-4 bg-gradient-to-r from-neutral-50 to-primary-50 rounded-xl hover:from-primary-50 hover:to-accent-50 transition-all duration-300 border border-neutral-200 hover:border-primary-300 hover:shadow-soft"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getCategoryColor(cat.color)} group-hover:scale-110 transition-transform duration-300`}>
                      {cat.icon}
                    </div>
                    <CheckCircle className="w-4 h-4 text-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-xs font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300 mb-1">{cat.name}</h3>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">{cat.count}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Người Dùng</h2>
                <Link 
                  to="/admin/users/list"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors duration-300 hover:scale-105 transform"
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Chưa có người dùng nào
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="group flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-primary-50 rounded-xl hover:from-primary-50 hover:to-accent-50 transition-all duration-300 border border-neutral-200 hover:border-primary-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                          {getRoleIcon(user.roles)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors duration-300">{user.name}</h3>
                          <div className="text-xs text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                            {user.email}
                          </div>
                          {user.roles.length > 0 && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {user.roles.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                          {getStatusText(user.isActive)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-gray-900">Thao Tác Nhanh</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                <Link to="/admin/users/list" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-primary-700 transition-colors duration-300">Quản lý người dùng</span>
                  </div>
                  <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">{stats.totalUsers}</span>
                </Link>

                <Link to="/admin/categories/skills" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-secondary-50 hover:border-secondary-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Layers className="w-5 h-5 text-secondary-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-secondary-700 transition-colors duration-300">Quản lý danh mục</span>
                  </div>
                  <span className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">{stats.totalCategories}</span>
                </Link>

                <Link to="/admin/categories/certificate-types/create" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-accent-50 hover:border-accent-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-accent-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-accent-700 transition-colors duration-300">Thêm loại chứng chỉ</span>
                  </div>
                </Link>

                <Link to="/admin/users/create" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-warning-50 hover:border-warning-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-warning-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-warning-700 transition-colors duration-300">Tạo người dùng mới</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Operations Dashboard Content
  const renderOperationsDashboard = () => {
    if (loadingOperations) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu operations...</p>
          </div>
        </div>
      );
    }

    if (errorOperations) {
      if (errorOperations === 'NOT_IMPLEMENTED' || errorOperations.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <BarChart3 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Operations Dashboard đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Tổng quan
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
            <p className="text-red-600 text-sm mb-4">{errorOperations}</p>
            <button
              onClick={fetchOperationsData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!operationsData) return null;

    const getPriorityColor = (priority: string) => {
      if (priority === 'High') return 'text-red-600 bg-red-50';
      if (priority === 'Medium') return 'text-amber-600 bg-amber-50';
      return 'text-blue-600 bg-blue-50';
    };

    return (
      <div className="space-y-6">
        {/* Contract Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Contracts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{operationsData.totalContracts}</p>
              </div>
              <FileCheck className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-600">Draft</p>
            <p className="text-2xl font-bold text-gray-600 mt-2">{operationsData.draftContracts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-600">Submitted</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{operationsData.submittedContracts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-600">Verified</p>
            <p className="text-2xl font-bold text-cyan-600 mt-2">{operationsData.verifiedContracts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-600">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{operationsData.approvedContracts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{operationsData.rejectedContracts}</p>
          </div>
        </div>

        {/* Payment Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{operationsData.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{operationsData.pendingPayments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{operationsData.processingPayments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Invoiced</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{operationsData.invoicedPayments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Partially Paid</p>
            <p className="text-2xl font-bold text-cyan-600 mt-2">{operationsData.partiallyPaidPayments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{operationsData.paidPayments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{operationsData.overduePayments}</p>
          </div>
        </div>

        {/* Processing Times & Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Times</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600">Average Contract Processing</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {Math.round(operationsData.averageContractProcessingTime)} ngày
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Average Payment Processing</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {Math.round(operationsData.averagePaymentProcessingTime)} ngày
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{operationsData.totalDocuments}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Client Documents</p>
                  <p className="text-xl font-semibold text-blue-600 mt-1">{operationsData.clientDocuments}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Partner Documents</p>
                  <p className="text-xl font-semibold text-green-600 mt-1">{operationsData.partnerDocuments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {operationsData.pendingActions && operationsData.pendingActions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {operationsData.pendingActions.map((action, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{action.actionType}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{action.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottlenecks */}
        {operationsData.bottlenecks && operationsData.bottlenecks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Bottlenecks
            </h2>
            <div className="space-y-3">
              {operationsData.bottlenecks.slice(0, 5).map((bottleneck, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-red-900">{bottleneck.stage}</p>
                    <span className="text-red-600 font-semibold">{bottleneck.stuckItems} items</span>
                  </div>
                  <p className="text-sm text-red-700 mb-1">
                    Average stuck: {Math.round(bottleneck.averageStuckDays)} ngày
                  </p>
                  <p className="text-sm text-red-600">{bottleneck.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {operationsData.recentActivities && operationsData.recentActivities.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {operationsData.recentActivities.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-neutral-200">
                  <Activity className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                      <span>{activity.activityType}</span>
                      <span>•</span>
                      <span>{activity.userName}</span>
                      <span>•</span>
                      <span>{new Date(activity.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tổng Quan Hệ Thống</h1>
          <p className="text-neutral-600 mt-1">Giám sát và quản lý toàn bộ hoạt động DevPool</p>
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
              onClick={() => setActiveTab('operations')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'operations'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Operations
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewDashboard()}
        {activeTab === 'operations' && renderOperationsDashboard()}
      </div>
    </div>
  );
}