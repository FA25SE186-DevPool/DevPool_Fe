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
  UserCheck,
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { decodeJWT } from '../../services/Auth';
import { getAccessToken } from '../../utils/storage';
import { partnerDashboardService, type PartnerDashboardStats } from '../../services/PartnerDashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

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

        // Get partner ID from JWT token (assuming partner role)
        const token = getAccessToken();
        if (token) {
          const decoded = decodeJWT(token);
          // Assuming partner ID is stored in token, adjust based on your token structure
          const partnerIdFromToken = decoded?.partnerId || decoded?.id;
          if (partnerIdFromToken) {
            // Fetch dashboard stats
            const dashboardStats = await partnerDashboardService.getDashboard(partnerIdFromToken);
            setStats(dashboardStats);
          } else {
            setError('Không tìm thấy thông tin partner trong token');
          }
        } else {
          setError('Không tìm thấy thông tin đăng nhập');
        }
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
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={sidebarItems} title="Partner Portal" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600 mt-2">Tổng quan về nhân sự và thanh toán</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Tổng nhân sự"
              value={stats?.totalTalents || 0}
              icon={<Users className="w-6 h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Đang làm việc"
              value={stats?.totalActiveTalents || 0}
              icon={<UserCheck className="w-6 h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Dự án đang hoạt động"
              value={stats?.totalActiveProjects || 0}
              icon={<Briefcase className="w-6 h-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Chưa thanh toán"
              value={formatCurrency(stats?.totalUnpaidAmount || 0)}
              icon={<DollarSign className="w-6 h-6 text-white" />}
              color="bg-red-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Talent Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Thanh toán tháng này</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(stats?.paymentsReceivedThisMonth || 0)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Thanh toán năm nay</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(stats?.paymentsReceivedThisYear || 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
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
    </div>
  );
}
