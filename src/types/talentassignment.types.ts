// Status Constants
export const TalentAssignmentStatusConstants = {
  Draft: "Draft",
  Active: "Active",
  Completed: "Completed",
  Terminated: "Terminated",
  Inactive: "Inactive",
  Cancelled: "Cancelled",

  AllStatuses: [
    "Draft",
    "Active",
    "Completed",
    "Terminated",
    "Inactive",
    "Cancelled"
  ] as const,

  isValidStatus: (status: string): boolean => {
    return TalentAssignmentStatusConstants.AllStatuses.includes(status as any);
  },

  AllowedTransitions: {
    Draft: ["Active", "Cancelled"],
    Active: ["Completed", "Terminated", "Inactive"],
    Completed: [] as string[], // Terminal state
    Terminated: [] as string[], // Terminal state
    Inactive: ["Active"], // Can reactivate
    Cancelled: [] as string[] // Terminal state
  },

  isTerminalStatus: (status: string): boolean => {
    return status === TalentAssignmentStatusConstants.Completed ||
           status === TalentAssignmentStatusConstants.Terminated ||
           status === TalentAssignmentStatusConstants.Cancelled;
  },

  isTransitionAllowed: (fromStatus: string, toStatus: string): boolean => {
    const allowed = TalentAssignmentStatusConstants.AllowedTransitions[fromStatus as keyof typeof TalentAssignmentStatusConstants.AllowedTransitions];
    return allowed ? allowed.includes(toStatus) : false;
  }
};

// Model for GET
export interface TalentAssignmentModel {
  id: number;
  talentId: number;
  projectId: number;
  partnerId: number;
  talentApplicationId?: number | null;
  jobRoleLevelId?: number | null;
  jobRoleLevelName?: string | null;
  startDate: string; // ISO string
  endDate?: string | null; // ISO string
  commitmentFileUrl?: string | null;
  status: string;
  terminationDate?: string | null; // ISO string
  terminationReason?: string | null;
  notes?: string | null;
  estimatedClientRate?: number | null;
  estimatedPartnerRate?: number | null;
  currencyCode?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
  
  // Navigation Properties (optional - for display purposes)
  partnerName?: string | null;
  partnerCompanyName?: string | null;
  projectName?: string | null;
  talentName?: string | null;
}

// Model for CREATE
export interface TalentAssignmentCreateModel {
  talentId: number;
  projectId: number;
  partnerId: number;
  talentApplicationId?: number | null;
  startDate: string; // ISO string
  endDate?: string | null; // ISO string
  commitmentFileUrl?: string | null;
  status?: string; // Default: "Active"
  terminationDate?: string | null; // ISO string
  terminationReason?: string | null;
  notes?: string | null;
  estimatedClientRate?: number | null;
  estimatedPartnerRate?: number | null;
  currencyCode?: string | null;
}

// Model for EXTEND
export interface TalentAssignmentExtendModel {
  endDate: string; // ISO string
  commitmentFileUrl?: string | null;
  notes?: string | null;
}

// Model for TERMINATE
export interface TalentAssignmentTerminateModel {
  terminationDate: string; // ISO string (required)
  terminationReason: string; // (required)
}

// Model for UPDATE
export interface TalentAssignmentUpdateModel {
  endDate?: string | null; // ISO string
  commitmentFileUrl?: string | null;
  status?: string | null;
  terminationDate?: string | null; // ISO string
  terminationReason?: string | null;
  notes?: string | null;
  estimatedClientRate?: number | null;
  estimatedPartnerRate?: number | null;
  currencyCode?: string | null;
}

// Filter interface
export interface TalentAssignmentFilter {
  talentId?: number;
  projectId?: number;
  partnerId?: number;
  talentApplicationId?: number;
  status?: string;
  startDateFrom?: string; // ISO string
  startDateTo?: string; // ISO string
  endDateFrom?: string; // ISO string
  endDateTo?: string; // ISO string
  excludeDeleted?: boolean;
}

// Model for CANCEL (Draft only)
export interface TalentAssignmentCancelModel {
  cancelReason: string;
  addToBlacklist: boolean;
  blacklistReason?: string | null;
}

// Model for DIRECT BOOKING (Re-hiring)
export interface TalentAssignmentDirectBookingModel {
  talentId: number;
  projectId: number;
  partnerId: number;
  jobRoleLevelId: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  commitmentFileUrl?: string | null;
  jobDescription: string;
  estimatedClientRate?: number | null;
  estimatedPartnerRate?: number | null;
  currencyCode?: string | null;
  notes?: string | null;
}

// Response model for validate-talent
export interface TalentAssignmentValidateTalentResponse {
  success: boolean;
  talentId: number;
  projectId: number;
  canAssign: boolean;
  errorMessage?: string | null;
  message?: string | null;
}

