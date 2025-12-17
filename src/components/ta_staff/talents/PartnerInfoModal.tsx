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

  const getPartnerTypeLabel = (partnerType: number | undefined) => {
    if (partnerType === undefined || partnerType === null) return '—';
    // Align with Partner screens: 0 = Công ty mình, 1 = Đối tác, 2 = Cá nhân/Freelancer
    if (partnerType === 0) return 'Công ty mình';
    if (partnerType === 1) return 'Đối tác';
    if (partnerType === 2) return 'Cá nhân/Freelancer';
    return '—';
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-neutral-500 mb-2">Mã đối tác</p>
                  <p className="text-gray-900 font-semibold">{partner.code || '—'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-500 mb-2">Loại đối tác</p>
                  <p className="text-gray-900 font-semibold">{getPartnerTypeLabel(partner.partnerType as unknown as number)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Tên công ty</p>
                  </div>
                  <p className="text-gray-900 font-semibold">{partner.companyName || '—'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-500 mb-2">Mã số thuế</p>
                  <p className="text-gray-900 font-semibold">{partner.taxCode || '—'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-neutral-500 mb-2">Người đại diện</p>
                  <p className="text-gray-900 font-semibold">{partner.contactPerson || '—'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Email</p>
                  </div>
                  <p className="text-gray-900 font-semibold">{partner.email || '—'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Số điện thoại</p>
                  </div>
                  <p className="text-gray-900 font-semibold">{partner.phoneNumber || '—'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-500">Địa chỉ</p>
                  </div>
                  <p className="text-gray-900 font-semibold">{partner.address || '—'}</p>
                </div>
              </div>
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

