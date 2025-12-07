// Interface cho PartnerContractPayment (Model trả về từ API)
export interface PartnerContractPaymentModel {
  id: number;
  projectPeriodId: number;
  talentAssignmentId: number;

  // Contract Info
  contractNumber: string;
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;
  calculationMethod: "Percentage" | "Fixed";
  percentageValue?: number | null;
  fixedAmount?: number | null;
  standardHours: number;
  contractStatus: string;

  // Payment Info
  reportedHours?: number | null;
  manMonthCoefficient?: number | null;
  plannedAmountVND?: number | null;
  actualAmountVND?: number | null;
  totalPaidAmount: number;
  paymentDate?: string | null; // ISO string
  paymentStatus: string;
  tierBreakdown?: any | null;

  // Rejection
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
}

// Interface cho PartnerContractPaymentCreate (Payload để tạo mới)
export interface PartnerContractPaymentCreateModel {
  projectPeriodId: number;
  talentAssignmentId: number;
  contractNumber: string;
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;
  calculationMethod: "Percentage" | "Fixed";
  percentageValue?: number | null;
  fixedAmount?: number | null;
  standardHours: number;
  contractStatus: string;
  reportedHours?: number | null;
  manMonthCoefficient?: number | null;
  plannedAmountVND?: number | null;
  actualAmountVND?: number | null;
  totalPaidAmount: number;
  paymentDate?: string | null; // ISO string
  paymentStatus: string;
  tierBreakdown?: any | null;
  rejectionReason?: string | null;
  notes?: string | null;
}

// Interface cho PartnerContractPaymentFilter (Filter để lấy danh sách)
export interface PartnerContractPaymentFilter {
  projectPeriodId?: number;
  talentAssignmentId?: number;
  talentId?: number;
  contractStatus?: string;
  paymentStatus?: string;
  paymentDateFrom?: string; // ISO string
  paymentDateTo?: string; // ISO string
  excludeDeleted?: boolean;
}

// Interface cho PartnerContractPaymentCalculateModel (Payload để tính toán)
export interface PartnerContractPaymentCalculateModel {
  actualWorkHours: number;
  notes?: string | null;
}

// Interface cho MarkAsPaidModel (Payload để ghi nhận đã chi trả)
export interface PartnerContractPaymentMarkAsPaidModel {
  paidAmount: number;
  paymentDate: string; // ISO string
  notes?: string | null;
  paymentProofFileUrl?: string | null;
  partnerReceiptFileUrl?: string | null;
}

// Interface cho VerifyContractModel (Payload để xác minh hợp đồng)
export interface PartnerContractPaymentVerifyModel {
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;
  calculationMethod: "Percentage" | "Fixed";
  percentageValue?: number | null;
  fixedAmount?: number | null;
  standardHours: number;
  notes?: string | null;
}

// Interface cho ApproveContractModel (Payload để duyệt hợp đồng)
export interface PartnerContractPaymentApproveModel {
  notes?: string | null;
}

// Interface cho RejectContractModel (Payload để từ chối hợp đồng)
export interface PartnerContractPaymentRejectModel {
  rejectionReason: string;
}

