import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentProjectService, type TalentProjectCreate } from "../../../services/TalentProject";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { 
  Save, 
  X, 
  Briefcase, 
  Target, 
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function TalentProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentProjectCreate>({
    talentId: 0,
    talentCVId: 0,
    projectName: "",
    position: "",
    technologies: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);

  // 🧭 Load dữ liệu Talent Project
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentProjectService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          talentCVId: data.talentCVId,
          projectName: data.projectName,
          position: data.position,
          technologies: data.technologies,
          description: data.description,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin dự án nhân sự!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Talent CVs
  useEffect(() => {
    const fetchCVs = async () => {
      try {
        if (talentId > 0) {
          const cvs = await talentCVService.getAll({ 
            talentId: talentId, 
            excludeDeleted: true 
          });
          // Đảm bảo cvs luôn là array - xử lý nhiều format response
          let cvsArray: TalentCV[] = [];
          if (Array.isArray(cvs)) {
            cvsArray = cvs;
          } else if (cvs && typeof cvs === 'object') {
            // Xử lý trường hợp response có dạng { data: [...] } hoặc { items: [...] }
            if (Array.isArray((cvs as any).data)) {
              cvsArray = (cvs as any).data;
            } else if (Array.isArray((cvs as any).items)) {
              cvsArray = (cvs as any).items;
            } else if (Array.isArray((cvs as any).Data)) {
              cvsArray = (cvs as any).Data;
            } else if (Array.isArray((cvs as any).Items)) {
              cvsArray = (cvs as any).Items;
            }
          }
          console.log("📋 Loaded CVs:", cvsArray.length, "items");
          setTalentCVs(cvsArray);
        } else {
          setTalentCVs([]);
        }
      } catch (err) {
        console.error("❌ Lỗi tải danh sách CV:", err);
        setTalentCVs([]);
      }
    };
    fetchCVs();
  }, [talentId]);

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "talentCVId"
        ? Number(value)
        : value,
    }));
  };

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!formData.talentCVId || formData.talentCVId === 0) {
      alert("⚠️ Vui lòng chọn CV của nhân sự trước khi lưu!");
      return;
    }

    if (!formData.projectName.trim()) {
      alert("⚠️ Vui lòng nhập tên dự án!");
      return;
    }

    if (!formData.position.trim()) {
      alert("⚠️ Vui lòng nhập vị trí trong dự án!");
      return;
    }

    try {
      console.log("Payload gửi đi:", formData);
      await talentProjectService.update(Number(id), formData);

      alert("✅ Cập nhật dự án nhân sự thành công!");
      navigate(`/ta/talents/${talentId}`, { state: { tab: 'projects' } });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật dự án nhân sự!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
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
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/talents" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/talents/${talentId}` },
              { label: "Chỉnh sửa dự án" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa dự án nhân sự</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin dự án của nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa dự án nhân sự
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
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin dự án</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* CV của nhân sự */}
              <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CV của nhân sự <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="talentCVId"
                    value={formData.talentCVId}
                    onChange={handleChange}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    required
                  >
                    <option value="0">-- Chọn CV --</option>
                    {Array.isArray(talentCVs) && talentCVs.length > 0 ? (
                      talentCVs.map(cv => (
                        <option key={cv.id} value={cv.id}>v{cv.version}</option>
                      ))
                    ) : (
                      <option disabled>Không có CV nào</option>
                    )}
                  </select>
                </div>
                {formData.talentCVId > 0 && Array.isArray(talentCVs) && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Tóm tắt: <span className="font-medium text-neutral-700">
                      {talentCVs.find(cv => cv.id === formData.talentCVId)?.summary || "Không có tóm tắt"}
                    </span>
                  </p>
                )}
              </div>

              {/* Tên dự án */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <Input
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="VD: E-commerce Platform, Mobile Banking App..."
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vị trí trong dự án */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Vị trí trong dự án <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="VD: Frontend Developer, Backend Lead..."
                    required
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>

                {/* Công nghệ sử dụng */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Công nghệ sử dụng
                  </label>
                  <Input
                    name="technologies"
                    value={formData.technologies}
                    onChange={handleChange}
                    placeholder="VD: React, Node.js, MongoDB..."
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>
              </div>

              {/* Mô tả dự án */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả dự án
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Nhập mô tả chi tiết về dự án..."
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${talentId}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
