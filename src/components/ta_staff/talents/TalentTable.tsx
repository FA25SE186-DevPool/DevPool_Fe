import { Link } from 'react-router-dom';
import { Eye, Mail, UserPlus, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { type Talent } from '../../../services/Talent';
import { type Location } from '../../../services/location';
import { type Partner } from '../../../services/Partner';

interface TalentTableProps {
  talents: Talent[];
  locations: Location[];
  partners: Partner[];
  startIndex?: number;
  loading?: boolean;
  isCreatingAccount?: number | null;
  onCreateAccount?: (talent: Talent) => void;
}

const statusLabels: Record<string, { label: string; badgeClass: string }> = {
  Available: {
    label: 'Sẵn sàng',
    badgeClass: 'bg-green-100 text-green-800',
  },
  Busy: {
    label: 'Đang bận',
    badgeClass: 'bg-yellow-100 text-yellow-800',
  },
  Working: {
    label: 'Đang làm việc',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  Applying: {
    label: 'Đang ứng tuyển',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  Unavailable: {
    label: 'Tạm ngưng',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
};


/**
 * Component bảng hiển thị danh sách talents
 */
export function TalentTable({ 
  talents, 
  locations: _locations,
  partners,
  startIndex = 0,
  loading = false,
  isCreatingAccount = null,
  onCreateAccount 
}: TalentTableProps) {

  const getPartnerName = (partnerId?: number): string => {
    if (!partnerId) return '—';
    // Ensure partners is an array before calling find
    const partnersArray = Array.isArray(partners) ? partners : [];
    const partner = partnersArray.find(p => p.id === partnerId);
    return partner?.companyName || '—';
  };

  const getStatusInfo = (status: string) => {
    return statusLabels[status] || { label: status, badgeClass: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (talents.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">#</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Mã</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Đối tác</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Họ và tên</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Email</th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Trạng thái</th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Tài khoản</th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Không có nhân sự nào phù hợp</p>
                  <p className="text-neutral-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo nhân sự mới</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-neutral-50 to-primary-50 sticky top-0 z-10">
          <tr>
            <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">#</th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Mã</th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Đối tác</th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Họ và tên</th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-neutral-600 uppercase">Email</th>
            <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Trạng thái</th>
            <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Tài khoản</th>
            <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {talents.map((t, i) => {
            const partnerName = getPartnerName(t.currentPartnerId);
            const statusInfo = getStatusInfo(t.status);
            const canCreateAccount = t.status === 'Working' && !t.userId && t.email;

            return (
              <tr
                key={t.id}
                className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
              >
                <td className="py-4 px-6 text-sm font-medium text-neutral-900">{startIndex + i + 1}</td>
                <td className="py-4 px-6">
                  <span className="text-sm font-semibold text-primary-700">
                    {t.code || '—'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-neutral-700">
                    {partnerName}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300">
                    {t.fullName}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">{t.email || '—'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  {t.userId ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                      Đã có
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs font-semibold">
                      Chưa có
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/ta/developers/${t.id}`}
                      state={{ tab: 'cvs' }}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">Xem</span>
                    </Link>
                    {canCreateAccount && onCreateAccount && (
                      <Button
                        onClick={() => onCreateAccount(t)}
                        disabled={isCreatingAccount === t.id}
                        variant="outline"
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                        title="Cấp tài khoản"
                      >
                        {isCreatingAccount === t.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-medium">Đang tạo...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="text-xs font-medium">Cấp account</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
