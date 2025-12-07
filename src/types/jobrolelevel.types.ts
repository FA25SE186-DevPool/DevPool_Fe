export const TalentLevel = {
  Junior: 0,
  Middle: 1,
  Senior: 2,
  Lead: 3
} as const;

export type TalentLevel = typeof TalentLevel[keyof typeof TalentLevel];

export interface JobRoleLevel {
  id: number;
  jobRoleId: number;
  name: string;
  level: TalentLevel;
  description: string;
}

export interface JobRoleLevelPayload {
  jobRoleId: number;
  name: string;
  level: TalentLevel;
  description?: string;
}

export interface JobRoleLevelFilter {
  jobRoleId?: number;
  name?: string;
  level?: TalentLevel;
  excludeDeleted?: boolean;
  distinctByName?: boolean;
}

