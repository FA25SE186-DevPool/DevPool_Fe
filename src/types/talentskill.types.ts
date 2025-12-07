export interface TalentSkill {
  id: number;
  talentId: number;
  skillId: number;
  level: string;
  yearsExp: number;
}

export interface TalentSkillFilter {
  talentId?: number;
  skillId?: number;
  level?: string;
  minYearsExp?: number;
  excludeDeleted?: boolean;
}

export interface TalentSkillCreate {
  talentId: number;
  skillId: number;
  level: string;
  yearsExp: number;
}

