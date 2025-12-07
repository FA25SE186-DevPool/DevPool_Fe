// Interface cho PartnerDocument (Model trả về từ API)
export interface PartnerDocument {
  id: number;
  partnerContractPaymentId: number;
  documentTypeId: number;
  referencedClientDocumentId?: number | null;
  fileName: string;
  filePath: string;
  uploadTimestamp: string; // DateTime được trả về dưới dạng string ISO
  uploadedByUserId: string;
  description?: string | null;
  source?: string | null;
}

// Interface cho PartnerDocumentCreate (Payload để tạo mới)
export interface PartnerDocumentCreate {
  partnerContractPaymentId: number;
  documentTypeId: number;
  referencedClientDocumentId?: number | null;
  fileName: string;
  filePath: string;
  uploadedByUserId: string;
  description?: string | null;
  source?: string | null;
}

// Interface cho PartnerDocumentFilter (Filter để lấy danh sách)
export interface PartnerDocumentFilter {
  partnerContractPaymentId?: number;
  documentTypeId?: number;
  uploadedByUserId?: string;
  source?: string;
  uploadDateFrom?: string; // DateTime dưới dạng string ISO
  uploadDateTo?: string; // DateTime dưới dạng string ISO
  excludeDeleted?: boolean;
}

