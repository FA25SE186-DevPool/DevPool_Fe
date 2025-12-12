// Interface cho ClientContractPayment (Model trả về từ API)
export interface ClientContractPaymentModel {
  id: number;
  projectPeriodId: number;
  talentAssignmentId: number;

  // Contract Info
  contractNumber: string;

  // Currency & Exchange Rate
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;

  // Calculation Method
  calculationMethod: string;
  percentageValue?: number | null;
  fixedAmount?: number | null;

  // Contract Info
  standardHours: number;
  sowDescription?: string | null;

  // Contract Dates
  contractStartDate: string; // ISO string
  contractEndDate: string; // ISO string

  contractStatus: string;

  // Payment Info
  reportedHours?: number | null;
  billableHours?: number | null;
  manMonthCoefficient?: number | null;
  plannedAmountVND?: number | null;
  actualAmountVND?: number | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null; // ISO string
  totalPaidAmount: number;
  lastPaymentDate?: string | null; // ISO string
  paymentStatus: string;

  // Rejection
  rejectionReason?: string | null;
  notes?: string | null;
  tierBreakdown?: any | null;
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string

  // Computed Property
  isFinished: boolean;

  // Navigation Properties (for display)
  projectName?: string | null;
  clientCompanyName?: string | null;
  talentName?: string | null;
  partnerName?: string | null;
}

// Interface cho ClientContractPaymentCreate (Payload để tạo mới)
export interface ClientContractPaymentCreateModel {
  projectPeriodId: number;
  talentAssignmentId: number;
  contractNumber: string;

  // Currency & Exchange Rate
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;

  // Calculation Method
  calculationMethod: string;
  percentageValue?: number | null;
  fixedAmount?: number | null;

  // Contract Dates
  contractStartDate: string; // ISO string
  contractEndDate: string; // ISO string

  // Contract Info
  standardHours: number;
  sowDescription?: string | null;

  contractStatus: string;

  plannedAmountVND?: number | null;
  actualAmountVND?: number | null;
  reportedHours?: number | null;
  billableHours?: number | null;
  manMonthCoefficient?: number | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null; // ISO string
  totalPaidAmount: number;
  lastPaymentDate?: string | null; // ISO string
  paymentStatus: string;
  rejectionReason?: string | null;
  notes?: string | null;
}

// Interface cho ClientContractPaymentFilter (Filter để lấy danh sách)
export interface ClientContractPaymentFilter {
  projectPeriodId?: number;
  talentAssignmentId?: number;
  talentId?: number;
  contractStatus?: string;
  paymentStatus?: string;
  isFinished?: boolean;
  contractDateFrom?: string; // ISO string
  contractDateTo?: string; // ISO string
  invoiceDateFrom?: string; // ISO string
  invoiceDateTo?: string; // ISO string
  paymentDateFrom?: string; // ISO string
  paymentDateTo?: string; // ISO string
  excludeDeleted?: boolean;
}

// Interface cho ClientContractPaymentCalculateModel (Payload để tính toán)
export interface ClientContractPaymentCalculateModel {
  billableHours: number;
  timesheetFileUrl?: string | null;
  autoSyncToPartner?: boolean;
  notes?: string | null;
}

// Interface cho SubmitContractModel (Payload để submit contract với SOW)
export interface SubmitContractModel {
  unitPriceForeignCurrency: number;
  currencyCode: string;
  exchangeRate: number;
  calculationMethod: string;
  percentageValue?: number | null;
  fixedAmount?: number | null;
  plannedAmountVND?: number | null;
  sowDescription?: string | null;
  sowExcelFileUrl: string;
  standardHours: number;
  notes?: string | null;
}

// Interface cho VerifyContractModel (Payload để verify contract)
export interface VerifyContractModel {
  notes?: string | null;
  // File hợp đồng chuẩn sẽ được upload riêng
}

// Interface cho RecordPaymentModel (Payload để ghi nhận thanh toán)
export interface RecordPaymentModel {
  receivedAmount: number;
  paymentDate: string; // ISO string
  notes?: string | null;
  clientReceiptFileUrl?: string | null;
}

// Interface cho CreateInvoiceModel (Payload để tạo hóa đơn)
export interface CreateInvoiceModel {
  invoiceNumber: string;
  invoiceDate: string; // ISO string
  notes?: string | null;
  // File invoice sẽ được upload riêng
}

// Interface cho ApproveContractModel (Payload để duyệt hợp đồng)
export interface ApproveContractModel {
  notes?: string | null;
}

// Interface cho RejectContractModel (Payload để reject contract)
export interface RejectContractModel {
  rejectionReason: string;
}

// Interface cho RequestMoreInformationModel (Payload để yêu cầu thêm thông tin)
export interface RequestMoreInformationModel {
  notes?: string | null;
}

