"use client";

import { Search, Filter, ChevronDown, X } from "lucide-react";


const workingModes = [
  "Tất cả",
  "Tại văn phòng",
  "Từ xa",
  "Kết hợp",
  "Linh hoạt",
];

const statuses = [
  "Tất cả",
  "Đang làm việc",
  "Sẵn sàng",
  "Bận",
];

// Định nghĩa interface cho props của component này
interface ProfessionalFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  selectedWorkingMode: string;
  setSelectedWorkingMode: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  locations: string[];
  clearFilters: () => void;
}

export default function ProfessionalFilterBar(
  props: ProfessionalFilterBarProps
) {
  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    selectedLocation,
    setSelectedLocation,
    selectedWorkingMode,
    setSelectedWorkingMode,
    selectedStatus,
    setSelectedStatus,
    locations,
    clearFilters,
  } = props;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft border border-neutral-200 p-6 mb-8 animate-slide-up">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-6 h-6" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, mã nhân sự..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-neutral-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 hover:border-neutral-400 hover:shadow-soft text-neutral-900 placeholder-neutral-500 text-lg"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-800 font-medium transition-colors duration-300 hover:scale-105 transform"
        >
          <Filter className="w-5 h-5" />
          <span>Bộ lọc nâng cao</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""
              }`}
          />
        </button>

        <div className="flex items-center space-x-4">
          <span className="text-neutral-600 font-medium">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
          >
            <option value="name">Tên A-Z</option>
            <option value="projects">Dự án nhiều nhất</option>
            <option value="skills">Kỹ năng nhiều nhất</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-neutral-50 to-primary-50 rounded-2xl border border-neutral-200 animate-slide-down">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Địa điểm
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Working Mode Filter */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Chế độ làm việc
            </label>
            <select
              value={selectedWorkingMode}
              onChange={(e) => setSelectedWorkingMode(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
            >
              {workingModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>


          {/* Clear Filters */}
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-end">
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-error-500 to-error-600 text-white px-4 py-2 rounded-xl hover:from-error-600 hover:to-error-700 transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105"
            >
              <X className="w-4 h-4" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
