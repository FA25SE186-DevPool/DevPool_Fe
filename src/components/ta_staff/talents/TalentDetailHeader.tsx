import { Edit, FileText, UserCheck, UserX } from 'lucide-react';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { Button } from '../../../components/ui/button';
import { type Talent } from '../../../services/Talent';

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
}

interface TalentDetailHeaderProps {
  talent: Talent;
  returnTo?: string;
  statusConfig: StatusConfig;
  canEdit: boolean;
  isDisabled: boolean;
  onEdit: () => void;
  onToggleAvailability: () => void;
  showToggleAvailability: boolean;
  availabilityAction: 'toUnavailable' | 'toAvailable';
}

export function TalentDetailHeader({
  talent,
  returnTo,
  statusConfig,
  canEdit,
  isDisabled,
  onEdit,
  onToggleAvailability,
  showToggleAvailability,
  availabilityAction,
}: TalentDetailHeaderProps) {
  return (
    <div className="mb-8 animate-slide-up">
      <Breadcrumb
        items={[
          { label: 'Nhân sự', to: returnTo || '/ta/talents' },
          { label: talent?.fullName || 'Chi tiết nhân sự' },
        ]}
      />

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{talent.fullName}</h1>
          <p className="text-neutral-600 mb-4">Thông tin chi tiết nhân sự trong hệ thống DevPool</p>

          {/* Mã nhân sự và Status Badge */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200">
              <FileText className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">
                Mã: <span className="font-mono">{talent.code || '—'}</span>
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor} border border-neutral-200`}
            >
              {statusConfig.icon}
              <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onEdit}
            disabled={isDisabled}
            title={
              !canEdit
                ? 'Bạn không có quyền chỉnh sửa nhân sự này. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.'
                : isDisabled
                  ? 'Không thể sửa khi nhân sự đang ứng tuyển hoặc đang làm việc'
                  : ''
            }
            className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
              isDisabled
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
            }`}
          >
            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            Sửa
          </Button>
          {showToggleAvailability && (
            <Button
              onClick={onToggleAvailability}
              disabled={!canEdit || isDisabled}
              title={
                !canEdit
                  ? 'Bạn không có quyền thay đổi trạng thái nhân sự này. Chỉ TA đang quản lý nhân sự này mới được thao tác.'
                  : isDisabled
                    ? 'Không thể thay đổi trạng thái khi nhân sự đang ứng tuyển hoặc đang làm việc'
                    : availabilityAction === 'toUnavailable'
                      ? 'Chuyển trạng thái nhân sự sang Tạm ngưng'
                      : 'Chuyển trạng thái nhân sự sang Sẵn sàng'
              }
              className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                !canEdit || isDisabled
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : availabilityAction === 'toUnavailable'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              }`}
            >
              {availabilityAction === 'toUnavailable' ? (
                <UserX className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              )}
              {availabilityAction === 'toUnavailable' ? 'Tạm ngưng' : 'Sẵn sàng'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

