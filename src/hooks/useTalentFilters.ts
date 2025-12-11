import { useState, useMemo } from 'react';
import { type Talent } from '../services/Talent';

interface TalentFilters {
  searchTerm: string; // Tìm kiếm theo email, mã nhân sự, và tên
  location: string;
  status: string;
  workingMode: string;
  partnerId: string; // Đối tác
}

interface UseTalentFiltersReturn {
  filters: TalentFilters;
  setSearchTerm: (value: string) => void;
  setLocation: (value: string) => void;
  setStatus: (value: string) => void;
  setWorkingMode: (value: string) => void;
  setPartnerId: (value: string) => void;
  resetFilters: () => void;
  filteredTalents: Talent[];
  applyFilters: (talents: Talent[]) => Talent[];
}

/**
 * Hook để quản lý filter cho danh sách talents
 */
export function useTalentFilters(talents: Talent[]): UseTalentFiltersReturn {
  const [filters, setFilters] = useState<TalentFilters>({
    searchTerm: '',
    location: '',
    status: '',
    workingMode: '',
    partnerId: '',
  });

  const setSearchTerm = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  const setLocation = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
  };

  const setStatus = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const setWorkingMode = (value: string) => {
    setFilters(prev => ({ ...prev, workingMode: value }));
  };

  const setPartnerId = (value: string) => {
    setFilters(prev => ({ ...prev, partnerId: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      status: '',
      workingMode: '',
      partnerId: '',
    });
  };

  const applyFilters = useMemo(() => {
    return (talentsToFilter: Talent[]): Talent[] => {
      return talentsToFilter.filter(talent => {
        // Search term filter - tìm kiếm theo email, mã nhân sự, và tên
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesEmail = talent.email?.toLowerCase().includes(searchLower);
          const matchesCode = talent.code?.toLowerCase().includes(searchLower);
          const matchesFullName = talent.fullName?.toLowerCase().includes(searchLower);
          
          if (!matchesEmail && !matchesCode && !matchesFullName) {
            return false;
          }
        }

        // Partner filter (đối tác)
        if (filters.partnerId) {
          if (talent.currentPartnerId?.toString() !== filters.partnerId) {
            return false;
          }
        }

        // Location filter
        if (filters.location) {
          if (talent.locationId?.toString() !== filters.location) {
            return false;
          }
        }

        // Status filter
        if (filters.status) {
          if (talent.status !== filters.status) {
            return false;
          }
        }

        // Working mode filter
        if (filters.workingMode) {
          const modeValue = Number(filters.workingMode);
          if (talent.workingMode !== modeValue && (talent.workingMode & modeValue) === 0) {
            return false;
          }
        }

        return true;
      });
    };
  }, [filters]);

  const filteredTalents = useMemo(() => {
    return applyFilters(talents);
  }, [talents, applyFilters]);

  return {
    filters,
    setSearchTerm,
    setLocation,
    setStatus,
    setWorkingMode,
    setPartnerId,
    resetFilters,
    filteredTalents,
    applyFilters,
  };
}

