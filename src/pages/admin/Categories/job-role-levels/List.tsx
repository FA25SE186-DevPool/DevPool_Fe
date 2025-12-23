import { useEffect, useState } from "react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { Button } from "../../../../components/ui/button";
import { jobRoleLevelService, type JobRoleLevel } from "../../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../../services/JobRole";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function JobRoleLevelListPage() {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<JobRoleLevel[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<JobRoleLevel[]>([]);

  // Filter & search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<number | "">("");

  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [positionRes, roles] = await Promise.all([
          jobRoleLevelService.getAll({ excludeDeleted: true }) as Promise<JobRoleLevel[]>,
          jobRoleService.getAll({ excludeDeleted: true }) as Promise<JobRole[]>
        ]);

        setPositions(positionRes);
        setFilteredPositions(positionRes);
        setJobRoles(roles);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu vị trí tuyển dụng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter effect
  useEffect(() => {
    let filtered = [...positions];

    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterRole) {
      filtered = filtered.filter(p => p.jobRoleId === Number(filterRole));
    }

    setFilteredPositions(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterRole, positions]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPositions = filteredPositions.slice(startIndex, endIndex);
  const startItem = filteredPositions.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredPositions.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterRole("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Đang tải danh sách vị trí tuyển dụng...
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <div className="flex justify_between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Danh sách Vị trí Tuyển dụng (Job Role Levels)</h1>
            <p className="text-neutral-600 mt-1">Tổng hợp các vị trí tuyển dụng từ các công ty khách hàng.</p>
          </div>
          <Button
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            onClick={() => window.location.href = "/admin/categories/job-role-levels/create"}
          >
            + Tạo vị trí mới
          </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên vị trí..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-xl border border-gray-200"
            value={filterRole}
            onChange={(e) => setFilterRole(Number(e.target.value))}
          >
            <option value="">Tất cả loại vị trí</option>
            {jobRoles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl"
            onClick={handleResetFilters}
          >
            Reset
          </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách vị trí</h2>
              <div className="flex items-center gap-4">
                {filteredPositions.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredPositions.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 vị trí</span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên vị trí</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Loại vị trí</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Cấp độ</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedPositions.map((p, i) => {
                  const role = jobRoles.find(r => r.id === p.jobRoleId);
                  return (
                    <tr key={p.id} className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                          {p.name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-neutral-700">{role?.name ?? "—"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {"Junior,Middle,Senior,Lead".split(",")[p.level] ?? "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          to={`/admin/categories/job-role-levels/${p.id}`}
                          className="group inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <span className="text-sm font-medium">Xem</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
