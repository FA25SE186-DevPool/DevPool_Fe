import { useEffect, useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/manager";
import { Link } from "react-router-dom";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import {
  Search,
  Filter,
  Eye,
  Building2,
  TrendingUp,
  Mail,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from "lucide-react";

export default function ManagerClientCompanyListPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<ClientCompany[]>([]);

  // Filter & search
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterContactPerson, setFilterContactPerson] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Stats data
  const stats = [
    {
      title: 'Tổng Công Ty',
      value: companies.length.toString(),
      color: 'blue',
      icon: <Building2 className="w-6 h-6" />
    },
    {
      title: 'Đang Hoạt Động',
      value: companies.filter(c => !c.isDeleted).length.toString(),
      color: 'green',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: 'Có Thông Tin Đầy Đủ',
      value: companies.filter(c => c.taxCode && c.address && c.phone).length.toString(),
      color: 'purple',
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Tỷ Lệ Hoàn Thiện',
      value: `${Math.round((companies.filter(c => c.taxCode && c.address && c.phone).length / Math.max(companies.length, 1)) * 100)}%`,
      color: 'orange',
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await clientCompanyService.getAll();
        
        // Ensure data is an array - handle PagedResult with Items/items or direct array
        const companiesArray = ensureArray<ClientCompany>(res);
        
        // Sắp xếp công ty: mới nhất lên đầu (theo createdAt hoặc id)
        const sortedCompanies = [...companiesArray].sort((a, b) => {
          const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          if (dateA !== 0 || dateB !== 0) {
            return dateB - dateA; // Mới nhất lên đầu
          }
          return b.id - a.id; // Nếu không có createdAt, sắp xếp theo id giảm dần
        });
        
        setCompanies(sortedCompanies);
        setFilteredCompanies(sortedCompanies);
      } catch (err) {
        console.error("❌ Lỗi khi load danh sách công ty:", err);
        setCompanies([]);
        setFilteredCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = [...companies];

    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterEmail) {
      filtered = filtered.filter((c) =>
        c.email.toLowerCase().includes(filterEmail.toLowerCase())
      );
    }
    if (filterContactPerson) {
      filtered = filtered.filter((c) =>
        c.contactPerson.toLowerCase().includes(filterContactPerson.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterEmail, filterContactPerson, companies]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);
  const startItem = filteredCompanies.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredCompanies.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterEmail("");
    setFilterContactPerson("");
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
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
      <Sidebar items={sidebarItems} title="Manager" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Công ty khách hàng" }
            ]}
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Công ty khách hàng</h1>
              <p className="text-neutral-600 mt-1">Quản lý và theo dõi các công ty khách hàng</p>
            </div>
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
                  placeholder="Tìm kiếm theo tên công ty, email, người đại diện..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Email công ty"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterEmail}
                      onChange={(e) => setFilterEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Người đại diện"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterContactPerson}
                      onChange={(e) => setFilterContactPerson(e.target.value)}
                    />
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
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách công ty</h2>
              <div className="flex items-center gap-4">
                {filteredCompanies.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${currentPage === 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredCompanies.length}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${currentPage === totalPages
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 công ty</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã công ty</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên công ty</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Người đại diện</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</th>
                  <th className="py-4 px-4 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-4 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có công ty nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((c, i) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            {c.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{c.contactPerson}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700 truncate max-w-xs">{c.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.isDeleted ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                          {c.isDeleted ? "Đã xóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link
                          to={`/manager/client-companies/${c.id}`}
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

