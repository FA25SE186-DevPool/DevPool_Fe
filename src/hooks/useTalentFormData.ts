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
        setError(null);

        const [
          partnersData,
          locationsData,
          skillsData,
          jobRolesData,
          certificateTypesData,
          jobRoleLevelsData,
          jobRoleLevelsForCVData
        ] = await Promise.all([
          partnerService.getAll(),
          locationService.getAll({ excludeDeleted: true }),
          skillService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll({ excludeDeleted: true }),
          certificateTypeService.getAll({ excludeDeleted: true }),
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
        setSkills(normalizeArray(skillsData));
        setJobRoles(normalizeArray(jobRolesData));
        setCertificateTypes(normalizeArray(certificateTypesData));
        setJobRoleLevels(normalizeArray(jobRoleLevelsData));
        setJobRoleLevelsForCV(normalizeArray(jobRoleLevelsForCVData));

        // Load skill groups riêng để xử lý lỗi tốt hơn
        try {
          const skillGroupsData = await skillGroupService.getAll({ excludeDeleted: true });
          setSkillGroups(normalizeArray(skillGroupsData));
        } catch (skillGroupsError) {
          console.error('❌ Lỗi khi tải nhóm kỹ năng:', skillGroupsError);
          setSkillGroups([]);
        }
      } catch (err) {
        console.error('❌ Lỗi khi tải dữ liệu:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    loading,
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

