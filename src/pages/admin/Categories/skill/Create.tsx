import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import {  
  ArrowLeft, 
  Plus, 
  Save, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  X,
  Star
} from "lucide-react";
import { type SkillCreate, skillService } from "../../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../../services/SkillGroup";

export default function SkillCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);

  // Lấy skillGroupId từ query string nếu có
  const skillGroupIdFromQuery = searchParams.get('skillGroupId');
  const initialSkillGroupId = skillGroupIdFromQuery ? Number(skillGroupIdFromQuery) : 0;

  const [form, setForm] = useState<SkillCreate>({
    skillGroupId: initialSkillGroupId,
    name: "",
    description: "",
    isMandatory: false,
  });

  // Load skill groups
  useEffect(() => {
    const loadSkillGroups = async () => {
      try {
        const data = await skillGroupService.getAll();
        setSkillGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách nhóm kỹ năng:", err);
      }
    };
    loadSkillGroups();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "skillGroupId"
          ? Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo kỹ năng mới không?");
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.name.trim()) {
      setError("⚠️ Vui lòng nhập tên kỹ năng.");
      setLoading(false);
      return;
    }

    if (!form.skillGroupId || form.skillGroupId === 0) {
      setError("⚠️ Vui lòng chọn nhóm kỹ năng.");
      setLoading(false);
      return;
    }

    try {
      await skillService.create(form);
      setSuccess(true);
      // Nếu có skillGroupId từ query, quay lại trang detail của skill group
      if (skillGroupIdFromQuery) {
        setTimeout(() => navigate(`/admin/categories/skill-groups/${skillGroupIdFromQuery}`), 1500);
      } else {
        setTimeout(() => navigate("/admin/categories/skill-groups"), 1500);
      }
    } catch (err) {
      console.error("❌ Lỗi khi tạo kỹ năng:", err);
      setError("Không thể tạo kỹ năng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to={skillGroupIdFromQuery ? `/admin/categories/skill-groups/${skillGroupIdFromQuery}` : "/admin/categories/skill-groups"}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo kỹ năng mới</h1>
              <p className="text-neutral-600 mb-4">
                Định nghĩa kỹ năng tuyển dụng trong hệ thống DevPool
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Tạo kỹ năng mới
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
                  value={form.skillGroupId}
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
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder="Nhập tên kỹ năng (VD: React, Node.js, Python...)"
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
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                  placeholder="Nhập mô tả chi tiết về kỹ năng (tùy chọn)"
                />
              </div>

              {/* Bắt buộc */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-1">
                  <input
                    type="checkbox"
                    name="isMandatory"
                    checked={form.isMandatory}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span>Kỹ năng bắt buộc cho các job thuộc nhóm này</span>
                </label>
                <p className="text-xs text-neutral-500 ml-6">
                  Nếu bật, BE có thể dùng để kiểm tra bắt buộc khi verify nhóm kỹ năng cho Talent.
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
                    Tạo kỹ năng thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={skillGroupIdFromQuery ? `/admin/categories/skill-groups/${skillGroupIdFromQuery}` : "/admin/categories/skill-groups"}
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
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo kỹ năng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
