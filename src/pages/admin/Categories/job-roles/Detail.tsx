import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { jobRoleService, type JobRole } from "../../../../services/JobRole";
import { jobRoleLevelService, type JobRoleLevel } from "../../../../services/JobRoleLevel";
import { 
  Layers3, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Target,
  Plus,
  Eye
} from "lucide-react";

export default function JobRoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu chi tiết
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const [roleData, levelsData] = await Promise.all([
          jobRoleService.getById(Number(id)),
          jobRoleLevelService.getAll({ jobRoleId: Number(id), excludeDeleted: true })
        ]);
        setJobRole(roleData);
        setJobRoleLevels(Array.isArray(levelsData) ? levelsData : []);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết JobRole:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xóa position type
  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa loại vị trí này?");
    if (!confirmDelete) return;

    try {
      await jobRoleService.delete(Number(id));
      alert("✅ Đã xóa loại vị trí thành công!");
      navigate("/admin/categories/job-roles");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa loại vị trí!");
    }
  };

  // Chuyển sang trang edit
  const handleEdit = () => {
    navigate(`/admin/categories/job-roles/edit/${id}`);
  };

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

  if (!jobRole) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy loại vị trí</p>
            <Link 
              to="/admin/categories/job-roles"
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
              to="/admin/categories/job-roles"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobRole.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết về loại vị trí tuyển dụng
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
                  label="Tên loại vị trí" 
                  value={jobRole.name}
                  icon={<Layers3 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mô tả" 
                  value={jobRole.description || "Không có mô tả"}
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Job Role Levels List */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Target className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Danh sách vị trí tuyển dụng ({jobRoleLevels.length})
                  </h2>
                </div>
                <Link
                  to={`/admin/categories/job-role-levels/create?jobRoleId=${id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Thêm vị trí tuyển dụng
                </Link>
              </div>
            </div>
            <div className="p-6">
              {jobRoleLevels.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium mb-2">Chưa có vị trí tuyển dụng nào</p>
                  <p className="text-neutral-400 text-sm mb-4">Thêm vị trí tuyển dụng mới vào loại vị trí này</p>
                  <Link
                    to={`/admin/categories/job-role-levels/create?jobRoleId=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm vị trí đầu tiên
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobRoleLevels
                    .sort((a, b) => b.id - a.id) // Sắp xếp theo ID giảm dần (mới nhất trước)
                    .map((level) => {
                    const levelNames = ['Junior', 'Middle', 'Senior', 'Lead'];
                    const levelName = levelNames[level.level] || 'Unknown';
                    return (
                      <div
                        key={level.id}
                        className="group flex items-center justify-between p-4 bg-neutral-50 hover:bg-primary-50 rounded-lg border border-neutral-200 hover:border-primary-300 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-300">
                            <Target className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                              {level.name} - {levelName}
                            </h3>
                            {level.description && (
                              <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                                {level.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/admin/categories/job-role-levels/${level.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-all duration-300 hover:scale-105 transform"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">Xem</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
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
