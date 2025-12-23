import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { skillService, type Skill } from "../../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  X,
  Star
} from "lucide-react";

export default function SkillEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [formData, setFormData] = useState<{
    skillGroupId: number;
    name: string;
    description?: string;
    isMandatory: boolean;
  }>({
    skillGroupId: 0,
    name: "",
    description: "",
    isMandatory: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 🧭 Load dữ liệu Skill và SkillGroups
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        
        // Load skill groups
        const groupsData = await skillGroupService.getAll();
        setSkillGroups(groupsData);
        
        // Load skill data
        const data = await skillService.getById(Number(id));
        setSkill(data);
        setFormData({
          skillGroupId: data.skillGroupId,
          name: data.name,
          description: data.description ?? "",
          isMandatory: data.isMandatory ?? false,
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin kỹ năng!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ✍️ Handle change form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "skillGroupId"
          ? Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  // 💾 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    if (!formData.name.trim()) {
      setError("⚠️ Vui lòng nhập tên kỹ năng!");
      setSaving(false);
      return;
    }

    if (!formData.skillGroupId || formData.skillGroupId === 0) {
      setError("⚠️ Vui lòng chọn nhóm kỹ năng!");
      setSaving(false);
      return;
    }

    try {
      const payload = { ...formData };
      await skillService.update(Number(id), payload);
      setSuccess(true);
      setTimeout(() => navigate(`/admin/categories/skills/${id}`), 1500);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      setError("Không thể cập nhật kỹ năng. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
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
            <Link 
              to={`/admin/categories/skills/${id}`}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại chi tiết</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa kỹ năng</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin kỹ năng tuyển dụng
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-50 border border-warning-200">
                <Star className="w-4 h-4 text-warning-600" />
                <span className="text-sm font-medium text-warning-800">
                  Chỉnh sửa: {skill.name}
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
                  <Star className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin kỹ năng</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Nhóm kỹ năng */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Nhóm kỹ năng <span className="text-red-500">*</span>
                </label>
                <select
                  name="skillGroupId"
                  value={formData.skillGroupId}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                >
                  <option value={0}>Chọn nhóm kỹ năng</option>
                  {skillGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên kỹ năng */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Tên kỹ năng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder="Nhập tên kỹ năng"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                  placeholder="Nhập mô tả (tùy chọn)"
                />
              </div>

              {/* Bắt buộc */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-1">
                  <input
                    type="checkbox"
                    name="isMandatory"
                    checked={formData.isMandatory}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span>Kỹ năng bắt buộc cho các job thuộc nhóm này</span>
                </label>
                <p className="text-xs text-neutral-500 ml-6">
                  Ảnh hưởng tới logic kiểm tra kỹ năng bắt buộc khi verify nhóm kỹ năng cho Talent.
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
                    Cập nhật kỹ năng thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/admin/categories/skills/${id}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
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
