// Interface cho PartnerPaymentPeriod (Model trả về từ API)
export interface PartnerPaymentPeriod {
  id: number;
  partnerId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
}

// Interface cho PartnerPaymentPeriodCreate (Payload để tạo mới)
export interface PartnerPaymentPeriodCreate {
  partnerId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
}

// Interface cho PartnerPaymentPeriodFilter (Filter để lấy danh sách)
export interface PartnerPaymentPeriodFilter {
  partnerId?: number;
  periodMonth?: number;
  periodYear?: number;
  status?: string;
  excludeDeleted?: boolean;
}

