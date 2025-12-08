import { Search, Filter, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { type Location } from '../../../services/location';
import { WorkingMode } from '../../../constants/WORKING_MODE';

interface TalentFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterLocation: string;
  onLocationChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterWorkingMode: string;
  onWorkingModeChange: (value: string) => void;
  locations: Location[];
  onReset: () => void;
}

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Available', label: 'Sẵn sàng' },
  { value: 'Busy', label: 'Đang bận' },
  { value: 'Working', label: 'Đang làm việc' },
  { value: 'Applying', label: 'Đang ứng tuyển' },
  { value: 'Unavailable', label: 'Tạm ngưng' },
];

const workingModeOptions = [
  { value: '', label: 'Tất cả chế độ' },
  { value: WorkingMode.Onsite.toString(), label: 'Tại văn phòng' },
  { value: WorkingMode.Remote.toString(), label: 'Từ xa' },
  { value: WorkingMode.Hybrid.toString(), label: 'Hybrid' },
  { value: WorkingMode.Flexible.toString(), label: 'Linh hoạt' },
];

/**
 * Component bộ lọc cho danh sách talents
 */
export function TalentFilters({
  showFilters,
  onToggleFilters,
  searchTerm,
  onSearchChange,
  filterLocation,
  onLocationChange,
  filterStatus,
  onStatusChange,
  filterWorkingMode,
  onWorkingModeChange,
  locations,
  onReset,
}: TalentFiltersProps) {
  const hasActiveFilters = searchTerm || filterLocation || filterStatus || filterWorkingMode;

  return (
    <div className="mb-6">
      {/* Search bar và nút filter */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
          />
        </div>
        <Button
          onClick={onToggleFilters}
          variant={showFilters ? 'primary' : 'outline'}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Bộ lọc
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-primary-600 text-white">
              {[searchTerm, filterLocation, filterStatus, filterWorkingMode].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Địa điểm
              </label>
              <select
                value={filterLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Working mode filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Chế độ làm việc
              </label>
              <select
                value={filterWorkingMode}
                onChange={(e) => onWorkingModeChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {workingModeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

