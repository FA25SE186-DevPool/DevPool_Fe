import { useEffect, useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import {
  Search,
  Filter,
  Plus,
  Building2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Phone,
  X,
  Users,
  Mail
} from "lucide-react";

export default function ClientCompanyListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<ClientCompany[]>([]);

  // Filter & search
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTaxCode, setFilterTaxCode] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;


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
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterTaxCode) {
      filtered = filtered.filter((c) =>
        c.taxCode?.toLowerCase().includes(filterTaxCode.toLowerCase())
      );
    }
    if (filterPhone) {
      filtered = filtered.filter((c) =>
        c.phone?.toLowerCase().includes(filterPhone.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterTaxCode, filterPhone, companies]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);
  const startItem = filteredCompanies.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredCompanies.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterTaxCode("");
    setFilterPhone("");
  };

  const hasActiveFilters = Boolean(searchTerm || filterTaxCode || filterPhone);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
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
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Công ty</h1>
              <p className="text-neutral-600 mt-1">Quản lý và theo dõi các công ty khách hàng</p>
            </div>
            <Link to="/sales/clients/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo công ty mới
              </Button>
            </Link>
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
                  placeholder="Tìm kiếm theo mã công ty, tên công ty, email..."
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
                {hasActiveFilters && (
                  <span className="ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-700 text-white shadow-sm">
                    {[searchTerm, filterTaxCode, filterPhone].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <Button onClick={handleResetFilters} variant="outline" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Mã số thuế"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterTaxCode}
                      onChange={(e) => setFilterTaxCode(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterPhone}
                      onChange={(e) => setFilterPhone(e.target.value)}
                    />
                  </div>
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
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mã số thuế</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Người đại diện</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có công ty nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo công ty mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/sales/clients/${c.id}`)}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer"
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
                        <span className="text-sm text-neutral-700">
                          {c.taxCode || "—"}
                        </span>
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
