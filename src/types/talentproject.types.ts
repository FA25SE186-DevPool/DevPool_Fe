export interface TalentProject {
  id: number;
  talentId: number;
  talentCVId: number;
  projectName: string;
  position: string;
  technologies: string;
  description: string;
}

export interface TalentProjectFilter {
  talentId?: number;
  talentCVId?: number;
  projectName?: string;
  position?: string;
  excludeDeleted?: boolean;
}

export interface TalentProjectCreate {
  talentId: number;
  talentCVId: number;
  projectName: string;
  position: string;
  technologies: string;
  description: string;
}

