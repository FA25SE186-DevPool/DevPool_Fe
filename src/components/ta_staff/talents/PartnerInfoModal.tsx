import { X, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { type PartnerDetailedModel } from '../../../services/Partner';

interface PartnerInfoModalProps {
  isOpen: boolean;
  partner: PartnerDetailedModel | null;
  loading: boolean;
  onClose: () => void;
}

/**
 * Modal hiển thị thông tin chi tiết của công ty đối tác
 */
export function PartnerInfoModal({ isOpen, partner, loading, onClose }: PartnerInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thông tin công ty</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">Đang tải thông tin...</p>
              </div>
            </div>
          ) : partner ? (
            <div className="space-y-6">
              {/* Tên công ty */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-500">Tên công ty</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">{partner.companyName || '—'}</p>
              </div>

              {/* Mã công ty */}
              {partner.code && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-neutral-500">Mã công ty</p>
                  </div>
                  <p className="text-gray-900">{partner.code}</p>
                </div>
              )}

              {/* Mã số thuế */}
              {partner.taxCode && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-neutral-500">Mã số thuế</p>
                  </div>
                  <p className="text-gray-900">{partner.taxCode}</p>
                </div>
              )}

              {/* Email */}
              {partner.email && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Email</p>
                  </div>
                  <p className="text-gray-900">{partner.email}</p>
                </div>
              )}

              {/* Số điện thoại */}
              {partner.phoneNumber && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Số điện thoại</p>
                  </div>
                  <p className="text-gray-900">{partner.phoneNumber}</p>
                </div>
              )}

              {/* Địa chỉ */}
              {partner.address && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Địa chỉ</p>
                  </div>
                  <p className="text-gray-900">{partner.address}</p>
                </div>
              )}

              {/* Loại đối tác */}
              {partner.partnerType !== undefined && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-neutral-500">Loại đối tác</p>
                  </div>
                  <p className="text-gray-900">
                    {partner.partnerType === 1 ? 'Nhà cung cấp' : partner.partnerType === 2 ? 'Khách hàng' : '—'}
                  </p>
                </div>
              )}

              {/* Người liên hệ */}
              {partner.contactPerson && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-neutral-500">Người liên hệ</p>
                  </div>
                  <p className="text-gray-900">{partner.contactPerson}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 text-lg font-medium">Không tìm thấy thông tin công ty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

