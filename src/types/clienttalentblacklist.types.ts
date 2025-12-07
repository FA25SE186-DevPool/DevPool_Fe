export interface ClientTalentBlacklist {
  id: number;
  clientCompanyId: number;
  clientCompanyName?: string;
  talentId: number;
  talentName?: string;
  reason: string;
  isActive: boolean;
  requestedBy?: string;
  blacklistedDate: string; // DateTime as ISO string
  removedDate?: string; // DateTime as ISO string
  removedBy?: string;
  removalReason?: string;
  createdAt: string; // DateTime as ISO string
  updatedAt?: string; // DateTime as ISO string
}

export interface ClientTalentBlacklistFilter {
  clientCompanyId?: number;
  talentId?: number;
  isActive?: boolean;
  blacklistedDateFrom?: string; // DateTime as ISO string
  blacklistedDateTo?: string; // DateTime as ISO string
  excludeDeleted?: boolean;
}

export interface ClientTalentBlacklistCreate {
  clientCompanyId: number;
  talentId: number;
  reason: string;
  requestedBy?: string;
  blacklistedDate?: string; // DateTime as ISO string
}

export interface ClientTalentBlacklistRemove {
  removedBy: string;
  removalReason?: string;
}

export interface CheckBlacklistedResult {
  success: boolean;
  isBlacklisted: boolean;
}

