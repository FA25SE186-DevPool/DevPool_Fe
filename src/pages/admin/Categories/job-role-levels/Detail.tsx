import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { jobRoleLevelService, type JobRoleLevel } from "../../../../services/JobRoleLevel";
import { Button } from "../../../../components/ui/button";
import { jobRoleService } from "../../../../services/JobRole";
import { Layers3, ArrowLeft } from "lucide-react";

export default function JobRoleLevelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobRoleLevel, setJobRoleLevel] = useState<JobRoleLevel | null>(null);
  const [jobRoleName, setJobRoleName] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  const levelLabels: Record<number, string> = {
    0: "Junior",
    1: "Middle",
    2: "Senior",
    3: "Lead",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const positionData = await jobRoleLevelService.getById(Number(id)) as JobRoleLevel;
        setJobRoleLevel(positionData);
        const typeData = await jobRoleService.getById(positionData.jobRoleId);
        setJobRoleName(typeData.name);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết vị trí:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !jobRoleLevel) return;
    const confirmDelete = window.confirm("⚠️ Bạn có chắc muốn xóa vị trí tuyển dụng này?");
    if (!confirmDelete) return;

    try {
      await jobRoleLevelService.delete(Number(id));
      alert("✅ Xóa vị trí tuyển dụng thành công!");
      // Quay về trang chi tiết job role nếu có, nếu không thì về danh sách job-role-levels
      if (jobRoleLevel.jobRoleId) {
        navigate(`/admin/categories/job-roles/${jobRoleLevel.jobRoleId}`);
      } else {
        navigate("/admin/categories/job-role-levels");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa vị trí:", err);
      alert("Không thể xóa vị trí!");
    }
  };

  const handleEdit = () => {
    navigate(`/admin/categories/job-role-levels/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Đang tải dữ liệu vị trí tuyển dụng...
      </div>
    );
  }

  if (!jobRoleLevel) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Không tìm thấy vị trí tuyển dụng
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
            {jobRoleLevel?.jobRoleId ? (
              <Link
                to={`/admin/categories/job-roles/${jobRoleLevel.jobRoleId}`}
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại loại vị trí</span>
              </Link>
            ) : (
              <Link
                to="/admin/categories/job-role-levels"
                className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Quay lại danh sách</span>
              </Link>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobRoleLevel.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết vị trí tuyển dụng
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white"
              >
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Layers3 className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <InfoItem label="ID" value={jobRoleLevel.id.toString()} />
            <InfoItem label="Loại vị trí (Job Role)" value={jobRoleName} />
            <InfoItem label="Cấp độ" value={levelLabels[jobRoleLevel.level] || "—"} />
            <InfoItem label="Mô tả" value={jobRoleLevel.description || "Chưa có mô tả"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-gray-900 font-medium">{value || "—"}</p>
    </div>
  );
}
