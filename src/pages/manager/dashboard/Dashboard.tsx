import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2, AlertCircle, BarChart3, TrendingDown, Minus, Calendar } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/manager';
import { dashboardService, type ExecutiveDashboardModel, type AnalyticsReportsModel, type ProjectAssignmentDashboardModel, type TalentManagementDashboardModel, type FinancialDashboardModel } from '../../../services/Dashboard';

type DashboardTab = 'executive' | 'analytics' | 'project-assignment' | 'talent-management' | 'financial';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('executive');
  
  // Executive Dashboard states
  const [loadingExecutive, setLoadingExecutive] = useState(true);
  const [errorExecutive, setErrorExecutive] = useState<string | null>(null);
  const [executiveData, setExecutiveData] = useState<ExecutiveDashboardModel | null>(null);

  // Analytics & Reports states
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errorAnalytics, setErrorAnalytics] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReportsModel | null>(null);

  // Project & Assignment Dashboard states
  const [loadingProjectAssignment, setLoadingProjectAssignment] = useState(false);
  const [errorProjectAssignment, setErrorProjectAssignment] = useState<string | null>(null);
  const [projectAssignmentData, setProjectAssignmentData] = useState<ProjectAssignmentDashboardModel | null>(null);

  // Talent Management Dashboard states
  const [loadingTalentManagement, setLoadingTalentManagement] = useState(false);
  const [errorTalentManagement, setErrorTalentManagement] = useState<string | null>(null);
  const [talentManagementData, setTalentManagementData] = useState<TalentManagementDashboardModel | null>(null);

  // Financial Dashboard states
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [errorFinancial, setErrorFinancial] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialDashboardModel | null>(null);

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData && !loadingAnalytics && !errorAnalytics) {
      fetchAnalyticsData();
    }
    if (activeTab === 'project-assignment' && !projectAssignmentData && !loadingProjectAssignment && !errorProjectAssignment) {
      fetchProjectAssignmentData();
    }
    if (activeTab === 'talent-management' && !talentManagementData && !loadingTalentManagement && !errorTalentManagement) {
      fetchTalentManagementData();
    }
    if (activeTab === 'financial' && !financialData && !loadingFinancial && !errorFinancial) {
      fetchFinancialData();
    }
  }, [activeTab]);

  const fetchExecutiveData = async () => {
    try {
      setLoadingExecutive(true);
      setErrorExecutive(null);
      const data = await dashboardService.getExecutiveDashboard();
      setExecutiveData(data);
    } catch (err: any) {
      console.error('Error fetching executive dashboard data:', err);
      setErrorExecutive(err.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoadingExecutive(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      setErrorAnalytics(null);
      const data = await dashboardService.getAnalyticsReports();
      setAnalyticsData(data);
    } catch (err: any) {
      // Chỉ log error nếu không phải là NOT_IMPLEMENTED (expected behavior)
      if (err.code !== 'NOT_IMPLEMENTED' && !err.message?.includes('chưa được triển khai')) {
        console.error('Error fetching analytics data:', err);
      }
      
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setErrorAnalytics('NOT_IMPLEMENTED');
      } else {
        setErrorAnalytics(err.message || 'Không thể tải dữ liệu analytics. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };

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
        setErrorProjectAssignment(err.message || 'Không thể tải dữ liệu project assignment. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingProjectAssignment(false);
    }
  };

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

  const fetchFinancialData = async () => {
    try {
      setLoadingFinancial(true);
      setErrorFinancial(null);
      const data = await dashboardService.getFinancialDashboard();
      setFinancialData(data);
    } catch (err: any) {
      // Chỉ log error nếu không phải là NOT_IMPLEMENTED (expected behavior)
      if (err.code !== 'NOT_IMPLEMENTED' && !err.message?.includes('chưa được triển khai')) {
        console.error('Error fetching financial data:', err);
      }
      
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setErrorFinancial('NOT_IMPLEMENTED');
      } else {
        setErrorFinancial(err.message || 'Không thể tải dữ liệu financial. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingFinancial(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
  };

  const formatPercentage = (value: number, decimals: number = 1) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
      case 'in progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'on hold':
      case 'paused':
        return 'Tạm dừng';
      case 'cancelled':
        return 'Đã hủy';
      case 'draft':
        return 'Bản nháp';
      default:
        return status;
    }
  };

  const translateMetricName = (metricName: string) => {
    switch (metricName.toLowerCase()) {
      case 'revenue':
        return 'Doanh thu';
      case 'costs':
        return 'Chi phí';
      case 'talents':
        return 'nhân sự';
      default:
        return metricName;
    }
  };

  const translateTrendDirection = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'stable':
        return 'Ổn định';
      case 'up':
      case 'increasing':
        return 'Tăng';
      case 'down':
      case 'decreasing':
        return 'Giảm';
      default:
        return direction;
    }
  };

  // Executive Dashboard Content
  const renderExecutiveDashboard = () => {
    if (loadingExecutive) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      );
    }

    if (errorExecutive) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Không thể tải dữ liệu</p>
            <p className="text-red-600 text-sm mb-4">{errorExecutive}</p>
            <button
              onClick={fetchExecutiveData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!executiveData) return null;

    return (
      <div className="space-y-6">

        {/* Charts - Chỉ hiển thị khi có dữ liệu */}
        {executiveData.revenueTrend && executiveData.revenueTrend.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Doanh thu & Chi phí (6 tháng)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={executiveData.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="costs" name="Chi phí" stroke="#f43f5e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lợi nhuận (6 tháng)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executiveData.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="profit" name="Lợi nhuận" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Clients & Top Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top công ty khách hàng (theo doanh thu)</h2>
            <div className="space-y-3">
              {executiveData.topClients.length > 0 ? (
                executiveData.topClients.slice(0, 5).map((client, index) => (
                  <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{client.clientName}</p>
                        <p className="text-sm text-gray-500">{client.projectCount} dự án</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(client.totalRevenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top dự án (theo doanh thu)</h2>
            <div className="space-y-3">
              {executiveData.topProjects.length > 0 ? (
                executiveData.topProjects.slice(0, 5).map((project, index) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg font-bold text-primary-600 flex-shrink-0">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{project.projectName}</p>
                        <p className="text-sm text-gray-500">{project.clientName} • {project.assignmentCount} phân công</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 ml-3 flex-shrink-0">{formatCurrency(project.totalRevenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Analytics & Reports Content
  const renderAnalyticsDashboard = () => {
    if (loadingAnalytics) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu analytics...</p>
          </div>
        </div>
      );
    }

    if (errorAnalytics) {
      // Hiển thị thông báo đặc biệt nếu API chưa được triển khai
      if (errorAnalytics === 'NOT_IMPLEMENTED' || errorAnalytics.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <BarChart3 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Analytics & Reports đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Vui lòng sử dụng tab "Executive Dashboard" để xem các thống kê hiện có.
              </p>
              <button
                onClick={() => setActiveTab('executive')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Executive Dashboard
              </button>
            </div>
          </div>
        );
      }

      // Hiển thị lỗi thông thường
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Không thể tải dữ liệu</p>
            <p className="text-red-600 text-sm mb-4">{errorAnalytics}</p>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!analyticsData) return null;

    const getTrendIcon = (direction: string) => {
      if (direction === 'Up') return <TrendingUp className="w-4 h-4 text-green-600" />;
      if (direction === 'Down') return <TrendingDown className="w-4 h-4 text-red-600" />;
      return <Minus className="w-4 h-4 text-gray-600" />;
    };

    return (
      <div className="space-y-6">
        {/* Revenue Analytics */}
        {analyticsData.revenueAnalytics && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Phân tích Doanh thu</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-neutral-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analyticsData.revenueAnalytics.totalRevenue)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-neutral-600">Tăng trưởng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatPercentage(analyticsData.revenueAnalytics.revenueGrowthRate)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-neutral-600">TB/Dự án</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analyticsData.revenueAnalytics.averageRevenuePerProject)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-neutral-600">TB/Công ty khách hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analyticsData.revenueAnalytics.averageRevenuePerClient)}</p>
              </div>
            </div>
            
            {analyticsData.revenueAnalytics.revenueTrend && analyticsData.revenueAnalytics.revenueTrend.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.revenueAnalytics.revenueTrend.map(item => ({
                  ...item,
                  label: `${item.month}/${item.year}`
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Trend Analysis */}
        {analyticsData.trendAnalysis && analyticsData.trendAnalysis.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Phân tích Xu hướng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.trendAnalysis.map((trend, index) => (
                <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{translateMetricName(trend.metricName)}</p>
                    {getTrendIcon(trend.trendDirection)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(trend.trendPercentage)}</p>
                  <p className="text-sm text-neutral-500 mt-1">Xu hướng: {translateTrendDirection(trend.trendDirection)}</p>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    );
  };

  // Project & Assignment Dashboard Content
  const renderProjectAssignmentDashboard = () => {
    if (loadingProjectAssignment) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu project & assignment...</p>
          </div>
        </div>
      );
    }

    if (errorProjectAssignment) {
      // Hiển thị thông báo đặc biệt nếu API chưa được triển khai
      if (errorProjectAssignment === 'NOT_IMPLEMENTED' || errorProjectAssignment.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <BarChart3 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Project & Assignment Dashboard đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Vui lòng sử dụng tab "Executive Dashboard" để xem các thống kê hiện có.
              </p>
              <button
                onClick={() => setActiveTab('executive')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Executive Dashboard
              </button>
            </div>
          </div>
        );
      }

      // Hiển thị lỗi thông thường
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

        {/* Active Projects Details */}
        {projectAssignmentData.activeProjectsDetails && projectAssignmentData.activeProjectsDetails.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án đang hoạt động</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Tên dự án</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Công ty khách hàng</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Phân công</th>
                  </tr>
                </thead>
                <tbody>
                  {projectAssignmentData.activeProjectsDetails.slice(0, 5).map((project) => (
                    <tr key={project.projectId} className="border-b border-neutral-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{project.projectName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-600">{project.clientName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {translateStatus(project.status)}
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

        {/* Upcoming Deadlines */}
        {projectAssignmentData.upcomingDeadlines && projectAssignmentData.upcomingDeadlines.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deadline sắp tới</h2>
            <div className="space-y-3">
              {projectAssignmentData.upcomingDeadlines.slice(0, 5).map((deadline) => (
                <div key={deadline.projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-5 h-5 ${deadline.daysUntilDeadline <= 7 ? 'text-red-600' : deadline.daysUntilDeadline <= 30 ? 'text-amber-600' : 'text-gray-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{deadline.projectName}</p>
                      <p className="text-sm text-neutral-600">{deadline.deadlineType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${deadline.daysUntilDeadline <= 7 ? 'text-red-600' : deadline.daysUntilDeadline <= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {deadline.daysUntilDeadline} ngày
                    </p>
                    <p className="text-xs text-neutral-500">{new Date(deadline.deadlineDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Projects by Client */}
        {projectAssignmentData.projectsByClient && projectAssignmentData.projectsByClient.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án theo công ty khách hàng</h2>
            <div className="space-y-3">
              {projectAssignmentData.projectsByClient.slice(0, 5).map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{client.clientName}</p>
                    <p className="text-sm text-neutral-600">{client.activeProjectCount} hoạt động / {client.projectCount} tổng dự án</p>
                  </div>
                  <p className="font-semibold text-gray-900">{client.assignmentCount} phân công</p>
                </div>
              ))}
            </div>
          </div>
        )}
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
                onClick={() => setActiveTab('executive')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Executive Dashboard
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


        {/* New Talents Trend */}
        {talentManagementData.newTalentsTrend && talentManagementData.newTalentsTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng nhân sự mới (3 tháng)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talentManagementData.newTalentsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newTalents" name="nhân sự mới" fill="#22c55e" />
                <Bar dataKey="leavingTalents" name="nhân sự rời" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // Financial Dashboard Content
  const renderFinancialDashboard = () => {
    if (loadingFinancial) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu financial...</p>
          </div>
        </div>
      );
    }

    if (errorFinancial) {
      if (errorFinancial === 'NOT_IMPLEMENTED' || errorFinancial.includes('chưa được triển khai')) {
        return (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
              <BarChart3 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chức năng đang phát triển</h3>
              <p className="text-amber-700 mb-4">
                Financial Dashboard đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <button
                onClick={() => setActiveTab('executive')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Chuyển sang Executive Dashboard
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
            <p className="text-red-600 text-sm mb-4">{errorFinancial}</p>
            <button
              onClick={fetchFinancialData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!financialData) return null;

    return (
      <div className="space-y-6">

        {/* Monthly Financial Trend */}
        {financialData.monthlyTrend && financialData.monthlyTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Tài chính theo tháng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="costs" name="Chi phí" stroke="#f43f5e" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Client */}
        {financialData.revenueByClient && financialData.revenueByClient.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo Công ty khách hàng</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {financialData.revenueByClient.slice(0, 10).map((client) => (
                  <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{client.clientName}</p>
                      <p className="text-sm text-neutral-600">{client.contractCount} hợp đồng</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(client.totalRevenue)}</p>
                      <p className="text-xs text-green-600">Paid: {formatCurrency(client.paidAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Costs by Partner */}
            {financialData.costsByPartner && financialData.costsByPartner.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí theo Đối tác</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {financialData.costsByPartner.slice(0, 10).map((partner) => (
                    <div key={partner.partnerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{partner.partnerName}</p>
                        <p className="text-sm text-neutral-600">{partner.contractCount} hợp đồng</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(partner.totalCosts)}</p>
                        <p className="text-xs text-green-600">Paid: {formatCurrency(partner.paidAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Manager" />
      
      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-neutral-600 mt-1">Tổng quan kinh doanh và hoạt động</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'executive'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Phân tích & Báo cáo
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
            <button
              onClick={() => setActiveTab('talent-management')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'talent-management'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Nhân sự
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'financial'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Tài chính
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'executive' && renderExecutiveDashboard()}
        {activeTab === 'analytics' && renderAnalyticsDashboard()}
        {activeTab === 'project-assignment' && renderProjectAssignmentDashboard()}
        {activeTab === 'talent-management' && renderTalentManagementDashboard()}
        {activeTab === 'financial' && renderFinancialDashboard()}
      </div>
    </div>
  );
}
