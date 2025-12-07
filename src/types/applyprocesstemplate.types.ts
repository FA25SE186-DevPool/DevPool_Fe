export interface ApplyProcessTemplate {
  id: number;
  name: string;
  description: string;
}

export interface ApplyProcessTemplateFilter {
  name?: string;
  excludeDeleted?: boolean;
}

export interface ApplyProcessTemplateCreatePayload {
  name: string;
  description?: string;
}

