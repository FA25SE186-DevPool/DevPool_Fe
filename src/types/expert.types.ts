export interface Expert {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  isPartnerRepresentative: boolean;
  partnerId?: number | null;
  partnerName?: string | null;
  company?: string | null;
  specialization?: string | null;
  createdAt: string; // ISO
  updatedAt?: string | null;
  isDeleted: boolean;
}

export interface ExpertFilter {
  name?: string;
  email?: string;
  isPartnerRepresentative?: boolean;
  partnerId?: number;
  excludeDeleted?: boolean;
}

export interface ExpertCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  isPartnerRepresentative?: boolean;
  partnerId?: number | null;
  company?: string | null;
  specialization?: string | null;
}

export interface ExpertUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  isPartnerRepresentative?: boolean;
  partnerId?: number | null;
  company?: string | null;
  specialization?: string | null;
}

export interface ExpertSkillGroup {
  id: number;
  expertId: number;
  expertName?: string | null;
  skillGroupId: number;
  skillGroupName?: string | null;
  assignedAt: string; // ISO
  isActive: boolean;
  createdAt: string; // ISO
  isDeleted: boolean;
}

export interface ExpertSkillGroupCreate {
  expertId: number;
  skillGroupId: number;
}

