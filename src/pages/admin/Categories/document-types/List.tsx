import { useEffect, useState } from "react";
import Sidebar from "../../../../components/common/Sidebar";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import { 
  Search, 
  Plus, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function DocumentTypeListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DocumentType[]>([]);
  const [filtered, setFiltered] = useState<DocumentType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const statsPageSize = 4;
  const [statsStartIndex, setStatsStartIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await documentTypeService.getAll({ excludeDeleted: true });
        const list = data?.items ?? data ?? [];
        setItems(list);
        setFiltered(list);
      } catch (err) {
        console.error("Lỗi khi tải DocumentType:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(items);
      setCurrentPage(1);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFiltered(items.filter(x => x.typeName.toLowerCase().includes(term)));
    setCurrentPage(1);
  }, [searchTerm, items]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);
  const startItem = filtered.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filtered.length);

  const stats = [
    {
      title: 'Tổng Loại Tài Liệu',
      value: items.length.toString(),
      color: 'blue',
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'Có Mô Tả',
      value: items.filter(x => x.description).length.toString(),
      color: 'green',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: 'Chưa Có Mô Tả',
      value: items.filter(x => !x.description).length.toString(),
      color: 'orange',
      icon: <XCircle className="w-6 h-6" />
    }
  ];

  const statsSlice = stats.slice(statsStartIndex, Math.min(statsStartIndex + statsPageSize, stats.length));
  const canShowStatsNav = stats.length > statsPageSize;
  const canGoPrev = canShowStatsNav && statsStartIndex > 0;
  const canGoNext = canShowStatsNav && statsStartIndex + statsPageSize < stats.length;

  const handlePrevStats = () => {
    setStatsStartIndex(prev => Math.max(0, prev - statsPageSize));
  };

  const handleNextStats = () => {
    setStatsStartIndex(prev => {
      const maxIndex = Math.max(0, stats.length - statsPageSize);
      return Math.min(maxIndex, prev + statsPageSize);
    });
  };

  useEffect(() => {
    const maxIndex = Math.max(0, stats.length - statsPageSize);
    setStatsStartIndex(prev => Math.min(prev, maxIndex));
  }, [stats.length]);

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  if (loading) {
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
          <Breadcrumb
            items={[
              { label: "Danh mục" , to: "/admin/categories" },
              { label: "Loại tài liệu" }
            ]}
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Loại tài liệu (Document Types)</h1>
              <p className="text-neutral-600 mt-1">Quản lý các loại tài liệu: Work Report, Invoice, Bill...</p>
            </div>
            <Link to="/admin/categories/document-types/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span>Tạo loại tài liệu</span>
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 animate-fade-in">
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsSlice.map((stat, index) => (
                  <div key={`${stat.title}-${statsStartIndex + index}`} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${
                        stat.color === 'blue'
                          ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                          : stat.color === 'green'
                          ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                          : stat.color === 'purple'
                          ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200'
                          : stat.color === 'red'
                          ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                          : stat.color === 'gray'
                          ? 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                          : 'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                      } transition-all duration-300`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {canShowStatsNav && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevStats}
                    disabled={!canGoPrev}
                    className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      canGoPrev
                        ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                        : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    }`}
                    aria-label="Xem thống kê phía trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStats}
                    disabled={!canGoNext}
                    className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      canGoNext
                        ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                        : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    }`}
                    aria-label="Xem thống kê tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {canShowStatsNav && (
              <div className="mt-3 flex justify-end text-xs text-neutral-500 lg:hidden">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStats}
                    disabled={!canGoPrev}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoPrev
                        ? 'bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    }`}
                    aria-label="Xem thống kê phía trước"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStats}
                    disabled={!canGoNext}
                    className={`rounded-full border px-3 py-1 transition-all duration-300 ${
                      canGoNext
                        ? 'bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-300'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                    }`}
                    aria-label="Xem thống kê tiếp theo"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên loại tài liệu..."
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
              >
                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}</span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleResetFilters}
                    className="group flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 transform"
                  >
                    <span className="font-medium">Đặt lại</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách loại tài liệu</h2>
              <div className="flex items-center gap-4">
                {filtered.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filtered.length}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === totalPages
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mô tả</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có loại tài liệu nào phù hợp</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo loại tài liệu mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((x, idx) => (
                    <tr
                      key={x.id}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                          {x.typeName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-700">{x.description || "—"}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/categories/document-types/${x.id}`}
                            className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm font-medium">Xem</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
