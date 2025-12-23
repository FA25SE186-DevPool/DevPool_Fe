import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { skillService, type Skill } from "../../../../services/Skill";
import { 
  Layers3, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Search,
  X,
  Star
} from "lucide-react";

export default function SkillGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skillGroup, setSkillGroup] = useState<SkillGroup | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Success overlay state
  const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean; type: 'loading' | 'success'; message: string }>({
    show: false,
    type: 'loading',
    message: '',
  });

  const showSuccessOverlay = (message: string) => {
    setLoadingOverlay({
      show: true,
      type: 'success',
      message,
    });
    // Auto hide after 2 seconds
    setTimeout(() => {
      setLoadingOverlay({ show: false, type: 'loading', message: '' });
    }, 2000);
  };

  // Fetch dữ liệu chi tiết
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const [groupData, skillsData] = await Promise.all([
          skillGroupService.getById(Number(id)),
          skillService.getAll({ skillGroupId: Number(id), excludeDeleted: true })
        ]);
        setSkillGroup(groupData);
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết SkillGroup:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xóa skill group
  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa nhóm kỹ năng này?");
    if (!confirmDelete) return;

    try {
      await skillGroupService.delete(Number(id));
      showSuccessOverlay(" Đã xóa nhóm kỹ năng thành công!");
      navigate("/admin/categories/skill-groups");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa nhóm kỹ năng!");
    }
  };

  // Chuyển sang trang edit
  const handleEdit = () => {
    navigate(`/admin/categories/skill-groups/edit/${id}`);
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

  if (!skillGroup) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy nhóm kỹ năng</p>
            <Link 
              to="/admin/categories/skill-groups"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              Quay lại danh sách
            </Link>
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
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/admin/categories/skill-groups"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{skillGroup.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết về nhóm kỹ năng tuyển dụng
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Đang hoạt động
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className="group flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                className="group flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Layers3 className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem 
                  label="Tên nhóm kỹ năng" 
                  value={skillGroup.name}
                  icon={<Layers3 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mô tả" 
                  value={skillGroup.description || "Không có mô tả"}
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Skills List */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200 sticky top-16 bg-white z-20 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Star className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Danh sách kỹ năng ({skills.length})
                  </h2>
                </div>
                <Link
                  to={`/admin/categories/skills/create?skillGroupId=${id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Thêm kỹ năng
                </Link>
              </div>
              
              {/* Search Input */}
              {skills.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm kỹ năng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="p-6">
              {(() => {
                // Filter skills based on search query
                const filteredSkills = searchQuery
                  ? skills.filter(skill =>
                      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                  : skills;

                if (skills.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium mb-2">Chưa có kỹ năng nào</p>
                      <p className="text-neutral-400 text-sm mb-4">Thêm kỹ năng mới vào nhóm này</p>
                      <Link
                        to={`/admin/categories/skills/create?skillGroupId=${id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm kỹ năng đầu tiên
                      </Link>
                    </div>
                  );
                }

                if (filteredSkills.length === 0 && searchQuery) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium mb-2">Không tìm thấy kỹ năng nào</p>
                      <p className="text-neutral-400 text-sm mb-4">Thử tìm kiếm với từ khóa khác</p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                        Xóa bộ lọc
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredSkills.length < skills.length && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Hiển thị {filteredSkills.length} / {skills.length} kỹ năng
                        </p>
                      </div>
                    )}
                    {filteredSkills
                      .sort((a, b) => b.id - a.id) // Sắp xếp theo ID giảm dần (mới nhất trước)
                      .map((skill) => (
                      <div
                        key={skill.id}
                        className="group flex items-center justify-between p-4 bg-neutral-50 hover:bg-primary-50 rounded-lg border border-neutral-200 hover:border-primary-300 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-300">
                            <Star className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                              {skill.name}
                            </h3>
                            {skill.description && (
                              <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                                {skill.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/admin/categories/skills/${skill.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">Xem</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Loading/Success Overlay ở giữa màn hình */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[350px] max-w-[500px]">
            {loadingOverlay.type === 'loading' ? (
              <>
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-700 mb-2">Đang xử lý...</p>
                  <p className="text-neutral-600">{loadingOverlay.message}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-success-200 border-t-success-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-success-700 mb-2">Thành công!</p>
                  <p className="text-neutral-600 whitespace-pre-line">{loadingOverlay.message}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="text-neutral-400 group-hover:text-primary-600 transition-colors duration-300">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
          {label}
        </p>
      </div>
      <p className="text-gray-900 font-semibold text-lg group-hover:text-primary-700 transition-colors duration-300">
        {value}
      </p>
    </div>
  );
}
