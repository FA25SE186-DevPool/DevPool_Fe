import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/sales";
import { Button } from "../../../components/ui/button";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import { Search, Eye, Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function SalesApplyProcessTemplateListPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const sortByNewest = (items: ApplyProcessTemplate[]) => {
    return [...items].sort((a, b) => {
      const getTimestamp = (item: ApplyProcessTemplate) => {
        const createdAt = (item as { createdAt?: string | number | Date | null }).createdAt;
        if (createdAt) {
          return new Date(createdAt).getTime();
        }
        return typeof item.id === "number" ? item.id : 0;
      };

      const diff = getTimestamp(b) - getTimestamp(a);
      if (diff !== 0) return diff;
      return (b.id ?? 0) - (a.id ?? 0);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await applyProcessTemplateService.getAll();
        const sorted = sortByNewest(data);
        setTemplates(sorted);
        setFilteredTemplates(sorted);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách Apply Process Templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...templates];
    if (searchTerm) {
      const normalized = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(normalized) ||
        t.description?.toLowerCase().includes(normalized)
      );
    }
    setFilteredTemplates(filtered);
    setCurrentPage(1);
  }, [searchTerm, templates]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
  const startItem = filteredTemplates.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTemplates.length);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách template...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />
      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Mẫu quy trình ứng tuyển" }
            ]}
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mẫu Quy Trình</h1>
              <p className="text-neutral-600 mt-1">Quản lý các mẫu quy trình tuyển dụng</p>
            </div>
            <Link to="/sales/apply-process-templates/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo mẫu mới
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách template</h2>
              <div className="flex items-center gap-4">
                {filteredTemplates.length > 0 ? (
                  <>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === 1
                          ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm text-neutral-600">
                      {startItem}-{endItem} trong số {filteredTemplates.length}
                    </span>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                        currentPage === totalPages
                          ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-neutral-600">Tổng: 0 template</span>
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
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Mô tả</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có template nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Tạo template mới để bắt đầu</p>
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
                        <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                          {t.name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-neutral-700 line-clamp-2">{t.description || "—"}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/sales/apply-process-templates/${t.id}`}
                            className="group inline-flex items-center gap-1 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-105 transform"
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
