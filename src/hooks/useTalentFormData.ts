import { useState, useEffect } from 'react';
import { type Partner, partnerService } from '../services/Partner';
import { type Location, locationService } from '../services/location';
import { type Skill, skillService } from '../services/Skill';
import { type SkillGroup, skillGroupService } from '../services/SkillGroup';
import { type JobRole, jobRoleService } from '../services/JobRole';
import { type CertificateType, certificateTypeService } from '../services/CertificateType';
import { type JobRoleLevel, jobRoleLevelService } from '../services/JobRoleLevel';

/**
 * Hook để load tất cả lookup data cần thiết cho form Create/Edit Talent
 */
export function useTalentFormData() {
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'phase1' | 'phase2' | 'complete'>('phase1');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoleLevelsForCV, setJobRoleLevelsForCV] = useState<JobRoleLevel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingPhase('phase1');
        setError(null);

        // ===== PHASE 1: Essential data for basic form =====
        const [
          partnersData,
          locationsData,
          jobRolesData,
          jobRoleLevelsData,
          jobRoleLevelsForCVData
        ] = await Promise.all([
          partnerService.getAll(),
          locationService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll({ excludeDeleted: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true })
        ]);

        // Xử lý dữ liệu - đảm bảo là array
        const normalizeArray = (data: any): any[] => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.items)) return data.items;
          if (Array.isArray(data?.data)) return data.data;
          return [];
        };

        setPartners(normalizeArray(partnersData));
        setLocations(normalizeArray(locationsData));
        setJobRoles(normalizeArray(jobRolesData));
        setJobRoleLevels(normalizeArray(jobRoleLevelsData));
        setJobRoleLevelsForCV(normalizeArray(jobRoleLevelsForCVData));

        // Phase 1 complete - form can render with basic data
        setLoading(false);

        // ===== PHASE 2: Additional data for advanced features =====
        setLoadingPhase('phase2');

        const [
          skillsData,
          certificateTypesData,
          skillGroupsData
        ] = await Promise.all([
          skillService.getAll({ excludeDeleted: true }),
          certificateTypeService.getAll({ excludeDeleted: true }).catch(() => []),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => [])
        ]);

        setSkills(normalizeArray(skillsData));
        setCertificateTypes(normalizeArray(certificateTypesData));
        setSkillGroups(normalizeArray(skillGroupsData));

        setLoadingPhase('complete');
      } catch (err) {
        console.error('❌ Lỗi khi tải dữ liệu:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        setLoading(false);
        setLoadingPhase('complete');
      }
    };

    fetchData();
  }, []);

  return {
    loading,
    loadingPhase,
    error,
    partners,
    locations,
    skills,
    skillGroups,
    jobRoles,
    certificateTypes,
    jobRoleLevels,
    jobRoleLevelsForCV,
  };
}

