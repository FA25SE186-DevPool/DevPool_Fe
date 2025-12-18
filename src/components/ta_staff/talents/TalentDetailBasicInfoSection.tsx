import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  Ban,
} from 'lucide-react';
import { InfoItem } from './InfoItem';
import { type Talent } from '../../../services/Talent';
import { type ClientTalentBlacklist } from '../../../services/ClientTalentBlacklist';

interface TalentDetailBasicInfoSectionProps {
  talent: Talent;
  locationName: string;
  partnerName: string;
  blacklists: ClientTalentBlacklist[];
  workingModeLabels: Record<number, string>;
  formatLinkDisplay: (url?: string) => string;
  onPartnerClick?: () => void;
}

/**
 * Component section hiển thị thông tin cơ bản của Talent trong Detail page
 */
export function TalentDetailBasicInfoSection({
  talent,
  locationName,
  partnerName,
  blacklists,
  workingModeLabels,
  formatLinkDisplay,
  onPartnerClick,
}: TalentDetailBasicInfoSectionProps) {
  return (
    <>
      {/* Basic Info Tab */}
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {/* Cột 1 */}
          <div className="space-y-6">
            <InfoItem label="Họ và tên" value={talent.fullName || '—'} icon={<User className="w-4 h-4" />} />
            <InfoItem label="Email" value={talent.email || '—'} icon={<Mail className="w-4 h-4" />} />
            <InfoItem label="Số điện thoại" value={talent.phone || '—'} icon={<Phone className="w-4 h-4" />} />
            <InfoItem
              label="Ngày sinh"
              value={
                talent.dateOfBirth
                  ? new Date(talent.dateOfBirth).toLocaleDateString('vi-VN')
                  : 'Chưa xác định'
              }
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* Cột 2 */}
          <div className="space-y-6">
            <InfoItem
              label="Công ty"
              value={
                partnerName && talent.currentPartnerId ? (
                  <button
                    onClick={onPartnerClick}
                    className="text-primary-600 hover:text-primary-800 cursor-pointer text-left"
                  >
                    {partnerName}
                  </button>
                ) : (
                  partnerName || '—'
                )
              }
              icon={<Building2 className="w-4 h-4" />}
            />
            <InfoItem label="Khu vực làm việc" value={locationName} icon={<MapPin className="w-4 h-4" />} />
            <InfoItem
              label="Chế độ làm việc"
              value={workingModeLabels[talent.workingMode] || 'Không xác định'}
              icon={<Globe className="w-4 h-4" />}
            />
          </div>

          {/* Cột 3 */}
          <div className="space-y-6">
            <InfoItem
              label="GitHub"
              value={
                talent.githubUrl ? (
                  <a
                    href={talent.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={talent.githubUrl}
                    className="text-primary-600 hover:text-primary-800 inline-block max-w-full truncate"
                  >
                    {formatLinkDisplay(talent.githubUrl)}
                  </a>
                ) : (
                  '—'
                )
              }
              icon={<ExternalLink className="w-4 h-4" />}
            />
            <InfoItem
              label="Portfolio"
              value={
                talent.portfolioUrl ? (
                  <a
                    href={talent.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={talent.portfolioUrl}
                    className="text-primary-600 hover:text-primary-800 inline-block max-w-full truncate"
                  >
                    {formatLinkDisplay(talent.portfolioUrl)}
                  </a>
                ) : (
                  '—'
                )
              }
              icon={<ExternalLink className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Blacklist Warning - Khối riêng phía dưới */}
      {blacklists.length > 0 && (
        <div className="mt-8 pt-8 border-t border-neutral-200 animate-fade-in">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  ⚠️ Cảnh báo: Ứng viên này đã bị blacklist
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  Ứng viên này đã bị thêm vào blacklist bởi {blacklists.length} Client{blacklists.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-2">
                  {blacklists.map((blacklist) => (
                    <div key={blacklist.id} className="bg-white border border-red-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">
                            {blacklist.clientCompanyName || `Client #${blacklist.clientCompanyId}`}
                          </p>
                          <p className="text-sm text-red-700 mt-1">Lý do: {blacklist.reason || '—'}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Ngày: {blacklist.blacklistedDate
                              ? new Date(blacklist.blacklistedDate).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : '—'}
                            {blacklist.requestedBy && ` • Yêu cầu bởi: ${blacklist.requestedBy}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-700 mt-3 font-medium">
                  💡 Lưu ý: Vui lòng không giới thiệu ứng viên này cho các Client đã blacklist. Matching tự động sẽ
                  loại bỏ ứng viên này khỏi kết quả tìm kiếm cho các Client tương ứng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

