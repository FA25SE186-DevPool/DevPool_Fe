export interface TalentCV {
  id: number;
  talentId: number;
  jobRoleLevelId: number;
  version: number;
  cvFileUrl: string;
  isActive: boolean;
  summary: string;
  isGeneratedFromTemplate: boolean;
  sourceTemplateId?: number;
  generatedForJobRequestId?: number | null;
}

export interface TalentCVFilter {
  talentId?: number;
  jobRoleLevelId?: number; 
  isActive?: boolean;
  isGeneratedFromTemplate?: boolean;
  excludeDeleted?: boolean;
  /**
   * Page number (1-based)
   */
  pageNumber?: number;
  /**
   * Number of items per page
   */
  pageSize?: number;
}

export interface TalentCVCreate {
  talentId: number;
  jobRoleLevelId: number;
  version: number;
  cvFileUrl: string;
  isActive: boolean;
  summary: string;
  isGeneratedFromTemplate: boolean;
  sourceTemplateId?: number;
  generatedForJobRequestId?: number | null;
}

export interface TalentCVMatchResult {
  talentCV: TalentCV;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  levelMatch: boolean;
  matchSummary: string;
}

export interface TalentCVJobRequestFilter {
  jobRequestId: number;
  excludeDeleted?: boolean;
  maxResults?: number;
}

export interface TalentCVExtractResponse {
  originalText: string;
  generateText: string;
  isSuccess: boolean;
}

export interface BasicInfoData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  locationName: string;
  githubUrl: string;
  portfolioUrl: string;
  workingMode: string;
}

export interface BasicInfoComparison {
  current: BasicInfoData;
  suggested: BasicInfoData;
  hasChanges: boolean;
}

export interface SkillComparisonItem {
  skillId: number;
  skillName: string;
  level: string;
  yearsExp: number;
}

export interface SkillMatchResult {
  skillId: number;
  skillName: string;
  cvMention: string;
  cvLevel: string;
  cvYearsExp?: number | null;
  matchConfidence: number;
}

export interface ExtractedSkill {
  skillName: string;
  level: string;
  yearsExp?: number | null;
}

export interface SkillsComparison {
  existing: SkillComparisonItem[];
  newFromCV: ExtractedSkill[];
  matched: SkillMatchResult[];
}

export interface ExistingWorkExperienceData {
  id: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  description: string;
}

export interface ExtractedWorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface WorkExperienceDuplicateCheck {
  existing: ExistingWorkExperienceData;
  fromCV: ExtractedWorkExperience;
  similarityScore: number;
  recommendation: string;
  differencesSummary: string[];
}

export interface WorkExperiencesComparison {
  potentialDuplicates: WorkExperienceDuplicateCheck[];
  newEntries: ExtractedWorkExperience[];
}

export interface ExistingProjectData {
  id: number;
  projectName: string;
  position: string;
  technologies: string;
  description: string;
}

export interface ExtractedProject {
  projectName: string;
  position: string;
  description: string;
  technologies: string;
}

export interface ProjectDuplicateCheck {
  existing: ExistingProjectData;
  fromCV: ExtractedProject;
  similarityScore: number;
  recommendation: string;
  differencesSummary: string[];
}

export interface ProjectsComparison {
  potentialDuplicates: ProjectDuplicateCheck[];
  newEntries: ExtractedProject[];
}

export interface ExistingCertificateData {
  id: number;
  certificateTypeName: string;
  issuedDate?: string | null;
  isVerified: boolean;
  imageUrl: string;
}

export interface ExtractedCertificate {
  certificateName: string;
  issuedDate: string;
  imageUrl: string;
}

export interface CertificatesComparison {
  existing: ExistingCertificateData[];
  newFromCV: ExtractedCertificate[];
}

export interface JobRoleLevelComparisonItem {
  id: number;
  position: string;
  level: string;
  yearsOfExp: number;
  ratePerMonth?: number | null;
}

export interface ExtractedJobRoleLevel {
  position: string;
  level: string;
  yearsOfExp?: number | null;
  ratePerMonth?: number | null;
}

