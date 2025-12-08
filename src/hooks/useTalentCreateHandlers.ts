/**
 * Hook để quản lý các handlers add/remove/update cho Create Talent page
 * 
 * Logic này được tách từ Create.tsx để dễ quản lý và bảo trì
 */

import { useCallback } from 'react';
import {
  type TalentSkillCreateModel,
  type TalentWorkExperienceCreateModel,
  type TalentProjectCreateModel,
  type TalentCertificateCreateModel,
  type TalentJobRoleLevelCreateModel,
} from '../services/Talent';

interface UseTalentCreateHandlersProps {
  talentJobRoleLevels: TalentJobRoleLevelCreateModel[];
  setTalentJobRoleLevels: (value: TalentJobRoleLevelCreateModel[] | ((prev: TalentJobRoleLevelCreateModel[]) => TalentJobRoleLevelCreateModel[])) => void;
  setTalentSkills: (value: TalentSkillCreateModel[] | ((prev: TalentSkillCreateModel[]) => TalentSkillCreateModel[])) => void;
  setTalentWorkExperiences: (value: TalentWorkExperienceCreateModel[] | ((prev: TalentWorkExperienceCreateModel[]) => TalentWorkExperienceCreateModel[])) => void;
  setTalentProjects: (value: TalentProjectCreateModel[] | ((prev: TalentProjectCreateModel[]) => TalentProjectCreateModel[])) => void;
  setTalentCertificates: (value: TalentCertificateCreateModel[] | ((prev: TalentCertificateCreateModel[]) => TalentCertificateCreateModel[])) => void;
}

/**
 * Hook quản lý các handlers add/remove/update
 */
