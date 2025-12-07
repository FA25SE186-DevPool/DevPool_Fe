// Interface cho DocumentType (Model trả về từ API)
export interface DocumentType {
  id: number;
  typeName: string;
  description?: string | null;
}

// Interface cho DocumentTypeCreate (Payload để tạo mới)
export interface DocumentTypeCreate {
  typeName: string;
  description?: string | null;
}

// Interface cho DocumentTypeFilter (Filter để lấy danh sách)
export interface DocumentTypeFilter {
  typeName?: string;
  excludeDeleted?: boolean;
}

