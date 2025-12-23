import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { certificateTypeService, type CertificateTypeCreate } from "../../../../services/CertificateType";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { 
  ArrowLeft, 
  Save, 
  Award, 
  Tag, 
  AlertCircle, 
  CheckCircle,
  X,
  FileText
} from "lucide-react";

export default function CertificateTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [form, setForm] = useState<CertificateTypeCreate>({
    name: "",
    skillGroupId: undefined,
  });

  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [typeData, groups] = await Promise.all([
          certificateTypeService.getById(Number(id)),
          skillGroupService.getAll({ excludeDeleted: true })
        ]);
        
        setForm({
          name: typeData.name,
          skillGroupId: typeData.skillGroupId,
        });
        setSkillGroups(groups);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        setError("Không thể tải thông tin loại chứng chỉ!");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === "skillGroupId" ? (value ? Number(value) : undefined) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.name.trim()) {
      setError("⚠️ Vui lòng nhập tên loại chứng chỉ.");
      setLoading(false);
      return;
    }

    try {
      await certificateTypeService.update(Number(id), form);
      setSuccess(true);
      setTimeout(() => navigate(`/admin/categories/certificate-types/${id}`), 1500);
    } catch (err) {
      console.error("❌ Error updating Certificate Type:", err);
      setError("Không thể cập nhật loại chứng chỉ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading)
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
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to={`/admin/categories/certificate-types/${id}`}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại chi tiết</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa loại chứng chỉ</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin loại chứng chỉ
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa loại chứng chỉ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin loại chứng chỉ</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tên loại chứng chỉ */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Tên loại chứng chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: AWS Certified Solutions Architect, PMP, CCNA..."
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                />
              </div>

              {/* Nhóm kỹ năng */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Nhóm kỹ năng (Tùy chọn)
                </label>
                <select
                  name="skillGroupId"
                  value={form.skillGroupId ?? ""}
                  onChange={handleChange}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                >
                  <option value="">-- Không chọn nhóm kỹ năng --</option>
                  {skillGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Liên kết loại chứng chỉ với nhóm kỹ năng tương ứng
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {(error || success) && (
            <div className="animate-fade-in">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    Cập nhật loại chứng chỉ thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/admin/categories/certificate-types/${id}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

