export interface Apply {
  id: number;
  jobRequestId: number;
  cvId: number;
  submittedBy: string;
  recruiterId: string;
  recruiterName: string;
  status: string;
  note: string;
  convertedCVPath?: string;
  createdAt: string;
}

export interface ApplyCreate {
  jobRequestId: number;
  cvId: number;
  submittedBy: string;
  note?: string;
  convertedCVPath?: string;
}

export interface ApplyStatusUpdate {
  status: string;
  note?: string;
}

export interface ApplyFilter {
  jobRequestId?: number;
  cvId?: number;
  status?: string;
}

