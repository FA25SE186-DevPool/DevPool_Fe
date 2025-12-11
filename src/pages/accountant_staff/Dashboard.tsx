import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/accountant';
import Sidebar from '../../components/common/Sidebar';
import { dashboardService, type FinancialDashboardModel } from '../../services/Dashboard';

export default function AccountantDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialDashboardModel | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getFinancialDashboard();
      setFinancialData(data);
    } catch (err: any) {
      console.error('Error fetching financial data:', err);
      if (err.code === 'NOT_IMPLEMENTED' || err.message?.includes('chưa được triển khai')) {
        setError('Financial Dashboard chưa được triển khai');
      } else {
        setError(err.message || 'Không thể tải dữ liệu financial. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (v: number) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v) + ' VNĐ';

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Staff Accountant" />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-neutral-600 mt-1">Tiền mặt, công nợ, hóa đơn và dòng tiền</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-800 font-medium mb-2">Không thể tải dữ liệu</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchFinancialData}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : financialData ? (
          <div className="space-y-6">
            {/* Revenue & Cost Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard 
                label="Tổng Doanh thu" 
                value={formatVND(financialData.totalRevenue)} 
                icon={<DollarSign className="w-6 h-6 text-green-600" />} 
              />
              <KpiCard 
                label="Tổng Chi phí" 
                value={formatVND(financialData.totalCosts)} 
                icon={<DollarSign className="w-6 h-6 text-red-600" />} 
              />
              <KpiCard 
                label="Lợi nhuận ròng" 
                value={formatVND(financialData.netProfit)} 
                icon={<DollarSign className="w-6 h-6 text-blue-600" />} 
              />
              <KpiCard 
                label="Tỷ suất lợi nhuận" 
                value={`${financialData.profitMargin.toFixed(1)}%`} 
                icon={<TrendingUp className="w-6 h-6 text-purple-600" />} 
              />
            </div>

            {/* Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <KpiCard 
                label="Đã xuất hóa đơn" 
                value={formatVND(financialData.totalInvoiced)} 
                icon={<Receipt className="w-6 h-6 text-violet-600" />} 
              />
              <KpiCard 
                label="Đã thanh toán" 
                value={formatVND(financialData.totalPaid)} 
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} 
              />
              <KpiCard 
                label="Đang chờ" 
                value={formatVND(financialData.totalPending)} 
                icon={<AlertTriangle className="w-6 h-6 text-amber-600" />} 
              />
              <KpiCard 
                label="Quá hạn" 
                value={formatVND(financialData.totalOverdue)} 
                icon={<AlertTriangle className="w-6 h-6 text-red-600" />} 
              />
              <KpiCard 
                label="Tỷ lệ thu" 
                value={`${financialData.collectionRate.toFixed(1)}%`} 
                icon={<TrendingUp className="w-6 h-6 text-fuchsia-600" />} 
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Financial Trend */}
              {financialData.monthlyTrend && financialData.monthlyTrend.length > 0 && (
                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Dòng tiền theo tháng</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financialData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthLabel" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => formatVND(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="costs" name="Chi phí" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Payment Aging */}
              {financialData.paymentAging && financialData.paymentAging.length > 0 && (
                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Aging</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData.paymentAging}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageRange" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => formatVND(v)} />
                      <Legend />
                      <Bar dataKey="amount" name="Số tiền" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> Mục tiêu: giảm nhóm 61–90 và 90+
                  </p>
                </div>
              )}
            </div>

            {/* Revenue by Client */}
            {financialData.revenueByClient && financialData.revenueByClient.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo Client</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Client</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Tổng doanh thu</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đã thanh toán</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đang chờ</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Contracts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.revenueByClient.slice(0, 10).map((client) => (
                        <tr key={client.clientId} className="border-b border-neutral-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{client.clientName}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-gray-900">{formatVND(client.totalRevenue)}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="text-green-600">{formatVND(client.paidAmount)}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="text-amber-600">{formatVND(client.pendingAmount)}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              {client.contractCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Costs by Partner */}
            {financialData.costsByPartner && financialData.costsByPartner.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí theo Partner</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Partner</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Tổng chi phí</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đã thanh toán</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Contracts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.costsByPartner.slice(0, 10).map((partner) => (
                        <tr key={partner.partnerId} className="border-b border-neutral-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{partner.partnerName}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-red-600">{formatVND(partner.totalCosts)}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="text-green-600">{formatVND(partner.paidAmount)}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              {partner.contractCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-100 rounded-xl">{icon}</div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
