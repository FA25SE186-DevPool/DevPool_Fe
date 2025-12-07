export interface Skill {
  id: number;
  skillGroupId: number;
  name: string;
  description?: string;
  isMandatory: boolean;
}

export interface SkillCreate {
  skillGroupId: number;
  name: string;
  description?: string;
  isMandatory: boolean;
}

export interface SkillFilter {
  name?: string;
  skillGroupId?: number;
  excludeDeleted?: boolean;
}

