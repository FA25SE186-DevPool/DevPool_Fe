export interface JobRole {
  id: number;
  name: string;
  description?: string | null;
}

export interface JobRoleFilter {
  name?: string;
  excludeDeleted?: boolean;
}

export interface JobRoleCreatePayload {
  name: string;
  description?: string;
}

