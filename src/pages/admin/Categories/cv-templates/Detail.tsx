import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { cvTemplateService, type CVTemplate } from "../../../../services/CVTemplate";
import { Button } from "../../../../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Link as LinkIcon,
  Star,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function CVTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<CVTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const templateData = await cvTemplateService.getById(Number(id));
        setTemplate(templateData);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết CV Template:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa CV Template này?");
    if (!confirm) return;

    try {
      await cvTemplateService.delete(Number(id));
      alert("✅ Đã xóa CV Template thành công!");
      navigate("/admin/categories/cv-templates");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa CV Template!");
    }
  };

  const handleEdit = () => {
    navigate(`/admin/categories/cv-templates/edit/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu CV Template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy CV Template</p>
            <Link 
              to="/admin/categories/cv-templates"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
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
              to="/admin/categories/cv-templates"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
                {template.isDefault && (
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết CV Template
              </p>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                template.isDeleted 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                {template.isDeleted ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Đã xóa</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Đang hoạt động</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                className="group flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Thông tin chung */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Thông tin chi tiết</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem 
                label="Tên template" 
                value={template.name} 
                icon={<FileText className="w-4 h-4" />}
              />
              <InfoItem 
                label="Đường dẫn file" 
                value={template.templateFilePath} 
                icon={<LinkIcon className="w-4 h-4" />}
              />
              <InfoItem 
                label="Loại template" 
                value={template.isDefault ? "Mẫu mặc định ⭐" : "Mẫu tùy chỉnh"} 
                icon={<Star className="w-4 h-4" />}
              />
              <InfoItem 
                label="Ngày tạo" 
                value={formatDate(template.createdAt)} 
                icon={<Calendar className="w-4 h-4" />}
              />
              <InfoItem 
                label="Cập nhật lần cuối" 
                value={template.updatedAt ? formatDate(template.updatedAt) : "Chưa cập nhật"} 
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <FileText className="w-5 h-5 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Mô tả</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              {template.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {template.description}
                </p>
              ) : (
                <p className="text-neutral-500 italic">
                  Chưa có mô tả cho template này.
                </p>
              )}
            </div>
            {template.isDefault && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  Template này là mẫu mặc định và sẽ được sử dụng tự động khi tạo CV mới.
                </p>
              </div>
            )}
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
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}

