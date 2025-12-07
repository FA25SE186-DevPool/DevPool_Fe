export interface ClientJobRoleLevel {
  id: number;
  clientCompanyId: number;
  jobRoleLevelId: number;
  expectedMinRate?: number | null;
  expectedMaxRate?: number | null;
  currency?: string | null;
  notes?: string | null;
}

export interface ClientJobRoleLevelCreate {
  clientCompanyId: number;
  jobRoleLevelId: number;
  expectedMinRate?: number | null;
  expectedMaxRate?: number | null;
  currency?: string | null;
  notes?: string | null;
}

export interface ClientJobRoleLevelFilter {
  clientCompanyId?: number;
  jobRoleLevelId?: number;
  currency?: string;
  excludeDeleted?: boolean;
}

