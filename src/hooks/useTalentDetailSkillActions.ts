import { useCallback } from 'react';
import { type Skill } from '../services/Skill';

interface UseTalentDetailSkillActionsProps {
  setActiveTab: (tab: 'projects' | 'cvs' | 'jobRoleLevels' | 'skills' | 'availableTimes' | 'certificates' | 'experiences') => void;
  handleOpenInlineForm: (formType: 'project' | 'skill' | 'certificate' | 'experience' | 'jobRoleLevel' | 'availableTime' | 'cv') => void;
  setInlineSkillForm: (form: any) => void;
  setSelectedSkillGroupId: (id: number | undefined) => void;
  setSkillSearchQuery: (query: string) => void;
  setIsSkillDropdownOpen: (open: boolean) => void;
  lookupSkills: Skill[];
}

/**
 * Hook để quản lý các actions liên quan đến skills trong Talent Detail page
 */
export function useTalentDetailSkillActions({
  setActiveTab,
  handleOpenInlineForm,
  setInlineSkillForm,
  setSelectedSkillGroupId,
  setSkillSearchQuery,
  setIsSkillDropdownOpen,
  lookupSkills,
}: UseTalentDetailSkillActionsProps) {
  // Quick create skill handler
  const handleQuickCreateSkill = useCallback(
    (matchedSkill: { skillId: number; skillName: string; cvLevel?: string; cvYearsExp?: string | number }) => {
      setActiveTab('skills');
      handleOpenInlineForm('skill');

      setTimeout(() => {
        const levelMap: Record<string, string> = {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          expert: 'Expert',
        };
        const level = matchedSkill.cvLevel
          ? levelMap[matchedSkill.cvLevel.toLowerCase()] || 'Beginner'
          : 'Beginner';
        const yearsExp = matchedSkill.cvYearsExp ? Number(matchedSkill.cvYearsExp) : 1;

        const skill = lookupSkills.find((s) => s.id === matchedSkill.skillId);

        setInlineSkillForm({
          skillId: matchedSkill.skillId,
          level: level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
          yearsExp: yearsExp,
        });

        if (skill?.skillGroupId) {
          setSelectedSkillGroupId(skill.skillGroupId);
        }

        setSkillSearchQuery(matchedSkill.skillName);
        setIsSkillDropdownOpen(false);
      }, 100);
    },
    [setActiveTab, handleOpenInlineForm, setInlineSkillForm, setSelectedSkillGroupId, setSkillSearchQuery, setIsSkillDropdownOpen, lookupSkills]
  );

  // Suggestion request handler
  const handleSuggestionRequest = useCallback(
    async () => {
      // TODO: Implement suggestion request logic
      alert('Tính năng đề xuất đang được phát triển...');
    },
    []
  );

  const isSuggestionPending = useCallback(() => {
    // TODO: Check if suggestion is pending
    return false;
  }, []);

  return {
    handleQuickCreateSkill,
    handleSuggestionRequest,
    isSuggestionPending,
  };
}

