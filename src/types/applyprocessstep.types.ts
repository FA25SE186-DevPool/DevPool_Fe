export interface ApplyProcessStep {
  id: number;
  templateId: number;
  stepOrder: number;
  stepName: string;
  description: string;
}

export interface ApplyProcessStepFilter {
  templateId?: number;
  stepName?: string;
  excludeDeleted?: boolean;
}

export interface ApplyProcessStepCreate {
  templateId: number;
  stepOrder: number;
  stepName: string;
  description: string;
}

