// Interface cho ClientPaymentPeriod (Model trả về từ API)
export interface ClientPaymentPeriod {
  id: number;
  clientCompanyId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
}

// Interface cho ClientPaymentPeriodCreate (Payload để tạo mới)
export interface ClientPaymentPeriodCreate {
  clientCompanyId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
}

// Interface cho ClientPaymentPeriodFilter (Filter để lấy danh sách)
export interface ClientPaymentPeriodFilter {
  clientCompanyId?: number;
  periodMonth?: number;
  periodYear?: number;
  status?: string;
  excludeDeleted?: boolean;
}