export interface JobRoleLevelsComparison {
  existing: JobRoleLevelComparisonItem[];
  newFromCV: ExtractedJobRoleLevel[];
}

export interface BasicInfoUpdateDecision {
  updateFullName: boolean;
  updateEmail: boolean;
  updatePhone: boolean;
  updateDateOfBirth: boolean;
  updateLocation: boolean;
  updateGithubUrl: boolean;
  updatePortfolioUrl: boolean;
  updateWorkingMode: boolean;
  newFullName?: string;
  newEmail?: string;
  newPhone?: string;
  newDateOfBirth?: string | null;
  newLocationId?: number | null;
  newGithubUrl?: string;
  newPortfolioUrl?: string;
  newWorkingMode?: string;
}

export interface SkillsUpdateDecision {
  skillIdsToAdd: number[];
  skillIdsToRemove: number[];
}

export type WorkExperienceActionType = "UPDATE" | "ADD_NEW" | "SKIP";

export interface WorkExperienceUpdateAction {
  actionType: WorkExperienceActionType;
  existingId?: number | null;
  newData: ExtractedWorkExperience;
}

export interface WorkExperiencesUpdateDecision {
  actions: WorkExperienceUpdateAction[];
}

export type ProjectActionType = "UPDATE" | "ADD_NEW" | "SKIP";

export interface ProjectUpdateAction {
  actionType: ProjectActionType;
  existingId?: number | null;
  newData: ExtractedProject;
}

export interface ProjectsUpdateDecision {
  actions: ProjectUpdateAction[];
}

export type CertificateActionType = "ADD_NEW" | "SKIP";

export interface CertificateUpdateAction {
  actionType: CertificateActionType;
  newData: ExtractedCertificate;
}

export interface CertificatesUpdateDecision {
  actions: CertificateUpdateAction[];
}

export type JobRoleLevelActionType = "ADD_NEW" | "SKIP";

export interface JobRoleLevelUpdateAction {
  actionType: JobRoleLevelActionType;
  newData: ExtractedJobRoleLevel;
}

export interface JobRoleLevelsUpdateDecision {
  actions: JobRoleLevelUpdateAction[];
}

export interface ApplyCVUpdatesRequest {
  basicInfo?: BasicInfoUpdateDecision;
  skills?: SkillsUpdateDecision;
  workExperiences?: WorkExperiencesUpdateDecision;
  projects?: ProjectsUpdateDecision;
  certificates?: CertificatesUpdateDecision;
  jobRoleLevels?: JobRoleLevelsUpdateDecision;
}

export interface UpdateStatistics {
  skillsAdded: number;
  skillsRemoved: number;
  workExperiencesAdded: number;
  workExperiencesUpdated: number;
  projectsAdded: number;
  projectsUpdated: number;
  certificatesAdded: number;
  jobRoleLevelsAdded: number;
  basicInfoUpdated: boolean;
}

export interface ApplyCVUpdatesResponse {
  isSuccess: boolean;
  message: string;
  statistics: UpdateStatistics;
}

export interface CVAnalysisComparisonResponse {
  isSuccess: boolean;
  errorMessage?: string | null;
  basicInfo: BasicInfoComparison;
  skills: SkillsComparison;
  workExperiences: WorkExperiencesComparison;
  projects: ProjectsComparison;
  certificates: CertificatesComparison;
  jobRoleLevels: JobRoleLevelsComparison;
  rawExtractedText: string;
  ownershipVerification?: {
    isVerified: boolean;
    isFirstCV?: boolean;
    method?: string;
    confidenceScore?: number;
    recommendation?: string;
    reasoning?: string;
    message?: string;
    criticalWarnings?: string[];
    minorWarnings?: string[];
    suggestedFieldsToAdd?: string[];
    missingInformation?: string[];
  } | null;
}

export interface TalentCVExtractRequest {
  filePDF: File;
}

export interface TalentCVToggleActiveModel {
  isActive: boolean;
}

export interface TalentCVFieldsUpdateModel {
  talentId: number;
  summary?: string | null;
  isActive?: boolean;
  isGeneratedFromTemplate?: boolean;
}

