import type { JobRequest } from "./jobrequest.types";
import type { TalentCV } from "./talentcv.types";
import type { User } from "./user.types";
import type { Talent } from "./talent.types";
import type { Project } from "./project.types";
import type { ClientCompany } from "./clientcompany.types";

export interface TalentApplication {
  id: number;
  jobRequestId: number;
  cvId: number;
  submittedBy: string;
  recruiterId: string;
  recruiterName: string;
  status: string;
  note?: string;
  convertedCVPath?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
}

export interface TalentApplicationCreate {
  jobRequestId: number;
  cvId: number;
  submittedBy: string;
  status?: string; // default "Pending" on server
  note?: string;
  convertedCVPath?: string;
}

export interface TalentApplicationFilter {
  jobRequestId?: number;
  cvId?: number;
  submittedBy?: string;
  status?: string;
  submittedFrom?: string; // ISO string
  submittedTo?: string; // ISO string
  excludeDeleted?: boolean;
}

export interface TalentApplicationStatusUpdate {
  newStatus: string;
  note?: string;
}

export interface TalentApplicationStatusTransitionResult {
  isSuccess: boolean;
  message: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  validationErrors: string[];
  talentStatusUpdated?: boolean;
  contractsCreated?: boolean;
}

export interface TalentApplicationUpdate {
  status?: string;
  note?: string;
  convertedCVPath?: string;
}

// Status Constants
export const TalentApplicationStatusConstants = {
  Interviewing: "Interviewing",
  Hired: "Hired",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",

  AllStatuses: [
    "Interviewing",
    "Hired",
    "Rejected",
    "Withdrawn"
  ] as const,

  isValidStatus: (status: string): boolean => {
    return TalentApplicationStatusConstants.AllStatuses.includes(status as any);
  },

  AllowedTransitions: {
    Interviewing: ["Hired", "Rejected", "Withdrawn"],
    Hired: [] as string[], // Terminal state
    Rejected: [] as string[], // Terminal state
    Withdrawn: [] as string[] // Terminal state
  },

  isTerminalStatus: (status: string): boolean => {
    return status === TalentApplicationStatusConstants.Hired ||
           status === TalentApplicationStatusConstants.Rejected ||
           status === TalentApplicationStatusConstants.Withdrawn;
  },

  isTransitionAllowed: (fromStatus: string, toStatus: string): boolean => {
    const allowed = TalentApplicationStatusConstants.AllowedTransitions[fromStatus as keyof typeof TalentApplicationStatusConstants.AllowedTransitions];
    return allowed ? allowed.includes(toStatus) : false;
  }
};

// Note: ApplyActivity type needs to be imported from its service/types file
export interface TalentApplicationDetailed {
  id: number;
  jobRequestId: number;
  cvId: number;
  submittedBy: string;
  status: string;
  note: string;
  convertedCVPath?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
  
  // Related Navigation Properties
  jobRequest?: JobRequest | null;
  cv?: TalentCV | null; // Note: API returns "CV" but we'll use "cv" for camelCase
  submitter?: User | null;
  
  // Additional Related Data
  talent?: Talent | null;
  project?: Project | null;
  clientCompany?: ClientCompany | null;
  
  // Related Collections
  activities: any[]; // ApplyActivity[] - will need to import when ApplyActivity types are created
  
  // Additional Display Properties
  jobTitle?: string | null;
  companyName?: string | null;
  talentName?: string | null;
  submitterName?: string | null;
}

export interface TalentApplicationsByJobRequestResponse {
  success: boolean;
  message: string;
  data: {
    jobRequestId: number;
    filterStatus: string;
    totalApplications: number;
    applications: TalentApplicationDetailed[];
  };
}

export interface ApplicationOwnershipTransferModel {
  newRecruiterId: string;
  reason?: string;
}

export interface BulkApplicationOwnershipTransferModel {
  applicationIds: number[];
  newRecruiterId: string;
  reason?: string;
}

export interface ApplicationOwnershipTransferResult {
  isSuccess: boolean;
  message: string;
  oldRecruiterId?: string;
  newRecruiterId?: string;
  auditLogId?: number;
}

export interface BulkApplicationOwnershipTransferResult {
  isSuccess: boolean;
  message: string;
  totalTransferred: number;
  totalFailed: number;
  results: {
    applicationId: number;
    isSuccess: boolean;
    message: string;
  }[];
  auditLogIds?: number[];
}

