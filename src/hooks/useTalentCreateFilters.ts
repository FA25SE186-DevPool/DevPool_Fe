/**
 * Hook để quản lý các local states cho dropdowns/filters trong Create Talent page
 * 
 * Logic này được tách từ Create.tsx để dễ quản lý và bảo trì
 */

import { useState } from 'react';

/**
 * Hook quản lý các states cho dropdowns và filters
 */
export function useTalentCreateFilters() {
  // Job Role Levels dropdown states
  const [jobRoleLevelSearch, setJobRoleLevelSearch] = useState<Record<number, string>>({});
  const [isJobRoleLevelDropdownOpen, setIsJobRoleLevelDropdownOpen] = useState<Record<number, boolean>>({});
  const [showCVSummary, setShowCVSummary] = useState<Record<number, boolean>>({});
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<Record<number, number | undefined>>({});
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<Record<number, string>>({});
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState<Record<number, boolean>>({});
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<Record<number, string>>({});
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<Record<number, string>>({});
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState<Record<number, boolean>>({});
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState<Record<number, boolean>>({});
  const [selectedLevel, setSelectedLevel] = useState<Record<number, number | undefined>>({});

  // Skills dropdown states
  const [skillSearchQuery, setSkillSearchQuery] = useState<Record<number, string>>({});
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState<Record<number, boolean>>({});
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState<string>('');
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState<boolean>(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);

  // Work Experience dropdown states
  const [workExperiencePositionSearch, setWorkExperiencePositionSearch] = useState<Record<number, string>>({});
  const [isWorkExperiencePositionDropdownOpen, setIsWorkExperiencePositionDropdownOpen] = useState<Record<number, boolean>>({});

  // Projects dropdown states
  const [projectPositionSearch, setProjectPositionSearch] = useState<Record<number, string>>({});
  const [isProjectPositionDropdownOpen, setIsProjectPositionDropdownOpen] = useState<Record<number, boolean>>({});

  // Certificates dropdown states
  const [certificateTypeSearch, setCertificateTypeSearch] = useState<Record<number, string>>({});
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState<Record<number, boolean>>({});

  return {
    // Job Role Levels
    jobRoleLevelSearch,
    setJobRoleLevelSearch,
    isJobRoleLevelDropdownOpen,
    setIsJobRoleLevelDropdownOpen,
    showCVSummary,
    setShowCVSummary,
    selectedJobRoleFilterId,
    setSelectedJobRoleFilterId,
    jobRoleFilterSearch,
    setJobRoleFilterSearch,
    isJobRoleFilterDropdownOpen,
    setIsJobRoleFilterDropdownOpen,
    selectedJobRoleLevelName,
    setSelectedJobRoleLevelName,
    jobRoleLevelNameSearch,
    setJobRoleLevelNameSearch,
    isJobRoleLevelNameDropdownOpen,
    setIsJobRoleLevelNameDropdownOpen,
    isLevelDropdownOpen,
    setIsLevelDropdownOpen,
    selectedLevel,
    setSelectedLevel,
    
    // Skills
    skillSearchQuery,
    setSkillSearchQuery,
    isSkillDropdownOpen,
    setIsSkillDropdownOpen,
    skillGroupSearchQuery,
    setSkillGroupSearchQuery,
    isSkillGroupDropdownOpen,
    setIsSkillGroupDropdownOpen,
    selectedSkillGroupId,
    setSelectedSkillGroupId,
    
    // Work Experience
    workExperiencePositionSearch,
    setWorkExperiencePositionSearch,
    isWorkExperiencePositionDropdownOpen,
    setIsWorkExperiencePositionDropdownOpen,
    
    // Projects
    projectPositionSearch,
    setProjectPositionSearch,
    isProjectPositionDropdownOpen,
    setIsProjectPositionDropdownOpen,
    
    // Certificates
    certificateTypeSearch,
    setCertificateTypeSearch,
    isCertificateTypeDropdownOpen,
    setIsCertificateTypeDropdownOpen,
  };
}

