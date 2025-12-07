export interface TalentWorkExperience {
  id: number;
  talentId: number;
  talentCVId: number;
  company: string;
  position: string;
  startDate: string; // DateTime as ISO string
  endDate?: string; // DateTime as ISO string
  description: string;
}

export interface TalentWorkExperienceFilter {
  talentId?: number;
  talentCVId?: number;
  company?: string;
  position?: string;
  excludeDeleted?: boolean;
}

export interface TalentWorkExperienceCreate {
  talentId: number;
  talentCVId: number;
  company: string;
  position: string;
  startDate: string; // DateTime as ISO string
  endDate?: string; // DateTime as ISO string
  description: string;
}