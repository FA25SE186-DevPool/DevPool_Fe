import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { certificateTypeService, type CertificateType } from "../../../../services/CertificateType";
import { skillGroupService } from "../../../../services/SkillGroup";
import { Button } from "../../../../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Award, 
  Tag, 
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";

interface CertificateTypeDetail extends CertificateType {
  skillGroupName?: string;
}

export default function CertificateTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [certificateType, setCertificateType] = useState<CertificateTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const typeData = await certificateTypeService.getById(Number(id));

        let skillGroupName = "—";
        if (typeData.skillGroupId) {
          try {
            const group = await skillGroupService.getById(typeData.skillGroupId);
            skillGroupName = group?.name ?? "—";
          } catch {
            skillGroupName = "—";
          }
        }

        setCertificateType({
          ...typeData,
          skillGroupName,
        });
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết Certificate Type:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa loại chứng chỉ này?");
    if (!confirm) return;

    try {
      await certificateTypeService.deleteById(Number(id));
      alert("Đã xóa loại chứng chỉ thành công!");
      navigate("/admin/categories/certificate-types");
    } catch (err: any) {
      // Handle InvalidOperationException from backend
      // Check if this is a business logic error with message
      const isInvalidOperationException =
        (err?.response?.status === 409 || err?.response?.status === 400) &&
        err?.response?.data?.title?.includes("InvalidOperationException") ||
        (err?.statusCode === 409 || err?.statusCode === 400) &&
        err?.errorType === "InvalidOperationException" ||
        (err?.success === false && err?.message); // Direct error object with message

      if (isInvalidOperationException) {
        const errorMessage =
          err?.message ||
          err?.response?.data?.detail ||
          "Không thể xóa loại chứng chỉ này vì đang được sử dụng bởi các talent.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      // Log error for unhandled cases
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa loại chứng chỉ!");
    }
  };

  const handleEdit = () => {
    navigate(`/admin/categories/certificate-types/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu loại chứng chỉ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!certificateType) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy loại chứng chỉ</p>
            <Link 
              to="/admin/categories/certificate-types"
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
              to="/admin/categories/certificate-types"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{certificateType.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết loại chứng chỉ
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
                label="Tên loại chứng chỉ" 
                value={certificateType.name} 
                icon={<Award className="w-4 h-4" />}
              />
              <InfoItem 
                label="Nhóm kỹ năng" 
                value={certificateType.skillGroupName ?? "Không có"} 
                icon={<Tag className="w-4 h-4" />}
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
              <h3 className="text-lg font-semibold text-gray-900">Thông tin bổ sung</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Loại chứng chỉ <span className="font-semibold text-primary-700">{certificateType.name}</span> được sử dụng để phân loại và quản lý các chứng chỉ của talent trong hệ thống.
                {certificateType.skillGroupId && (
                  <> Loại này thuộc nhóm kỹ năng <span className="font-semibold text-secondary-700">{certificateType.skillGroupName}</span>.</>
                )}
              </p>
              {!certificateType.skillGroupId && (
                <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg mt-4 border border-yellow-200">
                  ⚠️ Loại chứng chỉ này chưa được gán vào nhóm kỹ năng nào. Bạn có thể cập nhật thông tin này bằng cách nhấn nút "Sửa" ở trên.
                </p>
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
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}

