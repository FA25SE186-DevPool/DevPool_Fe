import { X, Building2, User, Mail, Phone, MapPin, Briefcase, Calendar, Hash } from "lucide-react";
import type { EntityInfoData } from "../../hooks/useEntityInfo";

interface EntityInfoModalProps {
  isOpen: boolean;
  entityData: EntityInfoData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function EntityInfoModal({
  isOpen,
  entityData,
  loading,
  error,
  onClose,
}: EntityInfoModalProps) {
  if (!isOpen) return null;

  const renderPartnerInfo = (data: EntityInfoData) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{data.companyName || data.name}</h3>
      </div>

      {data.partnerCode && (
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Mã đối tác:</span> {data.partnerCode}
          </span>
        </div>
      )}

      {data.taxCode && (
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Mã số thuế:</span> {data.taxCode}
          </span>
        </div>
      )}

      {data.contactPerson && (
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Người liên hệ:</span> {data.contactPerson}
          </span>
        </div>
      )}

      {data.email && (
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Email:</span> {data.email}
          </span>
        </div>
      )}

      {data.phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Số điện thoại:</span> {data.phone}
          </span>
        </div>
      )}

      {data.address && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Địa chỉ:</span> {data.address}
          </span>
        </div>
      )}
    </div>
  );

  const renderTalentInfo = (data: EntityInfoData) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">{data.fullName || data.name}</h3>
      </div>

      {data.talentCode && (
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Mã nhân sự:</span> {data.talentCode}
          </span>
        </div>
      )}

      {data.email && (
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Email:</span> {data.email}
          </span>
        </div>
      )}

      {data.phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Số điện thoại:</span> {data.phone}
          </span>
        </div>
      )}

      {data.experience && (
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Kinh nghiệm:</span> {data.experience} năm
          </span>
        </div>
      )}

      {data.location && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Địa điểm:</span> {data.location}
          </span>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div className="flex items-start gap-3">
          <Briefcase className="w-4 h-4 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 block mb-1">Kỹ năng:</span>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Thông tin {entityData?.type === "partner" ? "đối tác" : "nhân sự"}
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">⚠️ {error}</div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          )}

          {!loading && !error && entityData && (
            <div className="space-y-6">
              {entityData.type === "partner"
                ? renderPartnerInfo(entityData)
                : renderTalentInfo(entityData)
              }

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
