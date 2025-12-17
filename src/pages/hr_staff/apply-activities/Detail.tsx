import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { applyActivityService } from "../../../services/ApplyActivity";
import {
  AlertCircle,
} from "lucide-react";
import ApplyActivityDetailPanel from "./ApplyActivityDetailPanel";

export default function ApplyActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        await applyActivityService.getById(Number(id));
        if (mounted) setExists(true);
      } catch {
        if (mounted) setExists(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (exists === false || !id) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy hoạt động</p>
            <Link
              to="/ta/applications"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách hồ sơ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Hồ sơ ứng tuyển", to: "/ta/applications" },
              { label: `Hoạt động #${id}` }
            ]}
          />
        </div>

        {exists === null ? (
          <div className="flex-1 flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Đang tải dữ liệu hoạt động...</p>
            </div>
          </div>
        ) : (
          <ApplyActivityDetailPanel activityId={Number(id)} />
        )}
      </div>
    </div>
  );
}
