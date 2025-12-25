import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/admin";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import { Button } from "../../../../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  XCircle,
  Trash2,
} from "lucide-react";

export default function DocumentTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await documentTypeService.getById(Number(id));
        setDocumentType(data);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải chi tiết loại tài liệu:", err);
        setError(err?.message || "Không thể tải thông tin loại tài liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !documentType) return;

    const confirmDelete = window.confirm(
      `⚠️ Bạn có chắc muốn xóa loại tài liệu "${documentType.typeName}"?\n\nHành động này không thể hoàn tác!`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await documentTypeService.deleteById(Number(id));
      alert("Xóa loại tài liệu thành công!");
      navigate("/admin/categories/document-types");
    } catch (err: any) {
      console.error("❌ Lỗi khi xóa loại tài liệu:", err);

      // Handle InvalidOperationException from backend
      if (err?.response?.status === 400 && err?.response?.data?.title?.includes("InvalidOperationException")) {
        const errorMessage = err.response.data.detail || "Không thể xóa loại tài liệu này vì đang được sử dụng bởi các document.";
        alert(`❌ ${errorMessage}`);
        return;
      }

      alert(err?.message || "Không thể xóa loại tài liệu. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
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

  if (error || !documentType) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">
              {error || "Không tìm thấy loại tài liệu"}
            </p>
            <Link
              to="/admin/categories/document-types"
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
              to="/admin/categories/document-types"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{documentType.typeName}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết loại tài liệu trong hệ thống DevPool
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/admin/categories/document-types/edit/${id}`)}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Chỉnh sửa
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                {deleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 animate-fade-in">
          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tên loại tài liệu
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{documentType.typeName}</p>
                </div>

                

                {documentType.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Mô tả
                    </label>
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-base text-gray-900 leading-relaxed whitespace-pre-line">
                        {documentType.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

