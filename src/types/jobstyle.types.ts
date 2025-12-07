export interface JobStyle {
  id: number;
  workingStyleId: number;
  jobRequestId: number;
}

export interface JobStyleFilter {
  workingStyleId?: number;
  jobRequestId?: number;
  excludeDeleted?: boolean;
}

export interface JobStyleCreate {
  workingStyleId: number;
  jobRequestId: number;
}

