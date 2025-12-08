import { WorkingMode } from "../constants/WORKING_MODE";

export const JobRequestStatus = {
  Pending: 0,
  Approved: 1,
  Closed: 2,
  Rejected: 3
} as const;

export type JobRequestStatus = typeof JobRequestStatus[keyof typeof JobRequestStatus];

export interface JobSkill {
  id: number;
  skillId: number;
  skillName: string;
  isRequired: boolean;
}

export interface JobRequest {
  id: number;
  code: string;
  projectId: number;
  jobRoleLevelId: number;
  applyProcessTemplateId?: number | null;
  clientCompanyCVTemplateId: number;
  title: string;
  description: string;
  requirements: string;
  quantity: number;
  locationId?: number | null;
  workingMode: WorkingMode;
  budgetPerMonth?: number | null;
  status: JobRequestStatus;
  jobSkills: JobSkill[];
}

export interface JobRequestPayload {
  projectId: number;
  jobRoleLevelId: number;
  applyProcessTemplateId?: number | null;
  clientCompanyCVTemplateId?: number | null;
  title: string;
  description?: string;
  requirements?: string;
  quantity: number;
  locationId?: number | null;
  workingMode: WorkingMode;
  budgetPerMonth?: number | null;
  status: JobRequestStatus;
  skillIds: number[];
}

export interface JobRequestStatusUpdateModel {
  newStatus: string;
  notes?: string;
}

export interface JobRequestFilter {
  projectId?: number;
  jobRoleLevelId?: number;
  applyProcessTemplateId?: number;
  clientCompanyCVTemplateId?: number;
  title?: string;
  locationId?: number;
  workingMode?: WorkingMode;
  status?: JobRequestStatus;
  excludeDeleted?: boolean;
}

