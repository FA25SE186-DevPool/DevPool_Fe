// Interface cho ProjectPeriod (Model trả về từ API)
export interface ProjectPeriodModel {
  id: number;
  projectId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
  notes?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
}

// Interface cho ProjectPeriodCreate (Payload để tạo mới)
export interface ProjectPeriodCreateModel {
  projectId: number;
  periodMonth: number;
  periodYear: number;
  status?: string; // Default: "Open"
  notes?: string | null;
  autoCreatePayments?: boolean; // Default: true - Auto-create ClientContractPayment and PartnerContractPayment for active assignments
}

// Interface cho ProjectPeriodFilter (Filter để lấy danh sách)
export interface ProjectPeriodFilter {
  projectId?: number;
  periodMonth?: number;
  periodYear?: number;
  status?: string;
  excludeDeleted?: boolean;
}

