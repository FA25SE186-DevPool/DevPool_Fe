export interface SkillGroup {
  id: number;
  name: string;
  description?: string;
}

export interface SkillGroupCreate {
  name: string;
  description?: string;
}

export interface SkillGroupFilter {
  name?: string;
  excludeDeleted?: boolean;
}

