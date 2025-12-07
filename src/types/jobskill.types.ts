export interface JobSkill {
  id: number;
  jobRequestId: number;
  skillsId: number;
}

export interface JobSkillPayload {
  jobRequestId: number;
  skillsId: number;
}

export interface JobSkillFilter {
  jobRequestId?: number;
  skillsId?: number;
  excludeDeleted?: boolean;
}

