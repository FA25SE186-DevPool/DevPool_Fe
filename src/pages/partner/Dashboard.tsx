import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  BarChart3,
  Activity
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { partnerDashboardService, type PartnerDashboardStats } from '../../services/PartnerDashboard';


export default function PartnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<PartnerDashboardStats | null>(null);

  // Mock data for charts (replace with real data when available)
  const talentStatusData = [
    { name: 'Đang làm việc', value: stats?.totalActiveTalents || 0, color: '#0088FE' },
    { name: 'Sẵn sàng', value: stats?.totalAvailableTalents || 0, color: '#00C49F' },
    { name: 'Đang phỏng vấn', value: stats?.totalInterviewingTalents || 0, color: '#FFBB28' }
  ];

  const monthlyRevenueData = [
    { month: 'T1', revenue: stats?.paymentsReceivedThisMonth || 0 },
    { month: 'T2', revenue: (stats?.paymentsReceivedThisMonth || 0) * 1.1 },
    { month: 'T3', revenue: (stats?.paymentsReceivedThisMonth || 0) * 1.2 },
    { month: 'T4', revenue: (stats?.paymentsReceivedThisMonth || 0) * 0.9 },
    { month: 'T5', revenue: (stats?.paymentsReceivedThisMonth || 0) * 1.3 },
    { month: 'T6', revenue: (stats?.paymentsReceivedThisMonth || 0) * 1.1 }
  ];

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        setLoading(true);
        setError('');

        // Backend automatically gets userId from JWT token
        const dashboardStats = await partnerDashboardService.getDashboard();
        setStats(dashboardStats);
      } catch (err: any) {
        console.error('Error fetching partner dashboard:', err);
        setError(err.message || 'Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
            <div className="text-red-600 mb-4">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <p className="font-medium">Không thể tải dữ liệu</p>
            </div>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stats calculation
  const statsCards = [
    {
      title: 'Nhân Sự',
      value: stats?.totalTalents || 0,
      change: 'Tổng số đang quản lý',
      trend: 'up',
      color: 'blue',
      icon: Users,
      route: '/partner/talents'
    },
    {
      title: 'Đang Hoạt Động',
      value: stats?.totalActiveTalents || 0,
      change: 'Đang làm việc',
      trend: 'up',
      color: 'green',
      icon: Activity,
      route: '/partner/talents'
    },
    {
      title: 'Dự Án',
      value: stats?.totalActiveProjects || 0,
      change: 'Đang triển khai',
      trend: 'up',
      color: 'purple',
      icon: Briefcase,
      route: '/partner/talents'
    },
    {
      title: 'Chưa Thanh Toán',
      value: formatCurrency(stats?.totalUnpaidAmount || 0),
      change: 'Cần thanh toán',
      trend: 'down',
      color: 'red',
      icon: DollarSign,
      route: '/partner/payments'
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Partner Portal" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chào mừng, Đối tác</h1>
          <p className="text-neutral-600 mt-1">Quản lý nhân sự và thanh toán hiệu quả</p>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => window.location.href = stat.route}
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
                      'bg-red-100 text-red-600 group-hover:bg-red-200'
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Talent Status Distribution */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố trạng thái nhân sự</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={talentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {talentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Nhân sự']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu hàng tháng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Thanh toán tháng này</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats?.paymentsReceivedThisMonth || 0)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Thanh toán năm nay</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(stats?.paymentsReceivedThisYear || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Tổng dự án</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats?.totalActiveProjects || 0}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
