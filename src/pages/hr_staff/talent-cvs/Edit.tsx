import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentCVService, type TalentCVCreate, type TalentCVFieldsUpdateModel } from "../../../services/TalentCV";
import { jobRoleLevelService, type JobRoleLevel } from "../../../services/JobRoleLevel";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  FileText, 
  Upload, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";

export default function TalentCVEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allJobRoleLevels, setAllJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentCVCreate>({
    talentId: 0,
    jobRoleLevelId: 0,
    version: 1,
    cvFileUrl: "",
    isActive: true,
    summary: "",
    isGeneratedFromTemplate: false,
    sourceTemplateId: undefined,
    generatedForJobRequestId: undefined,
  });

  const [editableFields, setEditableFields] = useState<TalentCVFieldsUpdateModel>({
    talentId: 0,
    summary: "",
    isActive: true,
    isGeneratedFromTemplate: false,
  });

  const [loading, setLoading] = useState(true);
  const [canDeactivate, setCanDeactivate] = useState(true); // Cho phép deactivate hay không

  // 🧭 Load dữ liệu Talent CV
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentCVService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          jobRoleLevelId: data.jobRoleLevelId,
          version: data.version,
          cvFileUrl: data.cvFileUrl,
          isActive: data.isActive,
          summary: data.summary,
          isGeneratedFromTemplate: data.isGeneratedFromTemplate,
          sourceTemplateId: data.sourceTemplateId,
          generatedForJobRequestId: data.generatedForJobRequestId,
        });
        setEditableFields({
          talentId: data.talentId,
          summary: data.summary,
          isActive: data.isActive,
          isGeneratedFromTemplate: data.isGeneratedFromTemplate,
        });
        setTalentId(data.talentId);

        // Kiểm tra xem có bao nhiêu CV đang hoạt động
        if (data.isActive) {
          try {
            const allActiveCVs = await talentCVService.getAll({
              talentId: data.talentId,
              isActive: true,
              excludeDeleted: true,
            });
            
            // Nếu chỉ có 1 CV đang hoạt động (chính CV hiện tại), không cho phép deactivate
            if (allActiveCVs && allActiveCVs.length === 1) {
              setCanDeactivate(false);
            } else {
              setCanDeactivate(true);
            }
          } catch (err) {
            console.error("❌ Lỗi kiểm tra CV đang hoạt động:", err);
            setCanDeactivate(true); // Nếu lỗi, cho phép deactivate để an toàn
          }
        } else {
          setCanDeactivate(true); // Nếu CV không active, luôn cho phép
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin CV!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Job Role Levels
  useEffect(() => {
    const fetchJobRoleLevels = async () => {
      try {
        const jobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        setAllJobRoleLevels(Array.isArray(jobRoleLevels) ? jobRoleLevels : []);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách vị trí công việc:", err);
      }
    };
    fetchJobRoleLevels();
  }, []);

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    const newValue = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : type === 'number' || name === "jobRoleLevelId" || name === "sourceTemplateId" || name === "version" || name === "generatedForJobRequestId"
      ? Number(value)
      : value;

    if (name === "summary" || name === "isActive" || name === "isGeneratedFromTemplate") {
      setEditableFields((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
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

    try {
      // Kiểm tra nếu cố gắng deactivate CV duy nhất đang hoạt động
      if (formData.isActive && !editableFields.isActive && !canDeactivate) {
        alert("⚠️ Không thể tắt trạng thái hoạt động!\n\nĐây là CV duy nhất đang hoạt động. Phải có ít nhất một CV đang hoạt động cho nhân sự này.");
        return;
      }

      const payload: TalentCVFieldsUpdateModel = {
        talentId,
        summary: editableFields.summary,
        isActive: editableFields.isActive ?? false,
        isGeneratedFromTemplate: editableFields.isGeneratedFromTemplate ?? false,
      };

      if (payload.isActive) {
        try {
          const existingActiveCVs = await talentCVService.getAll({
            talentId,
            jobRoleLevelId: formData.jobRoleLevelId,
            isActive: true,
            excludeDeleted: true,
          });

          const otherActiveCVs = (existingActiveCVs || [])
            .filter((cv: any) => cv.id !== Number(id));

          await Promise.all(
            otherActiveCVs.map((cv: any) =>
              talentCVService.updateFields(cv.id, {
                talentId: cv.talentId,
                isActive: false,
              })
            )
          );
        } catch (deactivateError) {
          console.warn("Không thể hạ cấp CV đang active khác:", deactivateError);
        }
      }

      await talentCVService.updateFields(Number(id), payload);

      alert("Cập nhật CV thành công!");
      navigate(`/ta/talents/${talentId}`, { state: { defaultTab: "cvs" } });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật CV!");
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
              { label: "Chỉnh sửa CV" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa CV</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin CV của talent
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa CV
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
                <h2 className="text-xl font-semibold text-gray-900">Thông tin CV</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vị trí công việc */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Vị trí công việc <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="jobRoleLevelId"
                    value={formData.jobRoleLevelId}
                    onChange={handleChange}
                    disabled
                    className="w-full border border-neutral-300 bg-neutral-50 rounded-xl px-4 py-3 cursor-not-allowed opacity-75"
                    required
                  >
                    <option value="0">-- Chọn vị trí công việc --</option>
                    {allJobRoleLevels.map(jobRoleLevel => (
                      <option key={jobRoleLevel.id} value={jobRoleLevel.id}>{jobRoleLevel.name}</option>
                    ))}
                  </select>
                </div>
                {formData.jobRoleLevelId > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Đã chọn: <span className="font-medium text-neutral-700">
                      {allJobRoleLevels.find(jrl => jrl.id === formData.jobRoleLevelId)?.name || "Không xác định"}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tên phiên bản */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Version CV <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="version"
                    value={formData.version}
                    min="1"
                    step="1"
                    onChange={handleChange}
                    placeholder="VD: 1, 2, 3..."
                    required
                    disabled
                    className="w-full border-neutral-300 bg-neutral-50 rounded-xl cursor-not-allowed opacity-75"
                  />
                </div>

                {/* URL file CV */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    URL file CV <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="cvFileUrl"
                    value={formData.cvFileUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/cv-file.pdf"
                    required
                    disabled
                    className="w-full border-neutral-300 bg-neutral-50 rounded-xl cursor-not-allowed opacity-75"
                  />
                  {formData.cvFileUrl && (
                    <div className="mt-2">
                      <a
                        href={formData.cvFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Xem trước file CV
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Tóm tắt CV */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tóm tắt CV
                </label>
                <textarea
                  name="summary"
                  value={editableFields.summary ?? ""}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về nội dung CV, bao gồm: tên ứng viên, vị trí công việc, kinh nghiệm làm việc, kỹ năng chính, dự án nổi bật, chứng chỉ (nếu có)..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trạng thái hoạt động */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Trạng thái hoạt động
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editableFields.isActive ?? false}
                      onChange={handleChange}
                      disabled={!canDeactivate && formData.isActive}
                      className={`w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 ${
                        !canDeactivate && formData.isActive ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      {editableFields.isActive ? "Đang hoạt động" : "Không hoạt động"}
                    </span>
                    {!canDeactivate && formData.isActive && (
                      <span className="text-xs text-red-600 ml-2">
                        (Không thể tắt - CV duy nhất đang hoạt động)
                      </span>
                    )}
                  </div>
                </div>

                {/* Được tạo từ template */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Được tạo từ template
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      name="isGeneratedFromTemplate"
                      checked={editableFields.isGeneratedFromTemplate ?? false}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">
                      {formData.isGeneratedFromTemplate ? "Có" : "Không"}
                    </span>
                  </div>
                </div>
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
