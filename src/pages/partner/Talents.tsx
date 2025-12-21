import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { decodeJWT } from '../../services/Auth';
import { getAccessToken } from '../../utils/storage';
import { partnerDashboardService, type PartnerTalentSummary } from '../../services/PartnerDashboard';

const statusColors = {
  'Available': 'bg-green-100 text-green-800',
  'Working': 'bg-blue-100 text-blue-800',
  'Interviewing': 'bg-yellow-100 text-yellow-800',
  'Unavailable': 'bg-gray-100 text-gray-800',
  'Busy': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'Available': 'Sẵn sàng',
  'Working': 'Đang làm việc',
  'Interviewing': 'Đang phỏng vấn',
  'Unavailable': 'Tạm nghỉ',
  'Busy': 'Bận'
};

export default function PartnerTalents() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [talents, setTalents] = useState<PartnerTalentSummary[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<PartnerTalentSummary[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAccessToken();
        if (token) {
          const decoded = decodeJWT(token);
          const partnerIdFromToken = decoded?.partnerId || decoded?.id;
          if (partnerIdFromToken) {
            const talentsData = await partnerDashboardService.getMyTalents(partnerIdFromToken);
            setTalents(talentsData);
            setFilteredTalents(talentsData);
          } else {
            setError('Không tìm thấy thông tin partner trong token');
          }
        } else {
          setError('Không tìm thấy thông tin đăng nhập');
        }
      } catch (err: any) {
        console.error('Error fetching talents:', err);
        setError(err.message || 'Không thể tải danh sách nhân sự');
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, [user]);

  // Filter talents based on search and status
  useEffect(() => {
    let filtered = talents;

    if (searchTerm) {
      filtered = filtered.filter(talent =>
        talent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(talent => talent.status === statusFilter);
    }

    setFilteredTalents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, talents]);

  // Pagination
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTalents = filteredTalents.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách nhân sự...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân sự</h1>
            <p className="text-gray-600 mt-2">Danh sách nhân sự của đối tác</p>
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
                    placeholder="Tìm theo tên, email, mã..."
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
                  <option value="Available">Sẵn sàng</option>
                  <option value="Working">Đang làm việc</option>
                  <option value="Interviewing">Đang phỏng vấn</option>
                  <option value="Unavailable">Tạm nghỉ</option>
                  <option value="Busy">Bận</option>
                </select>
              </div>
            </div>
          </div>

          {/* Talents List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {paginatedTalents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có nhân sự nào phù hợp</p>
                <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm nhân sự mới</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án hiện tại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỹ năng chính</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTalents.map((talent) => (
                        <tr key={talent.talentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {talent.code || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {talent.fullName || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {talent.email || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors[talent.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[talent.status as keyof typeof statusLabels] || talent.status || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <span>{talent.currentProjectName || '—'}</span>
                              {talent.assignmentStartDate && (
                                <span className="text-xs text-gray-400">
                                  Từ {formatDate(talent.assignmentStartDate)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {talent.primarySkills || '—'}
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
                        Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredTalents.length)} trong tổng số {filteredTalents.length} nhân sự
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
