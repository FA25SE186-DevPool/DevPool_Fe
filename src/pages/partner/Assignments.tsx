import { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { decodeJWT } from '../../services/Auth';
import { getAccessToken } from '../../utils/storage';
import { partnerDashboardService, type PartnerAssignmentSummary } from '../../services/PartnerDashboard';

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-800',
  'Active': 'bg-green-100 text-green-800',
  'Completed': 'bg-blue-100 text-blue-800',
  'Terminated': 'bg-red-100 text-red-800',
  'Inactive': 'bg-yellow-100 text-yellow-800'
};

const statusLabels = {
  'Draft': 'Nháp',
  'Active': 'Đang hoạt động',
  'Completed': 'Hoàn thành',
  'Terminated': 'Đã chấm dứt',
  'Inactive': 'Tạm ngừng'
};

export default function PartnerAssignments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<PartnerAssignmentSummary[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<PartnerAssignmentSummary[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAccessToken();
        if (token) {
          const decoded = decodeJWT(token);
          const partnerIdFromToken = decoded?.partnerId || decoded?.id;
          if (partnerIdFromToken) {
            const assignmentsData = await partnerDashboardService.getMyAssignments(partnerIdFromToken);
            setAssignments(assignmentsData);
            setFilteredAssignments(assignmentsData);
          } else {
            setError('Không tìm thấy thông tin partner trong token');
          }
        } else {
          setError('Không tìm thấy thông tin đăng nhập');
        }
      } catch (err: any) {
        console.error('Error fetching assignments:', err);
        setError(err.message || 'Không thể tải danh sách phân công');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  // Filter assignments based on search and status
  useEffect(() => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.talentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    setFilteredAssignments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, assignments]);

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '—';
    const currencySymbol = currency === 'USD' ? '$' : '₫';
    return `${amount.toLocaleString('vi-VN')} ${currencySymbol}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách phân công...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Quản lý phân công</h1>
            <p className="text-gray-600 mt-2">Danh sách các hợp đồng và phân công nhân sự</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên nhân sự, dự án, vị trí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="Draft">Nháp</option>
                  <option value="Active">Đang hoạt động</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Terminated">Đã chấm dứt</option>
                  <option value="Inactive">Tạm ngừng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {paginatedAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có phân công nào phù hợp</p>
                <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân sự</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá mua</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài liệu</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedAssignments.map((assignment) => (
                        <tr key={assignment.assignmentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.talentName || '—'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {assignment.talentCode || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.projectName || '—'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.projectCode || '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.role || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <span>Từ: {formatDate(assignment.startDate)}</span>
                              <span>Đến: {formatDate(assignment.endDate)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors[assignment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[assignment.status as keyof typeof statusLabels] || assignment.status || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(assignment.buyingRate, assignment.currencyCode)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.commitmentFileUrl ? (
                              <a
                                href={assignment.commitmentFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <FileText className="w-4 h-4" />
                                Xem
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredAssignments.length)} trong tổng số {filteredAssignments.length} phân công
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                          {currentPage} / {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
