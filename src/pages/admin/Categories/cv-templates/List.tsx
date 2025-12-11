import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { Button } from "../../../../components/ui/button";
import { cvTemplateService, type CVTemplate } from "../../../../services/CVTemplate";
import { 
  Search, 
  Filter, 
  Eye, 
  Plus, 
  FileText,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function CVTemplateListPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CVTemplate[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDefault, setFilterDefault] = useState<string>("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Stats data
  const stats = [
    {
      title: 'Tổng Templates',
      value: templates.length.toString(),
      change: '+8 tháng này',
      trend: 'up',
      color: 'blue',
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'Mẫu Mặc Định',
      value: templates.filter(t => t.isDefault).length.toString(),
      change: '+2 tháng này',
      trend: 'up',
      color: 'green',
      icon: <Star className="w-6 h-6" />
    },
    {
      title: 'Mẫu Tùy Chỉnh',
      value: templates.filter(t => !t.isDefault).length.toString(),
      change: '+6 tháng này',
      trend: 'up',
      color: 'orange',
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'Đang Hoạt Động',
      value: templates.filter(t => !t.isDeleted).length.toString(),
      change: 'Tổng số active',
      trend: 'up',
      color: 'purple',
      icon: <Calendar className="w-6 h-6" />
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const templatesRes = await cvTemplateService.getAll({ excludeDeleted: true });
        setTemplates(templatesRes);
        setFilteredTemplates(templatesRes);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách CV Templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...templates];
    if (searchTerm) filtered = filtered.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterDefault === "true") filtered = filtered.filter((t) => t.isDefault);
    if (filterDefault === "false") filtered = filtered.filter((t) => !t.isDefault);
    setFilteredTemplates(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterDefault, templates]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
  const startItem = filteredTemplates.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTemplates.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterDefault("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  if (loading)
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

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Danh mục" , to: "/admin/categories" },
              { label: "Mẫu CV" }
            ]}
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mẫu CV (CV Templates)</h1>
              <p className="text-neutral-600 mt-1">Quản lý các mẫu CV trong hệ thống</p>
            </div>
            <Link to="/admin/categories/cv-templates/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo template mới
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            {stats.map((stat, index) => (
              <div key={index} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color === 'blue' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                      stat.color === 'green' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                        stat.color === 'purple' ? 'bg-accent-100 text-accent-600 group-hover:bg-accent-200' :
                          'bg-warning-100 text-warning-600 group-hover:bg-warning-200'
                    } transition-all duration-300`}>
                    {stat.icon}
                  </div>
                </div>               
              </div>
            ))}
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
                  placeholder="Tìm kiếm theo tên template..."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <select
                      value={filterDefault}
                      onChange={(e) => setFilterDefault(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="true">Mẫu mặc định</option>
                      <option value="false">Mẫu tùy chỉnh</option>
                    </select>
                  </div>
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
          <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách Mẫu CV</h2>
              <div className="flex items-center gap-4">
                {filteredTemplates.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredTemplates.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 templates</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên Template</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">File Path</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mặc Định</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ngày Tạo</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có template nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo template mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTemplates.map((t, i) => (
                    <tr
                      key={t.id}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            {t.name}
                          </span>
                          {t.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-neutral-600 font-mono bg-neutral-100 px-2 py-1 rounded">
                          {t.templateFilePath}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {t.isDefault ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Mặc định
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Tùy chỉnh
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{formatDate(t.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          to={`/admin/categories/cv-templates/${t.id}`}
                          className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-medium">Xem</span>
                        </Link>
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