export function useTalentCreateHandlers({
  talentJobRoleLevels,
  setTalentJobRoleLevels,
  setTalentSkills,
  setTalentWorkExperiences,
  setTalentProjects,
  setTalentCertificates,
}: UseTalentCreateHandlersProps) {
  // Job Role Levels handlers
  const addJobRoleLevel = useCallback(() => {
    setTalentJobRoleLevels((prev) => [
      {
        jobRoleLevelId: 0,
        yearsOfExp: 0,
        ratePerMonth: undefined,
      },
      ...prev,
    ]);
  }, [setTalentJobRoleLevels]);

  const removeJobRoleLevel = useCallback(
    (index: number) => {
      // Không cho phép xóa nếu chỉ còn 1 item (bắt buộc)
      if (talentJobRoleLevels.length <= 1) {
        alert('⚠️ Vị trí là bắt buộc. Phải có ít nhất 1 vị trí.');
        return;
      }
      setTalentJobRoleLevels((prev) => prev.filter((_, i) => i !== index));
    },
    [talentJobRoleLevels.length, setTalentJobRoleLevels]
  );

  const updateJobRoleLevel = useCallback(
    (index: number, field: keyof TalentJobRoleLevelCreateModel, value: string | number | undefined) => {
      setTalentJobRoleLevels((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [setTalentJobRoleLevels]
  );

  // Skills handlers
  const addSkill = useCallback(() => {
    setTalentSkills((prev) => [{ skillId: 0, level: 'Beginner', yearsExp: 0 }, ...prev]);
  }, [setTalentSkills]);

  const removeSkill = useCallback(
    (index: number) => {
      setTalentSkills((prev) => prev.filter((_, i) => i !== index));
    },
    [setTalentSkills]
  );

  const updateSkill = useCallback(
    (index: number, field: keyof TalentSkillCreateModel, value: string | number) => {
      setTalentSkills((prev) => {
        // Kiểm tra trùng skill khi update skillId
        if (field === 'skillId' && value && typeof value === 'number' && value > 0) {
          const isDuplicate = prev.some((ts, idx) => idx !== index && ts.skillId === value);
          if (isDuplicate) {
            alert('⚠️ Kỹ năng này đã được chọn ở entry khác. Vui lòng chọn kỹ năng khác.');
            return prev;
          }
        }
        
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        
        // Tự động set yearsExp = 1 nếu đang là 0 khi chọn skillId
        if (field === 'skillId' && value && typeof value === 'number' && value > 0) {
          if (updated[index].yearsExp === 0 || updated[index].yearsExp === undefined) {
            updated[index].yearsExp = 1;
          }
        }
        
        return updated;
      });
    },
    [setTalentSkills]
  );

  // Work Experience handlers
  const addWorkExperience = useCallback(() => {
    setTalentWorkExperiences((prev) => [
      {
        company: '',
        position: '',
        startDate: '',
        endDate: undefined,
        description: '',
      },
      ...prev,
    ]);
  }, [setTalentWorkExperiences]);

  const removeWorkExperience = useCallback(
    (index: number) => {
      setTalentWorkExperiences((prev) => prev.filter((_, i) => i !== index));
    },
    [setTalentWorkExperiences]
  );

  const updateWorkExperience = useCallback(
    (index: number, field: keyof TalentWorkExperienceCreateModel, value: string | undefined) => {
      setTalentWorkExperiences((prev) => {
        const updated = [...prev];
        const currentExp = updated[index];
        
        // Validation: Ngày kết thúc phải sau ngày bắt đầu
        if (field === 'endDate') {
          if (value && currentExp.startDate && value < currentExp.startDate) {
            alert('⚠️ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
            return prev;
          }
        }
        
        // Khi startDate thay đổi, kiểm tra và reset endDate nếu cần
        if (field === 'startDate' && value) {
          updated[index] = { ...updated[index], [field]: value };
          // Nếu endDate < startDate mới, reset endDate
          if (currentExp.endDate && value && currentExp.endDate < value) {
            updated[index].endDate = undefined;
            alert('⚠️ Ngày kết thúc đã được xóa vì nhỏ hơn ngày bắt đầu mới.');
          }
        } else if (value) {
          updated[index] = { ...updated[index], [field]: value };
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }
        
        return updated;
      });
    },
    [setTalentWorkExperiences]
  );

  // Project handlers
  const addProject = useCallback(() => {
    setTalentProjects((prev) => [
      {
        projectName: '',
        position: '',
        technologies: '',
        description: '',
      },
      ...prev,
    ]);
  }, [setTalentProjects]);

  const removeProject = useCallback(
    (index: number) => {
      setTalentProjects((prev) => prev.filter((_, i) => i !== index));
    },
    [setTalentProjects]
  );

  const updateProject = useCallback(
    (index: number, field: keyof TalentProjectCreateModel, value: string) => {
      setTalentProjects((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [setTalentProjects]
  );

  // Certificate handlers
  const addCertificate = useCallback(() => {
    setTalentCertificates((prev) => [
      {
        certificateTypeId: 0,
        certificateName: '',
        certificateDescription: '',
        issuedDate: undefined,
        isVerified: false,
        imageUrl: '',
      },
      ...prev,
    ]);
  }, [setTalentCertificates]);

  const removeCertificate = useCallback(
    (index: number) => {
      setTalentCertificates((prev) => prev.filter((_, i) => i !== index));
    },
    [setTalentCertificates]
  );

  const updateCertificate = useCallback(
    (index: number, field: keyof TalentCertificateCreateModel, value: string | number | boolean | undefined) => {
      setTalentCertificates((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [setTalentCertificates]
  );

  return {
    // Job Role Levels
    addJobRoleLevel,
    removeJobRoleLevel,
    updateJobRoleLevel,
    
    // Skills
    addSkill,
    removeSkill,
    updateSkill,
    
    // Work Experiences
    addWorkExperience,
    removeWorkExperience,
    updateWorkExperience,
    
    // Projects
    addProject,
    removeProject,
    updateProject,
    
    // Certificates
    addCertificate,
    removeCertificate,
    updateCertificate,
  };
}

