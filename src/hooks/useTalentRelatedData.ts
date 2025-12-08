import { useState, useCallback } from 'react';
import {
  type TalentSkillCreateModel,
  type TalentWorkExperienceCreateModel,
  type TalentProjectCreateModel,
  type TalentCertificateCreateModel,
  type TalentJobRoleLevelCreateModel,
} from '../services/Talent';
import { TalentLevel } from '../services/JobRoleLevel';

/**
 * Hook để quản lý related data (skills, work experiences, projects, certificates, job role levels)
 */
export function useTalentRelatedData() {
  const [talentSkills, setTalentSkills] = useState<TalentSkillCreateModel[]>([]);
  const [talentWorkExperiences, setTalentWorkExperiences] = useState<TalentWorkExperienceCreateModel[]>([]);
  const [talentProjects, setTalentProjects] = useState<TalentProjectCreateModel[]>([]);
  const [talentCertificates, setTalentCertificates] = useState<TalentCertificateCreateModel[]>([]);
  const [talentJobRoleLevels, setTalentJobRoleLevels] = useState<TalentJobRoleLevelCreateModel[]>([
    {
      jobRoleLevelId: 0,
      yearsOfExp: 0,
      ratePerMonth: undefined,
    },
  ]);

  // Skills management
  const addSkill = useCallback(() => {
    setTalentSkills([{ skillId: 0, level: 'Beginner', yearsExp: 0 }, ...talentSkills]);
  }, [talentSkills]);

  const removeSkill = useCallback(
    (index: number) => {
      setTalentSkills(talentSkills.filter((_, i) => i !== index));
    },
    [talentSkills]
  );

  const updateSkill = useCallback(
    (index: number, field: keyof TalentSkillCreateModel, value: string | number) => {
      const updated = [...talentSkills];
      updated[index] = { ...updated[index], [field]: value };

      // Tự động set yearsExp = 1 nếu đang là 0 khi chọn skillId
      if (field === 'skillId' && value && typeof value === 'number' && value > 0) {
        if (updated[index].yearsExp === 0 || updated[index].yearsExp === undefined) {
          updated[index].yearsExp = 1;
        }
      }

      setTalentSkills(updated);
    },
    [talentSkills]
  );

  // Work Experiences management
  const addWorkExperience = useCallback(() => {
    setTalentWorkExperiences([
      {
        company: '',
        position: '',
        startDate: '',
        endDate: undefined,
        description: '',
      },
      ...talentWorkExperiences,
    ]);
  }, [talentWorkExperiences]);

  const removeWorkExperience = useCallback(
    (index: number) => {
      setTalentWorkExperiences(talentWorkExperiences.filter((_, i) => i !== index));
    },
    [talentWorkExperiences]
  );

  const updateWorkExperience = useCallback(
    (index: number, field: keyof TalentWorkExperienceCreateModel, value: string | undefined) => {
      const updated = [...talentWorkExperiences];
      updated[index] = { ...updated[index], [field]: value };
      setTalentWorkExperiences(updated);
    },
    [talentWorkExperiences]
  );

  // Projects management
  const addProject = useCallback(() => {
    setTalentProjects([
      {
        projectName: '',
        position: '',
        technologies: '',
        description: '',
      },
      ...talentProjects,
    ]);
  }, [talentProjects]);

  const removeProject = useCallback(
    (index: number) => {
      setTalentProjects(talentProjects.filter((_, i) => i !== index));
    },
    [talentProjects]
  );

  const updateProject = useCallback(
    (index: number, field: keyof TalentProjectCreateModel, value: string) => {
      const updated = [...talentProjects];
      updated[index] = { ...updated[index], [field]: value };
      setTalentProjects(updated);
    },
    [talentProjects]
  );

  // Certificates management
  const addCertificate = useCallback(() => {
    setTalentCertificates([
      {
        certificateTypeId: 0,
        certificateName: '',
        certificateDescription: '',
        issuedDate: undefined,
        isVerified: false,
        imageUrl: '',
      },
      ...talentCertificates,
    ]);
  }, [talentCertificates]);

  const removeCertificate = useCallback(
    (index: number) => {
      setTalentCertificates(talentCertificates.filter((_, i) => i !== index));
    },
    [talentCertificates]
  );

  const updateCertificate = useCallback(
    (index: number, field: keyof TalentCertificateCreateModel, value: string | number | boolean | undefined) => {
      const updated = [...talentCertificates];
      updated[index] = { ...updated[index], [field]: value };
      setTalentCertificates(updated);
    },
    [talentCertificates]
  );

  // Job Role Levels management
  const addJobRoleLevel = useCallback(() => {
    setTalentJobRoleLevels([
      {
        jobRoleLevelId: 0,
        yearsOfExp: 0,
        ratePerMonth: undefined,
      },
      ...talentJobRoleLevels,
    ]);
  }, [talentJobRoleLevels]);

  const removeJobRoleLevel = useCallback(
    (index: number) => {
      // Không cho phép xóa nếu chỉ còn 1 item (bắt buộc)
      if (talentJobRoleLevels.length <= 1) {
        alert('⚠️ Vị trí là bắt buộc. Phải có ít nhất 1 vị trí.');
        return;
      }
      setTalentJobRoleLevels(talentJobRoleLevels.filter((_, i) => i !== index));
    },
    [talentJobRoleLevels]
  );

  const updateJobRoleLevel = useCallback(
    (index: number, field: keyof TalentJobRoleLevelCreateModel, value: string | number | undefined) => {
      const updated = [...talentJobRoleLevels];
      updated[index] = { ...updated[index], [field]: value };

      // Tự động set yearsOfExp = 1 nếu đang là 0 khi chọn jobRoleLevelId
      if (field === 'jobRoleLevelId' && value && typeof value === 'number' && value > 0) {
        if (updated[index].yearsOfExp === 0 || updated[index].yearsOfExp === undefined) {
          updated[index].yearsOfExp = 1;
        }
      }

      setTalentJobRoleLevels(updated);
    },
    [talentJobRoleLevels]
  );

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
    // Data
    talentSkills,
    talentWorkExperiences,
    talentProjects,
    talentCertificates,
    talentJobRoleLevels,

    // Skills
    setTalentSkills,
    addSkill,
    removeSkill,
    updateSkill,

    // Work Experiences
    setTalentWorkExperiences,
    addWorkExperience,
    removeWorkExperience,
    updateWorkExperience,

    // Projects
    setTalentProjects,
    addProject,
    removeProject,
    updateProject,

    // Certificates
    setTalentCertificates,
    addCertificate,
    removeCertificate,
    updateCertificate,

    // Job Role Levels
    setTalentJobRoleLevels,
    addJobRoleLevel,
    removeJobRoleLevel,
    updateJobRoleLevel,
    getLevelText,
  };
}

