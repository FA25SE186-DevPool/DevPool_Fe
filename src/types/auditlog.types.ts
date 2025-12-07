export interface AuditLogModel {
  id: number;
  entityName: string;
  entityId: number;
  action: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  changedByName?: string | null;
  changedAt: string; // DateTime as ISO string
  reason?: string | null;
  metaData?: string | null;
}

export interface AuditLogFilterModel {
  entityName?: string;
  entityId?: number;
  action?: string;
  changedBy?: string;
  changedAtFrom?: string; // DateTime as ISO string
  changedAtTo?: string; // DateTime as ISO string
  fieldName?: string;
  metaDataSearch?: string;
  excludeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogModel[];
  pagination: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface AuditLogHistoryResponse {
  success: boolean;
  message: string;
  data: AuditLogModel[];
}

