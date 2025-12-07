export interface JobRoleLevelSkill {
  id: number;
  jobRoleLevelId: number;
  skillId: number;
}

export interface JobRoleLevelSkillFilter {
  jobRoleLevelId?: number;
  skillId?: number;
  excludeDeleted?: boolean;
}

export interface JobRoleLevelSkillCreate {
  jobRoleLevelId: number;
  skillId: number;
}

