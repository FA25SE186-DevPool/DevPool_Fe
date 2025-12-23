import { sidebarItems } from '../../../components/sidebar/admin';
import Sidebar from '../../../components/common/Sidebar';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
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
  Activity,
} from 'lucide-react';
import { userService } from '../../../services/User';
import { skillService } from '../../../services/Skill';
import { skillGroupService } from '../../../services/SkillGroup';
import { certificateTypeService } from '../../../services/CertificateType';
import { jobRoleLevelService } from '../../../services/JobRoleLevel';
import { jobRoleService } from '../../../services/JobRole';
import { locationService } from '../../../services/location';
import { marketService } from '../../../services/Market';
import { industryService } from '../../../services/Industry';
import { documentTypeService } from '../../../services/DocumentType';
import { expertService } from '../../../services/Expert';


export default function AdminDashboard() {
  
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
    industries: 0,
    documentTypes: 0,
    experts: 0
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);


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
          industriesRes,
          documentTypesRes,
          expertsRes
        ] = await Promise.all([
          userService.getAll({ excludeDeleted: true }).catch(() => ({ items: [], totalCount: 0 })),
          skillService.getAll({ excludeDeleted: true }).catch(() => []),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => []),
          Promise.resolve([]), // CV Templates removed
          certificateTypeService.getAll({ excludeDeleted: true }).catch(() => []),
          jobRoleLevelService.getAll({ excludeDeleted: true }).catch(() => []),
          jobRoleService.getAll({ excludeDeleted: true }).catch(() => []),
          locationService.getAll({ excludeDeleted: true }).catch(() => []),
          marketService.getAll({ excludeDeleted: true }).catch(() => []),
          industryService.getAll({ excludeDeleted: true }).catch(() => []),
          documentTypeService.getAll({ excludeDeleted: true }).catch(() => []),
          expertService.getAll({ excludeDeleted: true }).catch(() => [])
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
        const documentTypes = Array.isArray(documentTypesRes) ? documentTypesRes : [];
        const experts = Array.isArray(expertsRes) ? expertsRes : [];

        // Đếm số loại danh mục (cập nhật thành 11)
        const categoryTypes = 11;

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
          industries: industries.length,
          documentTypes: documentTypes.length,
          experts: experts.length
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
    { name: 'Loại Chứng Chỉ', count: categoryBreakdown.certificateTypes, icon: <FileText className="w-5 h-5" />, link: '/admin/categories/certificate-types', color: 'orange' },
    { name: 'Vị trí tuyển dụng (job role level)', count: categoryBreakdown.jobRoleLevels, icon: <Briefcase className="w-5 h-5" />, link: '/admin/categories/job-role-levels', color: 'blue' },
    { name: 'Loại vị trí tuyển dụng (job role)', count: categoryBreakdown.jobRoles, icon: <Briefcase className="w-5 h-5" />, link: '/admin/categories/job-roles', color: 'green' },
    { name: 'Khu vực làm việc (location)', count: categoryBreakdown.locations, icon: <MapPin className="w-5 h-5" />, link: '/admin/categories/locations', color: 'purple' },
    { name: 'Thị trường (market)', count: categoryBreakdown.markets, icon: <Building2 className="w-5 h-5" />, link: '/admin/categories/markets', color: 'orange' },
    { name: 'Lĩnh vực (industry)', count: categoryBreakdown.industries, icon: <Building2 className="w-5 h-5" />, link: '/admin/categories/industries', color: 'blue' },
    { name: 'Loại tài liệu (document type)', count: categoryBreakdown.documentTypes, icon: <FileText className="w-5 h-5" />, link: '/admin/categories/document-types', color: 'gray' },
    { name: 'Chuyên gia đánh giá (expert)', count: categoryBreakdown.experts, icon: <UserCog className="w-5 h-5" />, link: '/admin/categories/experts', color: 'purple' }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Người Dùng</h2>
                <Link
                  to="/admin/users"
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
                <Link to="/admin/users" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-primary-700 transition-colors duration-300">Quản lý người dùng</span>
                  </div>
                  <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">{stats.totalUsers}</span>
                </Link>

                <Link to="/admin/audit-log" className="group flex items-center p-4 border border-neutral-200 rounded-xl hover:bg-secondary-50 hover:border-secondary-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-secondary-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-secondary-700 transition-colors duration-300">Audit log</span>
                  </div>
                </Link>

                <Link to="/admin/categories/certificate-types/create" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-accent-50 hover:border-accent-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-accent-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-accent-700 transition-colors duration-300">Thêm loại chứng chỉ</span>
                  </div>
                </Link>

                <Link to="/admin/users" className="group flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-warning-50 hover:border-warning-300 transition-all duration-300 hover:shadow-soft">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-warning-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium group-hover:text-warning-700 transition-colors duration-300">Thêm người dùng</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Category Breakdown Cards */}
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Chi Tiết Danh Mục (10)</h2>
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
        
      </div>
    );
  };


  if (loading) {
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

        {/* Content */}
        {renderOverviewDashboard()}
      </div>
    </div>
  );
}