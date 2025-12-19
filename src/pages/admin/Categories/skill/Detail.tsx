import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { skillService, type Skill } from "../../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { masterDataService } from "../../../../services/MasterData";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Building2,
  AlertCircle,
  CheckCircle,
  Star
} from "lucide-react";

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillGroup, setSkillGroup] = useState<SkillGroup | null>(null);
  const [loading, setLoading] = useState(true);

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
        const data = await skillService.getById(Number(id));
        setSkill(data);
        
        // Fetch skill group info
        if (data.skillGroupId) {
          const groupData = await skillGroupService.getById(data.skillGroupId);
          setSkillGroup(groupData);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết Skill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xóa skill
  const handleDelete = async () => {
    if (!id || !skill) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa kỹ năng này?");
    if (!confirmDelete) return;

    try {
      // Check can-delete rule from BE (Master Data)
      try {
        const check = await masterDataService.checkSkillCanDelete(Number(id));
        if (check && check.canDelete === false) {
          const details = check.usageDetails ? `\n\n${check.usageDetails}` : "";
          alert((check.message || "Skill đang được sử dụng và không thể xóa.") + details);
          return;
        }
      } catch (checkErr) {
        // Nếu không check được thì vẫn thử delete (BE sẽ chặn nếu cần)
        console.warn("⚠️ Không thể kiểm tra can-delete, sẽ thử xóa trực tiếp:", checkErr);
      }

      await skillService.delete(Number(id));
      showSuccessOverlay("✅ Đã xóa kỹ năng thành công!");
      // Quay về trang chi tiết skill group nếu có, nếu không thì về danh sách skills
      if (skill.skillGroupId) {
        navigate(`/admin/categories/skill-groups/${skill.skillGroupId}`);
      } else {
        navigate("/admin/categories/skills");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa kỹ năng!");
    }
  };

  // Chuyển sang trang edit
  const handleEdit = () => {
    navigate(`/admin/categories/skills/edit/${id}`);
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

  if (!skill) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy kỹ năng</p>
            <Link 
              to="/admin/categories/skills"
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
            {skill.skillGroupId ? (
              <Link 
                to={`/admin/categories/skill-groups/${skill.skillGroupId}`}
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại nhóm kỹ năng</span>
              </Link>
            ) : (
              <Link 
                to="/admin/categories/skills"
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại danh sách</span>
              </Link>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{skill.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết về kỹ năng tuyển dụng
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
                  <Star className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem 
                  label="Tên kỹ năng" 
                  value={skill.name}
                  icon={<Star className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Nhóm kỹ năng" 
                  value={skillGroup?.name || "Không xác định"}
                  icon={<Building2 className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Bắt buộc" 
                  value={skill.isMandatory ? "Có" : "Không"}
                  icon={<CheckCircle className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mô tả" 
                  value={skill.description || "Không có mô tả"}
                  icon={<FileText className="w-4 h-4" />}
                />            
              </div>
            </div>
          </div>

          {/* Additional Information
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-secondary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin bổ sung</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem 
                  label="ID Nhóm kỹ năng" 
                  value={skill.skillGroupId.toString()}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Trạng thái" 
                  value="Đang hoạt động"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              </div>
            </div>
          </div> */}
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
