import { WorkingMode } from "./WorkingMode";
import type { TalentSkill } from "./talentskill.types";
import type { TalentWorkExperience } from "./talentworkexperience.types";
import type { TalentProject } from "./talentproject.types";
import type { TalentCertificate } from "./talentcertificate.types";
import type { TalentJobRoleLevel } from "./talentjobrolelevel.types";
import type { TalentCV } from "./talentcv.types";
import type { TalentAvailableTime } from "./talentavailabletime.types";
import type { TalentStaffAssignment } from "./talentstaffassignment.types";

export interface Talent {
  id: number;
  code: string;
  currentPartnerId: number;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string; // DateTime as ISO string
  locationId?: number;
  workingMode: WorkingMode;
  githubUrl: string;
  portfolioUrl: string;
  status: string;
}

export interface TalentFilter {
  currentPartnerId?: number;
  fullName?: string;
  email?: string;
  locationId?: number;
  workingMode?: WorkingMode;
  status?: string;
  excludeDeleted?: boolean;
}

export interface TalentCreate {
  currentPartnerId: number;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string; // DateTime as ISO string
  bio?: string;
  locationId?: number;
  workingMode: WorkingMode;
  githubUrl: string;
  portfolioUrl: string;
  status: string;
}

// Interfaces for TalentWithRelatedDataCreateModel
export interface TalentSkillCreateModel {
  skillId: number;
  level: string;
  yearsExp: number;
}

export interface TalentWorkExperienceCreateModel {
  talentCVId?: number; // Optional when creating with initialCV - backend will assign from initialCV
  company: string;
  position: string;
  startDate: string; // DateTime as ISO string
  endDate?: string; // DateTime as ISO string
  description: string;
}

export interface TalentProjectCreateModel {
  talentCVId?: number; // Optional when creating with initialCV - backend will assign from initialCV
  projectName: string;
  position: string;
  technologies: string;
  description: string;
}

export interface TalentCertificateCreateModel {
  certificateTypeId: number;
  certificateName: string;
  certificateDescription?: string;
  issuedDate?: string; // DateTime as ISO string
  isVerified: boolean;
  imageUrl: string;
}

export interface TalentJobRoleLevelCreateModel {
  jobRoleLevelId: number;
  yearsOfExp: number;
  ratePerMonth?: number;
}

export interface TalentCVCreateModel {
  jobRoleLevelId: number;
  version: number;
  cvFileUrl: string;
  isActive: boolean;
  summary: string;
  isGeneratedFromTemplate: boolean;
  sourceTemplateId?: number;
  generatedForJobRequestId?: number | null;
}

export interface TalentWithRelatedDataCreateModel {
  // Thông tin cơ bản của Talent
  currentPartnerId: number;
  userId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // DateTime as ISO string
  bio?: string;
  locationId?: number;
  workingMode: WorkingMode;
  githubUrl?: string;
  portfolioUrl?: string;
  status?: string;

  // Các dữ liệu liên quan (optional)
  initialCV?: TalentCVCreateModel;
  skills?: TalentSkillCreateModel[];
  workExperiences?: TalentWorkExperienceCreateModel[];
  projects?: TalentProjectCreateModel[];
  certificates?: TalentCertificateCreateModel[];
  jobRoleLevels?: TalentJobRoleLevelCreateModel[];
}

export interface TalentStatusUpdateModel {
  newStatus: string;
  notes?: string;
}

export interface TalentUpdateModel {
  phone?: string;
  dateOfBirth?: string; // DateTime as ISO string
  portfolioUrl?: string;
  githubUrl?: string;
  bio?: string;
}

export interface TalentStatusTransitionResult {
  isSuccess: boolean;
  message: string;
  previousStatus?: string;
  newStatus?: string;
  validationErrors?: string[];
}

export interface CreateDeveloperAccountModel {
  email: string;
}

export interface CreateDeveloperAccountResult {
  success: boolean;
  message: string;
  data?: {
    generatedPassword: string;
    email: string;
  };
}

export interface HandoverTalentRequest {
  toUserId: string;
  note?: string | null;
}

export interface HandoverTalentResponse {
  success: boolean;
  message: string;
}

// Interface cho TalentDetailedModel (từ API /talent/detailed)
export interface TalentDetailedModel {
  id: number;
  userId?: string | null;
  currentPartnerId?: number | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // DateTime as ISO string
  locationId?: number | null;
  address?: string | null;
  workingMode?: string | null;
  status?: string | null;
  linkedInProfile?: string | null;
  gitHubProfile?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  createdAt: string; // DateTime as ISO string
  updatedAt: string; // DateTime as ISO string
  
  // Related Collections
  skills: TalentSkill[];
  workExperiences: TalentWorkExperience[];
  projects: TalentProject[];
  certificates: TalentCertificate[];
  jobRoleLevels: TalentJobRoleLevel[];
  cvs: TalentCV[];
  availableTimes: TalentAvailableTime[];
  staffAssignments: TalentStaffAssignment[];
  
  // Navigation Properties (optional - for display purposes)
  locationName?: string | null;
  currentPartnerName?: string | null;
}

