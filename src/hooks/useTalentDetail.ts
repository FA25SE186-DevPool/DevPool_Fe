import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { talentService, type Talent } from '../services/Talent';
import { talentCVService, type TalentCV } from '../services/TalentCV';
import { talentProjectService, type TalentProject } from '../services/TalentProject';
import { talentSkillService, type TalentSkill } from '../services/TalentSkill';
import { talentWorkExperienceService, type TalentWorkExperience } from '../services/TalentWorkExperience';
import { talentJobRoleLevelService, type TalentJobRoleLevel } from '../services/TalentJobRoleLevel';
import { talentCertificateService, type TalentCertificate } from '../services/TalentCertificate';
import { talentAvailableTimeService, type TalentAvailableTime } from '../services/TalentAvailableTime';
import { locationService } from '../services/location';
import { partnerService, type Partner } from '../services/Partner';
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from '../services/JobRoleLevel';
import { jobRoleService, type JobRole } from '../services/JobRole';
import { skillService, type Skill } from '../services/Skill';
import { skillGroupService, type SkillGroup } from '../services/SkillGroup';
import { certificateTypeService, type CertificateType } from '../services/CertificateType';
import { clientTalentBlacklistService, type ClientTalentBlacklist } from '../services/ClientTalentBlacklist';

/**
 * Hook để quản lý data fetching và state cho Talent Detail page
 */
