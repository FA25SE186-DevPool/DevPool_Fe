import { X, Clock, TrendingUp, Hash, Calendar, Edit } from "lucide-react";
import type { OvertimeTierCoefficient } from "../../../../types/overtimetiercoefficient.types";

interface OvertimeTierDetailModalProps {
  isOpen: boolean;
  overtimeTier: OvertimeTierCoefficient | null;
  onClose: () => void;
  onEdit: () => void;
}

export function OvertimeTierDetailModal({
  isOpen,
  overtimeTier,
  onClose,
  onEdit,
}: OvertimeTierDetailModalProps) {
  if (!isOpen || !overtimeTier) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Chi tiết hệ số tăng ca
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 border border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{overtimeTier.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{overtimeTier.tierName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {overtimeTier.coefficient}x
                    </div>
                    <div className="text-sm text-gray-600">Hệ số</div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Thông tin cơ bản
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">ID:</span>
                      <span className="text-sm text-gray-900">#{overtimeTier.id}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Tier Level:</span>
                      <span className="text-sm text-gray-900">{overtimeTier.tierLevel}</span>
                    </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Thứ tự hiển thị:</span>
                    <span className="text-sm text-gray-900">{overtimeTier.displayOrder}</span>
                  </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Thông tin hệ số
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Giờ từ:</span>
                      <span className="text-sm text-gray-900">{overtimeTier.minHours}h</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Giờ đến:</span>
                      <span className="text-sm text-gray-900">{overtimeTier.maxHours}h</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Hệ số:</span>
                      <span className="text-sm font-semibold text-primary-600">{overtimeTier.coefficient}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Mô tả</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{overtimeTier.description}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Thời gian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500">Ngày tạo</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formatDate(overtimeTier.createdAt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500">Ngày cập nhật</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {overtimeTier.updatedAt ? formatDate(overtimeTier.updatedAt) : 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
