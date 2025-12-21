import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { jobRoleLevelService, type JobRoleLevel, type JobRoleLevelPayload } from "../../../../services/JobRoleLevel";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { jobRoleService, type JobRole } from "../../../../services/JobRole";
import { Layers3, Users, FileText } from "lucide-react";

export default function JobRoleLevelEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRoleLevel, setJobRoleLevel] = useState<JobRoleLevel | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateSuccessOverlay, setShowUpdateSuccessOverlay] = useState(false);

  const [formData, setFormData] = useState<JobRoleLevelPayload>({
    jobRoleId: 0,
    name: "",
    description: "",
    level: 0,
  });

  const levelLabels: Record<number, string> = {
    0: "Junior",
    1: "Middle",
    2: "Senior",
    3: "Lead",
  };


  // 🧭 Load dữ liệu chi tiết
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const [positionData, types] = await Promise.all([
          jobRoleLevelService.getById(Number(id)) as Promise<JobRoleLevel>,
          jobRoleService.getAll() as Promise<JobRole[]>,
        ]);

        setJobRoleLevel(positionData);
        setJobRoles(types);

        setFormData({
          jobRoleId: positionData.jobRoleId,
          name: positionData.name,
          description: positionData.description ?? "",
          level: positionData.level,
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin vị trí tuyển dụng!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ✍️ Cập nhật form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : ["level", "jobRoleId"].includes(name) ? Number(value) : value,
    }));
  };

  // 💾 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validation
    if (!formData.name || formData.name.trim() === "") {
      alert("⚠️ Vui lòng nhập tên vị trí!");
      return;
    }

    if (!formData.jobRoleId || formData.jobRoleId === 0) {
      alert("⚠️ Vui lòng chọn loại vị trí!");
      return;
    }

    try {
      // Kiểm tra trùng tên và cấp độ (loại trừ bản ghi hiện tại)
      const existingJobRoleLevels = await jobRoleLevelService.getAll({ 
        excludeDeleted: true,
        name: formData.name.trim(),
        level: formData.level
      }) as any[];
      
      const levelNames: Record<number, string> = {
        0: "Junior",
        1: "Middle",
        2: "Senior",
        3: "Lead"
      };
      
      if (existingJobRoleLevels && existingJobRoleLevels.length > 0) {
        const duplicate = existingJobRoleLevels.find(
          (jrl: any) => jrl.id !== Number(id) // Loại trừ bản ghi hiện tại
            && jrl.name.trim().toLowerCase() === formData.name.trim().toLowerCase() 
            && jrl.level === formData.level
        );
        
        if (duplicate) {
          alert(`⚠️ Vị trí với tên "${formData.name}" và cấp độ "${levelNames[formData.level]}" đã tồn tại. Vui lòng chọn tên hoặc cấp độ khác.`);
          return;
        }
      }

      await jobRoleLevelService.update(Number(id), formData);
      setShowUpdateSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi navigate
      setTimeout(() => {
        setShowUpdateSuccessOverlay(false);
        // Quay về trang chi tiết job role level, hoặc về job role nếu có
        if (jobRoleLevel?.jobRoleId) {
          navigate(`/admin/categories/job-roles/${jobRoleLevel.jobRoleId}`);
        } else {
          navigate(`/admin/categories/job-role-levels/${id}`);
        }
      }, 2000);
    } catch (err: any) {
      console.error("❌ Lỗi cập nhật:", err);
      alert(err.message || "Không thể cập nhật vị trí tuyển dụng!");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-500">Đang tải dữ liệu...</div>;

  if (!jobRoleLevel) return <div className="flex justify-center items-center min-h-screen text-red-500">Không tìm thấy vị trí tuyển dụng</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to={`/admin/categories/job-role-levels/${id}`}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <span className="font-medium">Quay lại chi tiết</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa vị trí tuyển dụng</h1>
              <p className="text-neutral-600 mb-4">Cập nhật thông tin vị trí tuyển dụng</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          {/* Left: Form */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-soft p-8 border border-neutral-100 space-y-6">
            {/* Section: Thông tin cơ bản */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Layers3 className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tên vị trí */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Tên vị trí <span className="text-red-500">*</span></label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: Frontend Developer, Backend Engineer..."
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">Tên rõ ràng giúp TA/khách hàng dễ nhận biết.</p>
                </div>

                {/* Loại vị trí */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Loại vị trí <span className="text-red-500">*</span></label>
                  <select
                    name="jobRoleId"
                    value={formData.jobRoleId}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    required
                  >
                    <option value={0}>-- Chọn loại vị trí --</option>
                    {jobRoles.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">Chọn nhóm vai trò tương ứng.</p>
                </div>

                {/* Cấp độ */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Cấp độ <span className="text-red-500">*</span></label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value={0}>Junior</option>
                    <option value={1}>Middle</option>
                    <option value={2}>Senior</option>
                    <option value={3}>Lead</option>
                  </select>
                </div>

                {/* Mô tả */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Mô tả</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về yêu cầu, kỹ năng, phạm vi công việc..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                to={`/admin/categories/job-role-levels/${id}`}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition"
              >
                Hủy
              </Link>
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100 h-max">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xem trước</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-700">
                <Layers3 className="w-4 h-4 text-neutral-400" />
                <span className="font-medium">{formData.name || "Tên vị trí"}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <Users className="w-4 h-4 text-neutral-400" />
                <span>{levelLabels[formData.level]}</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-700">
                <FileText className="w-4 h-4 text-neutral-400 mt-0.5" />
                <p className="text-sm leading-6 whitespace-pre-wrap break-words">{formData.description || "Mô tả sẽ hiển thị ở đây..."}</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Update Success Overlay */}
      {showUpdateSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật vị trí tuyển dụng thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
