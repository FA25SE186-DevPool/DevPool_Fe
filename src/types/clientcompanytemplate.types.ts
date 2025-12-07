export interface ClientCompanyTemplate {
  clientCompanyId: number;
  clientCompanyName: string;
  templateId: number;
  templateName: string;
  templateFilePath: string;
  isDefault: boolean;
  templateDescription?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export interface ClientCompanyTemplateFilter {
  clientCompanyId?: number;
  excludeDeleted?: boolean;
}

