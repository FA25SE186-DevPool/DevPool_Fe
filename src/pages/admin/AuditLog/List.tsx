import { useEffect, useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/admin";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter,
  Eye, 
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  XCircle,
  History
} from "lucide-react";
import { auditLogService, type AuditLogModel, type AuditLogFilterModel } from "../../../services/AuditLog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}


function getActionColor(action: string) {
  const colorMap: Record<string, string> = {
    'Create': 'bg-green-100 text-green-700',
    'Update': 'bg-blue-100 text-blue-700',
    'Delete': 'bg-red-100 text-red-700',
    'StatusChange': 'bg-yellow-100 text-yellow-700',
    'TransferOwnership': 'bg-purple-100 text-purple-700'
  };
  return colorMap[action] || 'bg-gray-100 text-gray-700';
}

export default function AuditLogListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Array<{ name: string; id: string }>>([]);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilterModel>({
    pageNumber: 1,
    pageSize: 20,
    excludeDeleted: true
  });

  // Pagination
  const [pagination, setPagination] = useState({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  });

  // Fetch audit logs
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: AuditLogFilterModel = {
        ...filters,
        pageNumber: page,
        pageSize: filters.pageSize || 20
      };

      const result = await auditLogService.getAll(filter);
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("❌ Lỗi khi tải audit logs:", err);
      setError(err.message || "Không thể tải danh sách audit log");
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique user names from all logs
  const fetchUserNames = async () => {
    try {
      // Fetch a large number of logs to get all unique user names
      const result = await auditLogService.getAll({
        pageNumber: 1,
        pageSize: 1000,
        excludeDeleted: true
      });
      
      // Extract unique user names with their IDs
      const userMap = new Map<string, string>();
      result.data.forEach((log: AuditLogModel) => {
        if (log.changedByName && log.changedBy) {
          userMap.set(log.changedByName, log.changedBy);
        } else if (log.changedBy) {
          // If no name, use ID as name
          userMap.set(log.changedBy, log.changedBy);
        }
      });
      
      // Convert to array and sort by name
      const userList = Array.from(userMap.entries())
        .map(([name, id]) => ({ name, id }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setUserNames(userList);
    } catch (err) {
      // Silent fail - không ảnh hưởng đến việc hiển thị logs
    }
  };

  // Fetch user names on mount
  useEffect(() => {
    fetchUserNames();
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs(1); // Reset to page 1 when filters change
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.entityName,
    filters.entityId,
    filters.action,
    filters.changedBy,
    filters.changedAtFrom,
    filters.changedAtTo,
    filters.fieldName,
    filters.metaDataSearch,
    filters.excludeDeleted,
    filters.pageSize
  ]);

  // Fetch logs when page number changes
  useEffect(() => {
    fetchLogs(filters.pageNumber || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.pageNumber]);

  const handleFilterChange = (key: keyof AuditLogFilterModel, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: 1 // Reset về trang đầu khi filter thay đổi
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      pageNumber: 1,
      pageSize: 20,
      excludeDeleted: true
    });
  };

  const handleViewHistory = (entityName: string, entityId: number) => {
    navigate(`/admin/audit-log/${entityName}/${entityId}`);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
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
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nhật ký kiểm toán</h1>
              <p className="text-neutral-600 mt-1">Theo dõi và xem lịch sử thay đổi của hệ thống</p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Tổng số bản ghi</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.totalCount}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Trang hiện tại</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {pagination.pageNumber} / {pagination.totalPages}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Bản ghi/trang</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.pageSize}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <History className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên thực thể, hành động..."
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.entityName || ''}
                  onChange={(e) => handleFilterChange('entityName', e.target.value || undefined)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-neutral-200 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-all"
              >
                <Filter className="w-5 h-5" />
                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tên thực thể</label>
                    <input
                      type="text"
                      placeholder="VD: JobRequest, TalentApplication"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.entityName || ''}
                      onChange={(e) => handleFilterChange('entityName', e.target.value || undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">ID thực thể</label>
                    <input
                      type="number"
                      placeholder="ID của thực thể"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.entityId || ''}
                      onChange={(e) => handleFilterChange('entityId', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Hành động</label>
                    <select
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.action || ''}
                      onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                    >
                      <option value="">Tất cả</option>
                      <option value="Create">Tạo mới</option>
                      <option value="Update">Cập nhật</option>
                      <option value="Delete">Xóa</option>
                      <option value="StatusChange">Thay đổi trạng thái</option>
                      <option value="TransferOwnership">Chuyển quyền sở hữu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Người thay đổi</label>
                    <select
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.changedBy || ''}
                      onChange={(e) => handleFilterChange('changedBy', e.target.value || undefined)}
                    >
                      <option value="">Tất cả</option>
                      {userNames.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Từ ngày</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.changedAtFrom ? new Date(filters.changedAtFrom).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleFilterChange('changedAtFrom', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Đến ngày</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.changedAtTo ? new Date(filters.changedAtTo).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleFilterChange('changedAtTo', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Số bản ghi/trang</label>
                    <select
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={filters.pageSize || 20}
                      onChange={(e) => handleFilterChange('pageSize', parseInt(e.target.value))}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleResetFilters}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all"
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => fetchLogs(filters.pageNumber || 1)}
              className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-soft overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Thực thể</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Trường</th>
                  <th className="px-4 py-3">Người thay đổi</th>
                  <th className="px-4 py-3">Giá trị cũ</th>
                  <th className="px-4 py-3">Giá trị mới</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      Không có audit log nào.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {formatDate(log.changedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{log.entityName}</div>
                        <div className="text-sm text-gray-500">ID: {log.entityId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.fieldName || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.changedByName || log.changedBy || '—'}
                            </div>
                            {log.changedBy && log.changedByName && (
                              <div className="text-xs text-gray-500">{log.changedBy}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={log.oldValue || undefined}>
                          {log.oldValue || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={log.newValue || undefined}>
                          {log.newValue || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewHistory(log.entityName, log.entityId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Xem lịch sử"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong {pagination.totalCount} bản ghi
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('pageNumber', 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Đầu
              </button>
              <button
                onClick={() => handleFilterChange('pageNumber', (filters.pageNumber || 1) - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                Trang {pagination.pageNumber} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handleFilterChange('pageNumber', (filters.pageNumber || 1) + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFilterChange('pageNumber', pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Cuối
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

