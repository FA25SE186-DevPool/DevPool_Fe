import { useEffect, useState } from 'react';

// Tooltip component
const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 transform -translate-y-full whitespace-nowrap">
          {content}
          <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Info,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/accountant';
import Sidebar from '../../components/common/Sidebar';
import { dashboardService, type FinancialDashboardModel } from '../../services/Dashboard';

export default function AccountantDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialDashboardModel | null>(null);

  // Pagination states
  const [clientPage, setClientPage] = useState(1);
  const [partnerPage, setPartnerPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Reset pagination when data changes
  useEffect(() => {
    setClientPage(1);
    setPartnerPage(1);
  }, [financialData]);

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

  const formatVND = (v: number) => {
    if (v >= 1000000000) {
      return `${(v / 1000000000).toFixed(1)}B VNĐ`;
    } else if (v >= 1000000) {
      return `${(v / 1000000).toFixed(1)}M VNĐ`;
    } else if (v >= 1000) {
      return `${(v / 1000).toFixed(1)}K VNĐ`;
    }
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v) + ' VNĐ';
  };



  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Staff Accountant" />

      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-sm text-neutral-600 mt-1">Tiền mặt, công nợ, hóa đơn và dòng tiền</p>
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
          <div className="space-y-4">
            {/* Financial Overview - Row 1: Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard
                label="Tổng Doanh thu"
                value={formatVND(financialData.totalRevenue)}
                icon={<DollarSign className="w-4 h-4 text-green-600" />}
                className="col-span-1"
                tooltip={`Tổng doanh thu: ${new Intl.NumberFormat('vi-VN').format(financialData.totalRevenue)} VNĐ. Bao gồm tất cả nguồn thu từ các dự án và dịch vụ.`}
              />
              <KpiCard
                label="Tổng Chi phí"
                value={formatVND(financialData.totalCosts)}
                icon={<DollarSign className="w-4 h-4 text-red-600" />}
                className="col-span-1"
                tooltip={`Tổng chi phí: ${new Intl.NumberFormat('vi-VN').format(financialData.totalCosts)} VNĐ. Bao gồm lương nhân viên, chi phí vận hành và các khoản khác.`}
              />
              <KpiCard
                label="Lợi nhuận ròng"
                value={formatVND(financialData.netProfit)}
                icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
                className="col-span-1"
                tooltip={`Lợi nhuận ròng: ${new Intl.NumberFormat('vi-VN').format(financialData.netProfit)} VNĐ. Doanh thu trừ đi tất cả chi phí.`}
              />
              <KpiCard
                label="Tỷ suất lợi nhuận"
                value={`${financialData.profitMargin.toFixed(1)}`}
                icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                className="col-span-1"
                tooltip={`Tỷ suất lợi nhuận: ${(financialData.profitMargin).toFixed(1)}. Tính theo công thức: (Lợi nhuận ròng / Tổng doanh thu) × 100.`}
              />
            </div>

            {/* Payment Status - Row 2: Collection & Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Trạng thái thu tiền</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard
                  label="Đã xuất hóa đơn"
                  value={formatVND(financialData.totalInvoiced)}
                  icon={<Receipt className="w-3.5 h-3.5 text-violet-600" />}
                  className="bg-white/80 backdrop-blur-sm"
                  tooltip={`Tổng giá trị hóa đơn đã xuất: ${new Intl.NumberFormat('vi-VN').format(financialData.totalInvoiced)} VNĐ. Bao gồm tất cả hóa đơn đã phát hành.`}
                />
                <KpiCard
                  label="Đã thanh toán"
                  value={formatVND(financialData.totalPaid)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  className="bg-white/80 backdrop-blur-sm"
                  tooltip={`Tổng số tiền đã thu được: ${new Intl.NumberFormat('vi-VN').format(financialData.totalPaid)} VNĐ. Khách hàng đã thanh toán đầy đủ.`}
                />
                <KpiCard
                  label="Đang chờ"
                  value={formatVND(financialData.totalPending)}
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  className="bg-white/80 backdrop-blur-sm"
                  tooltip={`Tổng số tiền đang chờ thanh toán: ${new Intl.NumberFormat('vi-VN').format(financialData.totalPending)} VNĐ. Cần theo dõi và đốc thúc.`}
                />
                <KpiCard
                  label="Quá hạn"
                  value={formatVND(financialData.totalOverdue)}
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                  className="bg-white/80 backdrop-blur-sm"
                  tooltip={`Tổng nợ xấu quá hạn: ${new Intl.NumberFormat('vi-VN').format(financialData.totalOverdue)} VNĐ. Cần có biện pháp thu hồi khẩn cấp.`}
                />
                <KpiCard
                  label="Tỷ lệ thu"
                  value={`${financialData.collectionRate.toFixed(1)}`}
                  icon={<TrendingUp className="w-3.5 h-3.5 text-fuchsia-600" />}
                  className="bg-white/80 backdrop-blur-sm"
                  tooltip={`Tỷ lệ thu được: ${(financialData.collectionRate).toFixed(1)}. Tính theo công thức: (Đã thanh toán / Đã xuất hóa đơn) × 100.`}
                />
              </div>
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
                      <RechartsTooltip formatter={(v: number) => formatVND(v)} />
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
                      <RechartsTooltip formatter={(v: number) => formatVND(v)} />
                      <Legend />
                      <Bar dataKey="amount" name="Số tiền" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Revenue by Client */}
            {financialData.revenueByClient && financialData.revenueByClient.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo Công ty khách hàng</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Công ty khách hàng</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Tổng doanh thu</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đã thanh toán</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đang chờ</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Hợp đồng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.revenueByClient.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage).map((client) => (
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
                <Pagination
                  currentPage={clientPage}
                  totalItems={financialData.revenueByClient.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setClientPage}
                />
              </div>
            )}

            {/* Costs by Partner */}
            {financialData.costsByPartner && financialData.costsByPartner.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí theo Đối tác</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Đối tác</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Tổng chi phí</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Đã thanh toán</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Hợp đồng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.costsByPartner.slice((partnerPage - 1) * itemsPerPage, partnerPage * itemsPerPage).map((partner) => (
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
                <Pagination
                  currentPage={partnerPage}
                  totalItems={financialData.costsByPartner.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setPartnerPage}
                />
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
  icon,
  className = "",
  tooltip
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
  tooltip?: string;
}) {

  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow-soft p-4 hover:shadow-lg transition-all duration-200 border border-gray-100 cursor-pointer ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-1.5 bg-primary-50 rounded-md">{icon}</div>
        <div className="flex items-center gap-1">
          {tooltip && (
            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <CardContent />
      </Tooltip>
    );
  }

  return <CardContent />;
}

// Pagination Component
const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-4">
      <div className="text-sm text-gray-500">
        Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} của {totalItems} kết quả
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 text-sm font-medium text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
