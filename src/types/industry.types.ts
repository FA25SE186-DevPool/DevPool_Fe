//  Industry
export interface Industry {
  id: number;
  name: string;
  code: string;
  description?: string;
}

// Payload tạo hoặc update Industry
export interface IndustryPayload {
  name: string;
  code: string;
  description: string;
}

// Filter dùng khi lấy danh sách Industry
export interface IndustryFilter {
  name?: string;
  excludeDeleted?: boolean;
}