export function useTalentDetail() {
  const { id } = useParams<{ id: string }>();

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  // Main data
  const [talent, setTalent] = useState<Talent | null>(null);
  const [locationName, setLocationName] = useState<string>('—');
  const [partnerName, setPartnerName] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'phase1' | 'complete'>('phase1');

  // Related data
  const [talentCVs, setTalentCVs] = useState<(TalentCV & { jobRoleLevelName?: string })[]>([]);
  const [talentProjects, setTalentProjects] = useState<TalentProject[]>([]);
  const [talentSkills, setTalentSkills] = useState<
    (TalentSkill & { skillName: string; skillGroupId?: number })[]
  >([]);
  const [workExperiences, setWorkExperiences] = useState<TalentWorkExperience[]>([]);
  const [jobRoleLevels, setJobRoleLevels] = useState<
    (TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string })[]
  >([]);
  const [certificates, setCertificates] = useState<
    (TalentCertificate & { certificateTypeName: string })[]
  >([]);
  const [availableTimes, setAvailableTimes] = useState<TalentAvailableTime[]>([]);
  const [blacklists, setBlacklists] = useState<ClientTalentBlacklist[]>([]);

  // Lookup data
  const [lookupSkills, setLookupSkills] = useState<Skill[]>([]);
  const [lookupSkillGroups, setLookupSkillGroups] = useState<SkillGroup[]>([]);
  const [lookupJobRoleLevels, setLookupJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [lookupJobRoleLevelsForTalent, setLookupJobRoleLevelsForTalent] = useState<JobRoleLevel[]>([]);
  const [lookupCertificateTypes, setLookupCertificateTypes] = useState<CertificateType[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [myManagedTalents, setMyManagedTalents] = useState<Talent[]>([]);

  // Single phase loading - load everything at once
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingPhase('phase1');


        // ===== SINGLE PHASE: Load all data simultaneously =====
        // Get talent data first (needed for location lookup)
        const talentData = await talentService.getById(Number(id));

        const [
          // Lookup data
          allJobRoles,
          allSkills,
          allJobRoleLevelsForTalent,
          allJobRoleLevelsForCV,
          skillGroupsData,
          allCertificateTypes,

          // Location and partner
          locationData,
          partnersData,

          // Related talent data
          cvs,
          projects,
          skills,
          experiences,
          jobRoleLevelsData,
          certificatesData,
          availableTimesData,

          // Additional data
          myManagedData,
          blacklistData,
        ] = await Promise.all([
          // Lookup data
          jobRoleService.getAll(),
          skillService.getAll(),
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true }),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => null),
          certificateTypeService.getAll({ excludeDeleted: true }).catch(() => []),

          // Location and partner
          talentData.locationId
            ? locationService.getById(talentData.locationId).catch(() => null)
            : Promise.resolve(null),
          partnerService.getAll().catch(() => []),

          // Related talent data
          talentCVService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentJobRoleLevelService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentCertificateService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true }),

          // Additional data
          talentService.getMyManagedTalents().catch(() => []),
          clientTalentBlacklistService.getByTalentId(Number(id), true).catch(() => null),
        ]);

        // Set main talent data
        setTalent(talentData);

        // Set lookup data
        setJobRoles(allJobRoles);
        setLookupJobRoleLevelsForTalent(
          Array.isArray(allJobRoleLevelsForTalent) ? allJobRoleLevelsForTalent : []
        );
        setLookupSkills(Array.isArray(allSkills) ? allSkills : []);
        setLookupJobRoleLevels(Array.isArray(allJobRoleLevelsForCV) ? allJobRoleLevelsForCV : []);

        // Set skill groups and certificate types
        try {
          const skillGroupsArray = Array.isArray(skillGroupsData)
            ? skillGroupsData
            : Array.isArray((skillGroupsData as any)?.items)
              ? (skillGroupsData as any).items
              : Array.isArray((skillGroupsData as any)?.data)
                ? (skillGroupsData as any).data
                : [];
          setLookupSkillGroups(skillGroupsArray);
        } catch (skillGroupsError) {
          console.error('❌ Lỗi khi tải nhóm kỹ năng:', skillGroupsError);
          setLookupSkillGroups([]);
        }

        setLookupCertificateTypes(Array.isArray(allCertificateTypes) ? allCertificateTypes : []);

        // Set location and partner info
        const location = locationData;
        if (location) {
          setLocationName(location.name ?? '—');
        }

        const partnersArray = ensureArray<Partner>(partnersData);
        const talentPartner = partnersArray.find((p: Partner) => p.id === talentData.currentPartnerId);
        setPartnerName(talentPartner?.companyName ?? '—');

        // Set related data
        const cvsWithJobRoleLevel = ensureArray<TalentCV & { jobRoleLevelName?: string }>(cvs);
        setTalentCVs(cvsWithJobRoleLevel);

        const projectsArray = ensureArray<TalentProject>(projects);
        setTalentProjects(projectsArray);

        const skillsArray = ensureArray<TalentSkill & { skillName: string; skillGroupId?: number }>(skills);
        setTalentSkills(skillsArray);

        const experiencesArray = ensureArray<TalentWorkExperience>(experiences);
        setWorkExperiences(experiencesArray);

        const jobRoleLevelsArray = ensureArray<TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string }>(jobRoleLevelsData);
        setJobRoleLevels(jobRoleLevelsArray);

        const certificatesArray = ensureArray<TalentCertificate & { certificateTypeName: string }>(certificatesData);
        setCertificates(certificatesArray);

        const availableTimesArray = ensureArray<TalentAvailableTime>(availableTimesData);
        setAvailableTimes(availableTimesArray);

        // Set additional data
        if (blacklistData) {
          setBlacklists(Array.isArray(blacklistData) ? blacklistData : blacklistData?.data || []);
        }

        const myManagedArray = ensureArray<Talent>(myManagedData);
        setMyManagedTalents(myManagedArray);

        // All data loaded - complete
        setLoading(false);
        setLoadingPhase('complete');


        // CVs have already been processed and sorted in Phase 2
        // Skills, job role levels, and certificates will be re-processed by useEffect when lookup data is available
      } catch (err) {
        console.error('❌ Lỗi tải chi tiết nhân sự:', err);
      } finally {
        setLoading(false);
        setLoadingPhase('complete');
      }
    };

    fetchData();
  }, [id]);

  // Re-process skills when skill lookup data becomes available
  useEffect(() => {
    if (lookupSkills.length > 0 && talentSkills.length > 0) {
      const skillsWithNames = talentSkills.map((skill: TalentSkill & { skillName?: string; skillGroupId?: number }) => {
        const skillInfo = lookupSkills.find((s: Skill) => s.id === skill.skillId);
        return {
          ...skill,
          skillName: skillInfo?.name ?? skill.skillName ?? 'Unknown Skill',
          skillGroupId: skillInfo?.skillGroupId ?? skill.skillGroupId,
        };
      });
      setTalentSkills(skillsWithNames);
    }
  }, [lookupSkills, talentSkills.length]);

  // Re-process job role levels when lookup data becomes available
  useEffect(() => {
    if (lookupJobRoleLevelsForTalent.length > 0 && jobRoleLevels.length > 0) {
      const jobRoleLevelsWithNames = jobRoleLevels.map(
        (jrl: TalentJobRoleLevel & { jobRoleLevelName?: string; jobRoleLevelLevel?: string }) => {
          const jobRoleLevelInfo = lookupJobRoleLevelsForTalent.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
          if (!jobRoleLevelInfo) {
            return { ...jrl, jobRoleLevelName: jrl.jobRoleLevelName || 'Unknown Level', jobRoleLevelLevel: jrl.jobRoleLevelLevel || '—' };
          }
          const levelText = getLevelText(jobRoleLevelInfo.level);
          return {
            ...jrl,
            jobRoleLevelName: jobRoleLevelInfo.name || jrl.jobRoleLevelName || '—',
            jobRoleLevelLevel: levelText,
          };
        }
      );
      setJobRoleLevels(jobRoleLevelsWithNames);
    }
  }, [lookupJobRoleLevelsForTalent, jobRoleLevels.length]);

  // Re-process certificates when certificate type lookup data becomes available
  useEffect(() => {
    if (lookupCertificateTypes.length > 0 && certificates.length > 0) {
      const certificatesWithNames = certificates.map(
        (cert: TalentCertificate & { certificateTypeName?: string }) => {
          const certTypeInfo = lookupCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
          return { ...cert, certificateTypeName: certTypeInfo?.name ?? cert.certificateTypeName ?? 'Unknown Certificate' };
        }
      );
      setCertificates(certificatesWithNames);
    }
  }, [lookupCertificateTypes, certificates.length]);

  // Re-process CVs when job role level lookup data becomes available
  useEffect(() => {
    if (lookupJobRoleLevels.length > 0 && talentCVs.length > 0) {
      const cvsWithJobRoleLevelNames = talentCVs.map((cv: TalentCV & { jobRoleLevelName?: string }) => {
        const jobRoleLevelInfo = lookupJobRoleLevels.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
        return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? 'Chưa xác định' };
      });
      setTalentCVs(cvsWithJobRoleLevelNames);
    }
  }, [lookupJobRoleLevels, talentCVs.length]);

  // Check edit permission
  const canEdit = useMemo(() => {
    if (!talent || !id) return false;
    // Ensure myManagedTalents is an array
    const myManagedArray = Array.isArray(myManagedTalents) ? myManagedTalents : [];
    return myManagedArray.some((t) => t.id === Number(id));
  }, [myManagedTalents, talent, id]);

  // Helper function to get level text
  const getLevelText = useCallback((level: number): string => {
    const levelMap: Record<number, string> = {
      [TalentLevel.Junior]: 'Junior',
      [TalentLevel.Middle]: 'Middle',
      [TalentLevel.Senior]: 'Senior',
      [TalentLevel.Lead]: 'Lead',
    };
    return levelMap[level] || 'Unknown';
  }, []);

  return {
    // Main data
    talent,
    setTalent,
    locationName,
    partnerName,
    loading,
    loadingPhase,

    // Related data
    talentCVs,
    setTalentCVs,
    talentProjects,
    setTalentProjects,
    talentSkills,
    setTalentSkills,
    workExperiences,
    setWorkExperiences,
    jobRoleLevels,
    setJobRoleLevels,
    certificates,
    setCertificates,
    availableTimes,
    setAvailableTimes,
    blacklists,

    // Lookup data
    lookupSkills,
    lookupSkillGroups,
    lookupJobRoleLevels,
    lookupJobRoleLevelsForTalent,
    lookupCertificateTypes,
    jobRoles,
    myManagedTalents,

    // Permissions
    canEdit,

    // Helpers
    getLevelText,
  };
}

