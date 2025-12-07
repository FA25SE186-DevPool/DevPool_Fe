// Interface cho ClientDocument (Model trả về từ API)
export interface ClientDocument {
  id: number;
  clientContractPaymentId: number;
  documentTypeId: number;
  referencedPartnerDocumentId?: number | null;
  fileName: string;
  filePath: string;
  uploadTimestamp: string; // DateTime được trả về dưới dạng string ISO
  uploadedByUserId: string;
  description?: string | null;
  source?: string | null;
}

// Interface cho ClientDocumentCreate (Payload để tạo mới)
export interface ClientDocumentCreate {
  clientContractPaymentId: number;
  documentTypeId: number;
  referencedPartnerDocumentId?: number | null;
  fileName: string;
  filePath: string;
  uploadedByUserId: string;
  description?: string | null;
  source?: string | null;
}

// Interface cho ClientDocumentFilter (Filter để lấy danh sách)
export interface ClientDocumentFilter {
  clientContractPaymentId?: number;
  documentTypeId?: number;
  uploadedByUserId?: string;
  source?: string;
  uploadDateFrom?: string; // DateTime dưới dạng string ISO
  uploadDateTo?: string; // DateTime dưới dạng string ISO
  excludeDeleted?: boolean;
}

