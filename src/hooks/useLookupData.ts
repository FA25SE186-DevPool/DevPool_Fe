import { useState, useEffect, useCallback } from 'react';
import { type Partner, partnerService } from '../services/Partner';
import { type Location, locationService } from '../services/location';
import { type Skill, skillService } from '../services/Skill';
import { type SkillGroup, skillGroupService } from '../services/SkillGroup';
import { type JobRole, jobRoleService } from '../services/JobRole';
import { type CertificateType, certificateTypeService } from '../services/CertificateType';
import { type JobRoleLevel, jobRoleLevelService } from '../services/JobRoleLevel';
import { type ClientCompany, clientCompanyService } from '../services/ClientCompany';
import { type Project, projectService } from '../services/Project';

// Cache interface để lưu trữ data
interface LookupDataCache {
  partners: Partner[];
  locations: Location[];
  skills: Skill[];
  skillGroups: SkillGroup[];
  jobRoles: JobRole[];
  certificateTypes: CertificateType[];
  jobRoleLevels: JobRoleLevel[];
  jobRoleLevelsForCV: JobRoleLevel[];
  clientCompanies: ClientCompany[];
  projects: Project[];
  lastUpdated: number;
  loading: boolean;
}

// Global cache instance
let globalLookupCache: LookupDataCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Hook để cache và cung cấp lookup data dùng chung
 * Tránh việc fetch lại data lookup mỗi lần vào trang mới
 */
export function useLookupData(options: {
  includeTalentData?: boolean;
  includeJobRequestData?: boolean;
  includeAll?: boolean;
} = {}) {
  const { includeTalentData = false, includeJobRequestData = false, includeAll = false } = options;

  const [cache, setCache] = useState<LookupDataCache | null>(globalLookupCache);

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  const fetchLookupData = useCallback(async (): Promise<LookupDataCache> => {
    // Always load basic data
    const basicPromises = [
      partnerService.getAll(),
      locationService.getAll({ excludeDeleted: true }),
    ];

    // Load talent-related data if needed
    const talentPromises = includeTalentData || includeAll ? [
      skillService.getAll({ excludeDeleted: true }),
      skillGroupService.getAll({ excludeDeleted: true }).catch(() => []),
      jobRoleService.getAll({ excludeDeleted: true }),
      certificateTypeService.getAll({ excludeDeleted: true }).catch(() => []),
      jobRoleLevelService.getAll({ excludeDeleted: true }),
      jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true })
    ] : [];

    // Load job request related data if needed
    const jobRequestPromises = includeJobRequestData || includeAll ? [
      clientCompanyService.getAll(),
      projectService.getAll(),
    ] : [];

    const allPromises = [
      ...basicPromises,
      ...talentPromises,
      ...jobRequestPromises
    ];

    const results = await Promise.all(allPromises);

    let resultIndex = 0;

    // Basic data (always loaded)
    const partners = ensureArray<Partner>(results[resultIndex++]);
    const locations = ensureArray<Location>(results[resultIndex++]);

    // Talent data (conditional)
    let skills: Skill[] = [];
    let skillGroups: SkillGroup[] = [];
    let jobRoles: JobRole[] = [];
    let certificateTypes: CertificateType[] = [];
    let jobRoleLevels: JobRoleLevel[] = [];
    let jobRoleLevelsForCV: JobRoleLevel[] = [];

    if (includeTalentData || includeAll) {
      skills = ensureArray<Skill>(results[resultIndex++]);
      skillGroups = ensureArray<SkillGroup>(results[resultIndex++]);
      jobRoles = ensureArray<JobRole>(results[resultIndex++]);
      certificateTypes = ensureArray<CertificateType>(results[resultIndex++]);
      jobRoleLevels = ensureArray<JobRoleLevel>(results[resultIndex++]);
      jobRoleLevelsForCV = ensureArray<JobRoleLevel>(results[resultIndex++]);
    }

    // Job request data (conditional)
    let clientCompanies: ClientCompany[] = [];
    let projects: Project[] = [];

    if (includeJobRequestData || includeAll) {
      clientCompanies = ensureArray<ClientCompany>(results[resultIndex++]);
      projects = ensureArray<Project>(results[resultIndex++]);
    }

    const newCache: LookupDataCache = {
      partners,
      locations,
      skills,
      skillGroups,
      jobRoles,
      certificateTypes,
      jobRoleLevels,
      jobRoleLevelsForCV,
      clientCompanies,
      projects,
      lastUpdated: Date.now(),
      loading: false
    };

    // Update global cache
    globalLookupCache = newCache;
    return newCache;
  }, [includeTalentData, includeJobRequestData, includeAll]);

  const refreshCache = useCallback(async () => {
    const newCache = await fetchLookupData();
    setCache(newCache);
  }, [fetchLookupData]);

  useEffect(() => {
    const loadData = async () => {
      // Check if we have valid cached data
      if (globalLookupCache &&
          (Date.now() - globalLookupCache.lastUpdated) < CACHE_DURATION &&
          // Check if cache has required data
          (!includeTalentData || globalLookupCache.skills.length > 0) &&
          (!includeJobRequestData || globalLookupCache.clientCompanies.length >= 0)) {
        console.log('[LookupData] Using cached lookup data');
        setCache(globalLookupCache);
        return;
      }

      // Set loading state
      setCache(prev => prev ? { ...prev, loading: true } : null);

      try {
        const newCache = await fetchLookupData();
        setCache(newCache);
      } catch (error) {
        console.error('[LookupData] Error fetching lookup data:', error);
        // Set empty cache on error to prevent infinite loading
        const emptyCache: LookupDataCache = {
          partners: [],
          locations: [],
          skills: [],
          skillGroups: [],
          jobRoles: [],
          certificateTypes: [],
          jobRoleLevels: [],
          jobRoleLevelsForCV: [],
          clientCompanies: [],
          projects: [],
          lastUpdated: Date.now(),
          loading: false
        };
        setCache(emptyCache);
      }
    };

    loadData();
  }, [fetchLookupData, includeTalentData, includeJobRequestData, includeAll]);

  return {
    // Basic data (always available)
    partners: cache?.partners || [],
    locations: cache?.locations || [],

    // Talent data
    skills: cache?.skills || [],
    skillGroups: cache?.skillGroups || [],
    jobRoles: cache?.jobRoles || [],
    certificateTypes: cache?.certificateTypes || [],
    jobRoleLevels: cache?.jobRoleLevels || [],
    jobRoleLevelsForCV: cache?.jobRoleLevelsForCV || [],

    // Job request data
    clientCompanies: cache?.clientCompanies || [],
    projects: cache?.projects || [],

    // Status
    loading: cache?.loading || false,
    lastUpdated: cache?.lastUpdated || 0,

    // Actions
    refreshCache
  };
}
