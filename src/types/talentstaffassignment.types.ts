export const AssignmentType = {
  Primary: 0,
  Secondary: 1,
  Support: 2
} as const;

export type AssignmentType = typeof AssignmentType[keyof typeof AssignmentType];

export const AssignmentResponsibility = {
  HrManagement: 0,
  Sales: 1,
  Accounting: 2,
  ProjectCoordination: 3
} as const;

export type AssignmentResponsibility = typeof AssignmentResponsibility[keyof typeof AssignmentResponsibility];

export interface TalentStaffAssignment {
  id: number;
  userId: string;
  talentId: number;
  note: string;
  projectId?: number;
  assignmentType: AssignmentType;
  responsibility: AssignmentResponsibility;
  isActive: boolean;
  assignedAt: string; // DateTime as ISO string
  endedAt?: string; // DateTime as ISO string
}

export interface TalentStaffAssignmentFilter {
  userId?: string;
  talentId?: number;
  projectId?: number;
  assignmentType?: AssignmentType;
  responsibility?: AssignmentResponsibility;
  isActive?: boolean;
  excludeDeleted?: boolean;
}

export interface TalentStaffAssignmentCreate {
  userId: string;
  talentId: number;
  note: string;
  projectId?: number;
  assignmentType: AssignmentType;
  responsibility: AssignmentResponsibility;
  isActive: boolean;
  assignedAt: string; // DateTime as ISO string
  endedAt?: string; // DateTime as ISO string
}

