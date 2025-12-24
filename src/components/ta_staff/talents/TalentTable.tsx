import { useNavigate } from 'react-router-dom';
import { Mail, Users } from 'lucide-react';
import { type Talent } from '../../../services/Talent';
import { type Location } from '../../../services/location';
import { type Partner } from '../../../services/Partner';

interface TalentTableProps {
  talents: Talent[];
  locations: Location[];
  partners: Partner[];
  startIndex?: number;
  loading?: boolean;
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
  loading = false
}: TalentTableProps) {
  const navigate = useNavigate();

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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td colSpan={6} className="text-center py-12">
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
            <th className="py-4 px-6 text-center text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {talents.map((t, i) => {
            const partnerName = getPartnerName(t.currentPartnerId);
            const statusInfo = getStatusInfo(t.status);

            return (
              <tr
                key={t.id}
                className="group hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/ta/talents/${t.id}`, { state: { tab: 'cvs' } })}
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
                  <div className="font-semibold text-primary-700 group-hover:text-primary-800 transition-colors duration-300 break-words">
                    {t.fullName}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span
                      className="text-sm text-neutral-700 inline-block max-w-[160px] truncate align-middle"
                      title={t.email || undefined}
                    >
                      {t.email || '—'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
