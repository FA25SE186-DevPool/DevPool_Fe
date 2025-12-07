export interface TalentSkillGroupAssessment {
  id: number;
  talentId: number;
  talentName?: string | null;
  skillGroupId: number;
  skillGroupName?: string | null;
  expertId?: number | null;
  expertName?: string | null;
  verifiedByName?: string | null;
  assessmentDate: string; // DateTime từ API, dùng string ISO
  isVerified: boolean;
  note?: string | null;
  skillSnapshot?: string | null;
  excelFileUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  isDeleted: boolean;
}

export interface TalentSkillGroupAssessmentFilter {
  talentId?: number;
  skillGroupId?: number;
  expertId?: number;
  isVerified?: boolean;
  isActive?: boolean;
  assessmentDateFrom?: string; // ISO string
  assessmentDateTo?: string; // ISO string
  excludeDeleted?: boolean;
}

export interface VerifiedSkillUpdate {
  skillId: number;
  level: string;
  yearsExp: number;
}

export interface TalentSkillGroupAssessmentCreate {
  talentId: number;
  skillGroupId: number;
  expertId?: number | null;
  verifiedByName?: string | null;
  assessmentDate: string; // ISO string, FE sẽ gửi lên
  isVerified: boolean;
  note?: string | null;
  skillSnapshot?: string | null;
  excelFileUrl?: string | null;
  verifiedSkills?: VerifiedSkillUpdate[];
}

export interface SkillGroupVerificationStatus {
  talentId: number;
  skillGroupId: number;
  skillGroupName?: string | null;
  isVerified: boolean;
  lastVerifiedDate?: string | null;
  lastVerifiedByExpertId?: number | null;
  lastVerifiedByExpertName?: string | null;
  needsReverification: boolean;
  reason?: string | null;
}

