import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { industryService, type Industry } from "../../../../services/Industry";
import { 
  Briefcase, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Building2,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export default function IndustryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await industryService.getById(Number(id));
        setIndustry(data);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết lĩnh vực:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndustry();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !industry) return;
    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa lĩnh vực này?");
    if (!confirm) return;

    try {
      await industryService.delete(Number(id));
      alert("✅ Đã xóa lĩnh vực thành công!");
      navigate("/admin/categories/industries");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa lĩnh vực!");
    }
  };

  const handleEdit = () => {
    if (!id) return;
    navigate(`/admin/categories/industries/edit/${id}`);
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

  if (!industry) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy lĩnh vực</p>
            <Link 
              to="/admin/categories/industries"
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
              to="/admin/categories/industries"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{industry.name}</h1>
              <p className="text-neutral-600 mb-4">
                Chi tiết thông tin lĩnh vực
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
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem 
                  label="Tên lĩnh vực" 
                  value={industry.name}
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <InfoItem 
                  label="Mã lĩnh vực" 
                  value={industry.code}
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
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
                  label="Mô tả" 
                  value={industry.description || "Không có mô tả"}
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
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
