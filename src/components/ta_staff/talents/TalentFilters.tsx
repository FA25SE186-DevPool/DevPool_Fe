import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { type Location } from '../../../services/location';
import { type Partner } from '../../../services/Partner';
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
  filterPartnerId: string;
  onPartnerIdChange: (value: string) => void;
  locations: Location[];
  partners: Partner[];
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
  { value: WorkingMode.Hybrid.toString(), label: 'Kết hợp' },
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
  filterPartnerId,
  onPartnerIdChange,
  locations,
  partners,
  onReset,
}: TalentFiltersProps) {
  const hasActiveFilters = searchTerm || filterLocation || filterStatus || filterWorkingMode || filterPartnerId;

  // State cho dropdown search và open/close
  const [partnerSearch, setPartnerSearch] = useState('');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isWorkingModeDropdownOpen, setIsWorkingModeDropdownOpen] = useState(false);

  // Helper function để lấy display text
  const getPartnerDisplayText = () => {
    if (!filterPartnerId) return 'Tất cả đối tác';
    const partner = partners.find(p => p.id.toString() === filterPartnerId);
    return partner?.companyName || 'Tất cả đối tác';
  };

  const getLocationDisplayText = () => {
    if (!filterLocation) return 'Tất cả địa điểm';
    const location = locations.find(l => l.id.toString() === filterLocation);
    return location?.name || 'Tất cả địa điểm';
  };

  const getStatusDisplayText = () => {
    if (!filterStatus) return 'Tất cả trạng thái';
    const status = statusOptions.find(opt => opt.value === filterStatus);
    return status?.label || 'Tất cả trạng thái';
  };

  const getWorkingModeDisplayText = () => {
    if (!filterWorkingMode) return 'Tất cả chế độ';
    const mode = workingModeOptions.find(opt => opt.value === filterWorkingMode);
    return mode?.label || 'Tất cả chế độ';
  };


  return (
    <div className="mb-6">
      {/* Search bar và nút filter */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo email, mã nhân sự, tên..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
          />
        </div>
        <Button
          onClick={onToggleFilters}
          variant="outline"
          className={`flex items-center gap-2 ${showFilters ? 'bg-neutral-50 border-neutral-300' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
          {hasActiveFilters && (
            <span className="ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-700 text-white shadow-sm">
              {[searchTerm, filterLocation, filterStatus, filterWorkingMode, filterPartnerId].filter(Boolean).length}
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
          <div className="flex flex-wrap gap-4">
            {/* Đối tác filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Đối tác
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                >
                  <span className="text-sm text-neutral-700">{getPartnerDisplayText()}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isPartnerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPartnerDropdownOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => {
                      setIsPartnerDropdownOpen(false);
                      setPartnerSearch('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={partnerSearch}
                          onChange={(e) => setPartnerSearch(e.target.value)}
                          placeholder="Tìm đối tác..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onPartnerIdChange('');
                          setIsPartnerDropdownOpen(false);
                          setPartnerSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${
                          !filterPartnerId
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        Tất cả đối tác
                      </button>
                      {partners
                        .filter((partner) =>
                          !partnerSearch || partner.companyName.toLowerCase().includes(partnerSearch.toLowerCase())
                        )
                        .map((partner) => (
                          <button
                            type="button"
                            key={partner.id}
                            onClick={() => {
                              onPartnerIdChange(partner.id.toString());
                              setIsPartnerDropdownOpen(false);
                              setPartnerSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterPartnerId === partner.id.toString()
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            {partner.companyName}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Trạng thái
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                >
                  <span className="text-sm text-neutral-700">{getStatusDisplayText()}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusDropdownOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => setIsStatusDropdownOpen(false)}
                  >
                    <div className="max-h-56 overflow-y-auto">
                      {statusOptions.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            onStatusChange(opt.value);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm ${
                            filterStatus === opt.value
                              ? 'bg-primary-50 text-primary-700'
                              : 'hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Địa điểm
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                >
                  <span className="text-sm text-neutral-700">{getLocationDisplayText()}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLocationDropdownOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => {
                      setIsLocationDropdownOpen(false);
                      setLocationSearch('');
                    }}
                  >
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Tìm địa điểm..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onLocationChange('');
                          setIsLocationDropdownOpen(false);
                          setLocationSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${
                          !filterLocation
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        Tất cả địa điểm
                      </button>
                      {locations
                        .filter((loc) =>
                          !locationSearch || loc.name.toLowerCase().includes(locationSearch.toLowerCase())
                        )
                        .map((loc) => (
                          <button
                            type="button"
                            key={loc.id}
                            onClick={() => {
                              onLocationChange(loc.id.toString());
                              setIsLocationDropdownOpen(false);
                              setLocationSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              filterLocation === loc.id.toString()
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                    {loc.name}
                          </button>
                ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Working mode filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Chế độ làm việc
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsWorkingModeDropdownOpen(!isWorkingModeDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left hover:border-primary-300 transition-colors"
                >
                  <span className="text-sm text-neutral-700">{getWorkingModeDisplayText()}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isWorkingModeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isWorkingModeDropdownOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => setIsWorkingModeDropdownOpen(false)}
                  >
                    <div className="max-h-56 overflow-y-auto">
                      {workingModeOptions.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            onWorkingModeChange(opt.value);
                            setIsWorkingModeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm ${
                            filterWorkingMode === opt.value
                              ? 'bg-primary-50 text-primary-700'
                              : 'hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

