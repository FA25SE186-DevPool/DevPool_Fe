import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Briefcase, Building2, UserCheck, Loader2, AlertCircle, BarChart3, TrendingDown, Minus, Calendar, CheckCircle, FileText } from 'lucide-react';
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

    const statsCards = [
      {
        title: 'Doanh thu tổng',
        value: formatCurrency(executiveData.totalRevenue),
        change: formatPercentage(executiveData.revenueGrowth),
        changeLabel: 'so với tháng trước',
        color: 'blue',
        icon: DollarSign
      },
      {
        title: 'Lợi nhuận ròng',
        value: formatCurrency(executiveData.netProfit),
        change: `${executiveData.profitMargin.toFixed(1)}%`,
        changeLabel: 'tỷ suất lợi nhuận',
        color: 'green',
        icon: TrendingUp
      },
      {
        title: 'Dự án đang hoạt động',
        value: executiveData.activeProjects.toString(),
        change: '',
        changeLabel: '',
        color: 'purple',
        icon: Briefcase
      },
      {
        title: 'Assignments đang hoạt động',
        value: executiveData.activeAssignments.toString(),
        change: '',
        changeLabel: '',
        color: 'blue',
        icon: UserCheck
      },
      {
        title: 'Tổng Clients',
        value: executiveData.totalClients.toString(),
        change: '',
        changeLabel: '',
        color: 'orange',
        icon: Building2
      },
      {
        title: 'Tổng Talents',
        value: executiveData.totalTalents.toString(),
        change: '',
        changeLabel: '',
        color: 'green',
        icon: Users
      }
    ];

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {statsCards.map((stat, index) => (
            <div key={index} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300 break-words leading-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full flex-shrink-0 ${stat.color === 'blue' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                  stat.color === 'green' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                    stat.color === 'purple' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                      'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                } transition-all duration-300`}>
                  {stat.icon && <stat.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />}
                </div>
              </div>
              {stat.change && (
                <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  {stat.change} {stat.changeLabel}
                </p>
              )}
            </div>
          ))}
        </div>

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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Clients (theo doanh thu)</h2>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Projects (theo doanh thu)</h2>
            <div className="space-y-3">
              {executiveData.topProjects.length > 0 ? (
                executiveData.topProjects.slice(0, 5).map((project, index) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg font-bold text-primary-600 flex-shrink-0">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{project.projectName}</p>
                        <p className="text-sm text-gray-500">{project.clientName} • {project.assignmentCount} assignments</p>
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
                <p className="text-sm text-neutral-600">TB/Project</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analyticsData.revenueAnalytics.averageRevenuePerProject)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-neutral-600">TB/Client</p>
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
                    <p className="font-medium text-gray-900">{trend.metricName}</p>
                    {getTrendIcon(trend.trendDirection)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(trend.trendPercentage)}</p>
                  <p className="text-sm text-neutral-500 mt-1">Xu hướng: {trend.trendDirection}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecasting */}
        {analyticsData.forecasting && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Dự báo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-3">Doanh thu dự báo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-neutral-600">Tháng tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedRevenueNextMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-neutral-600">Quý tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedRevenueNextQuarter)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-neutral-600">Năm tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedRevenueNextYear)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-3">Chi phí dự báo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-neutral-600">Tháng tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedCostsNextMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-neutral-600">Quý tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedCostsNextQuarter)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-neutral-600">Năm tới</span>
                    <span className="font-semibold">{formatCurrency(analyticsData.forecasting.forecastedCostsNextYear)}</span>
                  </div>
                </div>
              </div>
              {analyticsData.forecasting.forecastDataPoints && analyticsData.forecasting.forecastDataPoints.length > 0 && (
                <div className="md:col-span-1">
                  <h3 className="text-sm font-medium text-neutral-600 mb-3">Biểu đồ dự báo</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analyticsData.forecasting.forecastDataPoints}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="forecastedValue" name="Dự báo" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                      {analyticsData.forecasting.forecastDataPoints.some(dp => dp.actualValue) && (
                        <Line type="monotone" dataKey="actualValue" name="Thực tế" stroke="#22c55e" strokeWidth={2} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparative Analysis */}
        {analyticsData.comparativeAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyticsData.comparativeAnalysis.periodComparison && analyticsData.comparativeAnalysis.periodComparison.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">So sánh theo Kỳ</h2>
                <div className="space-y-3">
                  {analyticsData.comparativeAnalysis.periodComparison.map((comp, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">{comp.periodName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Hiện tại: {formatCurrency(comp.currentValue)}</span>
                        <span className={`font-semibold ${comp.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(comp.changePercentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyticsData.comparativeAnalysis.clientComparison && analyticsData.comparativeAnalysis.clientComparison.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">So sánh Clients</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analyticsData.comparativeAnalysis.clientComparison.slice(0, 5).map((client) => (
                    <div key={client.clientId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">{client.clientName}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-neutral-600">Doanh thu: </span>
                          <span className="font-semibold">{formatCurrency(client.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Lợi nhuận: </span>
                          <span className={`font-semibold ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(client.profit)}
                          </span>
                        </div>
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

    const getHealthStatusColor = (status: string) => {
      if (status === 'Healthy') return 'text-green-600 bg-green-50';
      if (status === 'At Risk') return 'text-amber-600 bg-amber-50';
      if (status === 'Critical') return 'text-red-600 bg-red-50';
      return 'text-gray-600 bg-gray-50';
    };

    return (
      <div className="space-y-6">
        {/* Project Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Tổng Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{projectAssignmentData.totalProjects}</p>
              </div>
              <Briefcase className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Projects đang hoạt động</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{projectAssignmentData.activeProjects}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Projects đã hoàn thành</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{projectAssignmentData.completedProjects}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Assignments</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{projectAssignmentData.totalAssignments}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Assignment Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Active Assignments</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{projectAssignmentData.activeAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Draft Assignments</p>
            <p className="text-2xl font-bold text-gray-600 mt-2">{projectAssignmentData.draftAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Completed Assignments</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{projectAssignmentData.completedAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Planned Projects</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{projectAssignmentData.plannedProjects}</p>
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Assignments</th>
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
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-600">
                          {project.activeAssignmentCount}/{project.assignmentCount} active
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

        {/* Project Health */}
        {projectAssignmentData.projectHealth && projectAssignmentData.projectHealth.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tình trạng dự án</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectAssignmentData.projectHealth.slice(0, 6).map((project) => (
                <div key={project.projectId} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 truncate">{project.projectName}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(project.healthStatus)}`}>
                      {project.healthStatus}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    <p>Completion: {project.completionRate.toFixed(1)}%</p>
                    <p>Active: {project.activeAssignments} | Completed: {project.completedAssignments}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects by Client */}
        {projectAssignmentData.projectsByClient && projectAssignmentData.projectsByClient.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects theo Client</h2>
            <div className="space-y-3">
              {projectAssignmentData.projectsByClient.slice(0, 5).map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{client.clientName}</p>
                    <p className="text-sm text-neutral-600">{client.activeProjectCount} active / {client.projectCount} total projects</p>
                  </div>
                  <p className="font-semibold text-gray-900">{client.assignmentCount} assignments</p>
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
        {/* Talent Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Tổng Talents</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{talentManagementData.totalTalents}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{talentManagementData.activeTalents}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Available</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{talentManagementData.availableTalents}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Onboarding</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{talentManagementData.onboardingTalents}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Inactive</p>
            <p className="text-3xl font-bold text-gray-600 mt-2">{talentManagementData.inactiveTalents}</p>
          </div>
        </div>

        {/* Assignment Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Total Assignments</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{talentManagementData.totalAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{talentManagementData.activeAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Completed</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{talentManagementData.completedAssignments}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Utilization Rate</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{talentManagementData.averageUtilizationRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Top Talents */}
        {talentManagementData.topTalents && talentManagementData.topTalents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Talents</h2>
            <div className="space-y-3">
              {talentManagementData.topTalents.slice(0, 5).map((talent, index) => (
                <div key={talent.talentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{talent.talentName}</p>
                      <p className="text-sm text-neutral-600">{talent.totalAssignments} assignments • {talent.completedAssignments} completed</p>
                    </div>
                  </div>
                  {talent.averageRating > 0 && (
                    <p className="font-semibold text-gray-900">⭐ {talent.averageRating.toFixed(1)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Talents Trend */}
        {talentManagementData.newTalentsTrend && talentManagementData.newTalentsTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Talents mới (3 tháng)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talentManagementData.newTalentsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newTalents" name="Talents mới" fill="#22c55e" />
                <Bar dataKey="leavingTalents" name="Talents rời" fill="#f43f5e" />
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
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Tổng Doanh thu</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(financialData.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Tổng Chi phí</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(financialData.totalCosts)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Lợi nhuận ròng</p>
            <p className="text-2xl font-bold text-primary-600 mt-2">{formatCurrency(financialData.netProfit)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Tỷ suất lợi nhuận</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{financialData.profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Đã xuất hóa đơn</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(financialData.totalInvoiced)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Đã thanh toán</p>
            <p className="text-xl font-bold text-green-600 mt-2">{formatCurrency(financialData.totalPaid)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Đang chờ</p>
            <p className="text-xl font-bold text-amber-600 mt-2">{formatCurrency(financialData.totalPending)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Quá hạn</p>
            <p className="text-xl font-bold text-red-600 mt-2">{formatCurrency(financialData.totalOverdue)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-sm font-medium text-neutral-600">Tỷ lệ thu</p>
            <p className="text-xl font-bold text-blue-600 mt-2">{financialData.collectionRate.toFixed(1)}%</p>
          </div>
        </div>

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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo Client</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {financialData.revenueByClient.slice(0, 10).map((client) => (
                  <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{client.clientName}</p>
                      <p className="text-sm text-neutral-600">{client.contractCount} contracts</p>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí theo Partner</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {financialData.costsByPartner.slice(0, 10).map((partner) => (
                    <div key={partner.partnerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{partner.partnerName}</p>
                        <p className="text-sm text-neutral-600">{partner.contractCount} contracts</p>
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
          <p className="text-neutral-600 mt-1">Tổng quan hoạt động kinh doanh</p>
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
              Executive Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Analytics & Reports
            </button>
            <button
              onClick={() => setActiveTab('project-assignment')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'project-assignment'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Project & Assignment
            </button>
            <button
              onClick={() => setActiveTab('talent-management')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'talent-management'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Talent Management
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'financial'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Financial
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
