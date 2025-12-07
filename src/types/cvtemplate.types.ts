export interface CVTemplate {
  id: number;
  name: string;
  templateFilePath: string;
  isDefault: boolean;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
  isDeleted: boolean;
}

export interface CVTemplatePayload {
  name: string;
  templateFilePath: string;
  isDefault?: boolean;
  description?: string;
}

export interface CVTemplateFilter {
  name?: string;
  isDefault?: boolean;
  excludeDeleted?: boolean;
}

