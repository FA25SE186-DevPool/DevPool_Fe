export interface Project {
  id: number;
  code: string;
  clientCompanyId: number;
  marketId: number;
  industryIds: number[];
  industryNames?: string[];
  name: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  isDeleted: boolean;
}

export interface ProjectPayload {
  clientCompanyId: number;
  marketId: number;
  industryIds: number[];
  name: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
}

export interface ProjectFilter {
  clientCompanyId?: number;
  marketId?: number;
  industryIds?: number[];
  name?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  excludeDeleted?: boolean;
  /**
   * Page number (1-based)
   */
  pageNumber?: number;
  /**
   * Number of items per page
   */
  pageSize?: number;
}

export interface ProjectStatusUpdateModel {
  newStatus: string;
  notes?: string | null;
}

export interface ProjectStatusTransitionResult {
  success: boolean;
  message?: string;
  data?: any;
  isSuccess?: boolean;
}

export interface ProjectDetailedModel {
  id: number;
  code: string;
  clientCompanyId?: number | null;
  marketId?: number | null;
  industryIds: number[];
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  // Navigation Properties
  clientCompanyName?: string | null;
  marketName?: string | null;
  industryNames: string[];
  // Related Collections
  jobRequests?: any[];
  clientContracts?: any[];
  staffAssignments?: any[];
}

