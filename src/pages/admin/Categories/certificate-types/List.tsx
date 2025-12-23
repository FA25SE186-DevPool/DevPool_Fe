import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { Button } from "../../../../components/ui/button";
import { certificateTypeService, type CertificateType } from "../../../../services/CertificateType";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { 
  Search, 
  Filter, 
  Eye, 
  Plus, 
  Award,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type AugmentedCertificateType = CertificateType & {
  skillGroupName: string;
};

export default function CertificateTypeListPage() {
  const [loading, setLoading] = useState(true);
  const [certificateTypes, setCertificateTypes] = useState<AugmentedCertificateType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<AugmentedCertificateType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkillGroup, setFilterSkillGroup] = useState("");
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Stats data
  const stats = [
    {
      title: 'Tổng Loại Chứng Chỉ',
      value: certificateTypes.length.toString(),
      color: 'blue',
      icon: <Award className="w-6 h-6" />
    },
    {
      title: 'Có Nhóm Kỹ Năng',
      value: certificateTypes.filter(t => t.skillGroupId).length.toString(),
      color: 'green',
      icon: <Tag className="w-6 h-6" />
    },
    {
      title: 'Không Có Nhóm',
      value: certificateTypes.filter(t => !t.skillGroupId).length.toString(),
      color: 'orange',
      icon: <Award className="w-6 h-6" />
    },
    {
      title: 'Nhóm Kỹ Năng',
      value: skillGroups.length.toString(),
      color: 'purple',
      icon: <Tag className="w-6 h-6" />
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesRes, groupsRes] = await Promise.all([
          certificateTypeService.getAll({ excludeDeleted: true }) as Promise<CertificateType[]>,
          skillGroupService.getAll({ excludeDeleted: true }) as Promise<SkillGroup[]>,
        ]);

        const groupDict: Record<number, string> = {};
        groupsRes.forEach((g) => (groupDict[g.id] = g.name));
        setSkillGroups(groupsRes);

        const merged: AugmentedCertificateType[] = typesRes.map((t) => ({
          ...t,
          skillGroupName: t.skillGroupId ? (groupDict[t.skillGroupId] ?? "—") : "—",
        }));

        setCertificateTypes(merged);
        setFilteredTypes(merged);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách Certificate Types:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...certificateTypes];
    if (searchTerm) filtered = filtered.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterSkillGroup) filtered = filtered.filter((t) => t.skillGroupName.toLowerCase().includes(filterSkillGroup.toLowerCase()));
    setFilteredTypes(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
  }, [searchTerm, filterSkillGroup, certificateTypes]);
  
  // Tính toán pagination
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTypes = filteredTypes.slice(startIndex, endIndex);
  const startItem = filteredTypes.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredTypes.length);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterSkillGroup("");
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Loại Chứng Chỉ (Certificate Types)</h1>
              <p className="text-neutral-600 mt-1">Quản lý các loại chứng chỉ trong hệ thống</p>
            </div>
            <Link to="/admin/categories/certificate-types/create">
              <Button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Tạo loại chứng chỉ mới
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
                  placeholder="Tìm kiếm theo tên loại chứng chỉ..."
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
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Nhóm kỹ năng"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                      value={filterSkillGroup}
                      onChange={(e) => setFilterSkillGroup(e.target.value)}
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
          <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white z-20 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách loại chứng chỉ</h2>
              <div className="flex items-center gap-4">
                {filteredTypes.length > 0 ? (
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
                      {startItem}-{endItem} trong số {filteredTypes.length}
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
                  <span className="text-sm text-neutral-600">Tổng: 0 loại</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">#</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Tên Loại Chứng Chỉ</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Nhóm Kỹ Năng</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                          <Award className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">Không có loại chứng chỉ nào</p>
                        <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo loại mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTypes.map((t, i) => (
                    <tr
                      key={t.id}
                      className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                            {t.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{t.skillGroupName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/categories/certificate-types/${t.id}`}
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

