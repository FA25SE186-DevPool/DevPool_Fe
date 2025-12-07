export interface TalentJobRoleLevel {
  id: number;
  talentId: number;
  jobRoleLevelId: number;
  yearsOfExp: number;
  ratePerMonth?: number;
}

export interface TalentJobRoleLevelFilter {
  talentId?: number;
  jobRoleLevelId?: number;
  minYearsOfExp?: number;
  excludeDeleted?: boolean;
}

export interface TalentJobRoleLevelCreate {
  talentId: number;
  jobRoleLevelId: number;
  yearsOfExp: number;
  ratePerMonth?: number;
}

