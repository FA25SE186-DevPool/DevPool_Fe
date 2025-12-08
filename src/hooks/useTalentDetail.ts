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
import { jobRoleLevelService, type JobRoleLevel } from '../services/JobRoleLevel';
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

  // Main data
  const [talent, setTalent] = useState<Talent | null>(null);
  const [locationName, setLocationName] = useState<string>('—');
  const [partnerName, setPartnerName] = useState<string>('—');
  const [loading, setLoading] = useState(true);

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

  // Fetch all data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch main data and lookup data in parallel
        const [
          talentData,
          myManagedData,
          allJobRoleLevelsForCV,
          allJobRoleLevelsForTalent,
          allJobRoles,
          allSkills,
          skillGroupsData,
          allCertificateTypes,
          partners,
          blacklistData,
        ] = await Promise.all([
          talentService.getById(Number(id)),
          talentService.getMyManagedTalents().catch(() => []),
          jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll(),
          skillService.getAll(),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => null),
          certificateTypeService.getAll(),
          partnerService.getAll().catch(() => []),
          clientTalentBlacklistService.getByTalentId(Number(id), true).catch(() => null),
        ]);

        setTalent(talentData);
        setMyManagedTalents(myManagedData);
        setJobRoles(allJobRoles);

        // Resolve location and partner
        const locationPromise = talentData.locationId
          ? locationService.getById(talentData.locationId).catch(() => null)
          : Promise.resolve(null);
        const talentPartner = partners.find((p: Partner) => p.id === talentData.currentPartnerId);
        setPartnerName(talentPartner?.companyName ?? '—');

        // Fetch related talent data in parallel
        const [cvs, projects, skills, experiences, jobRoleLevelsData, certificatesData, availableTimesData, location] =
          await Promise.all([
            talentCVService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentJobRoleLevelService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentCertificateService.getAll({ talentId: Number(id), excludeDeleted: true }),
            talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true }),
            locationPromise,
          ]);

        if (location) {
          setLocationName(location.name ?? '—');
        }

        // Set lookup data
        const jobRoleLevelsArray = Array.isArray(allJobRoleLevelsForCV) ? allJobRoleLevelsForCV : [];
        setLookupJobRoleLevels(jobRoleLevelsArray);
        setLookupJobRoleLevelsForTalent(
          Array.isArray(allJobRoleLevelsForTalent) ? allJobRoleLevelsForTalent : []
        );
        setLookupSkills(Array.isArray(allSkills) ? allSkills : []);

        // Set skill groups
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

        // Set blacklist
        if (blacklistData) {
          setBlacklists(Array.isArray(blacklistData) ? blacklistData : blacklistData?.data || []);
        }

        // Set related data
        setTalentProjects(Array.isArray(projects) ? projects : []);
        setWorkExperiences(Array.isArray(experiences) ? experiences : []);
        setAvailableTimes(Array.isArray(availableTimesData) ? availableTimesData : []);

        // Map CVs with job role level names
        const cvsWithJobRoleLevelNames = (Array.isArray(cvs) ? cvs : []).map((cv: TalentCV) => {
          const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
          return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? 'Chưa xác định' };
        });

        // Sort CVs: group by jobRoleLevelName, active first, then by version descending
        const sortedCVs = cvsWithJobRoleLevelNames.sort(
          (a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
            const nameA = a.jobRoleLevelName || '';
            const nameB = b.jobRoleLevelName || '';
            if (nameA !== nameB) {
              return nameA.localeCompare(nameB);
            }
            if (a.isActive !== b.isActive) {
              return a.isActive ? -1 : 1;
            }
            return (b.version || 0) - (a.version || 0);
          }
        );
        setTalentCVs(sortedCVs);

        // Map skills with names
        const skillsWithNames = (Array.isArray(skills) ? skills : []).map((skill: TalentSkill) => {
          const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
          return {
            ...skill,
            skillName: skillInfo?.name ?? 'Unknown Skill',
            skillGroupId: skillInfo?.skillGroupId,
          };
        });
        setTalentSkills(skillsWithNames);

        // Map job role levels with names
        const jobRoleLevelsWithNames = (Array.isArray(jobRoleLevelsData) ? jobRoleLevelsData : []).map(
          (jrl: TalentJobRoleLevel) => {
            const jobRoleLevelInfo = allJobRoleLevelsForTalent.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
            if (!jobRoleLevelInfo) {
              return { ...jrl, jobRoleLevelName: 'Unknown Level', jobRoleLevelLevel: '—' };
            }
            const levelText = getLevelText(jobRoleLevelInfo.level);
            return {
              ...jrl,
              jobRoleLevelName: jobRoleLevelInfo.name || '—',
              jobRoleLevelLevel: levelText,
            };
          }
        );
        setJobRoleLevels(jobRoleLevelsWithNames);

        // Map certificates with names
        const certificatesWithNames = (Array.isArray(certificatesData) ? certificatesData : []).map(
          (cert: TalentCertificate) => {
            const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
            return { ...cert, certificateTypeName: certTypeInfo?.name ?? 'Unknown Certificate' };
          }
        );
        setCertificates(certificatesWithNames);
      } catch (err) {
        console.error('❌ Lỗi tải chi tiết nhân sự:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Check edit permission
  const canEdit = useMemo(() => {
    if (!talent || !id) return false;
    return myManagedTalents.some((t) => t.id === Number(id));
  }, [myManagedTalents, talent, id]);

  // Helper function to get level text
  const getLevelText = useCallback((level: number): string => {
    const levelMap: Record<number, string> = {
      1: 'Junior',
      2: 'Middle',
      3: 'Senior',
      4: 'Lead',
    };
    return levelMap[level] || 'Unknown';
  }, []);

  return {
    // Main data
    talent,
    locationName,
    partnerName,
    loading,

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

