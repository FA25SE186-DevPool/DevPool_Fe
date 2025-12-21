/**
 * Re-export tất cả services để import dễ dàng
 * import { authService, userService } from '../services';
 * 
 * Note: Types nên được import trực tiếp từ '../types' để tránh conflict
 */

// Auth
export { authService } from './Auth';
export type { BackendRole, FrontendRole, LoginPayload, RegisterPayload, UserProvisionPayload, UserProvisionResponse, LoginResponse, JwtPayload } from './Auth';

// User
export { userService } from './User';

// Dashboard
export { dashboardService } from './Dashboard';
export type { ExecutiveDashboardModel, FinancialDashboardModel, TalentManagementDashboardModel, ProjectAssignmentDashboardModel, OperationsDashboardModel, AnalyticsReportsModel } from './Dashboard';

// Notification
export { notificationService } from './Notification';
export type { NotificationType, NotificationPriority, Notification, NotificationCreate, NotificationFilter, NotificationListResult } from './Notification';
export * from './notificationHub';

// Talent
export { talentService } from './Talent';
export { talentApplicationService } from './TalentApplication';
export { talentAssignmentService } from './TalentAssignment';
export { talentAvailableTimeService } from './TalentAvailableTime';
export { talentCertificateService } from './TalentCertificate';
export { talentCVService } from './TalentCV';
export { talentJobRoleLevelService } from './TalentJobRoleLevel';
export { talentProjectService } from './TalentProject';
export { talentSkillService } from './TalentSkill';
export { talentSkillGroupAssessmentService } from './TalentSkillGroupAssessment';
export { talentStaffAssignmentService } from './TalentStaffAssignment';
export { talentWorkExperienceService } from './TalentWorkExperience';

// Job Request
export { jobRequestService } from './JobRequest';
export type { JobRequestStatus } from './JobRequest';
// Note: JobSkill type từ JobRequest khác với JobSkill từ JobSkill service

// Apply
export { applyService } from './Apply';
export { applyActivityService } from './ApplyActivity';
export { applyProcessStepService } from './ApplyProcessStep';
export { applyProcessTemplateService } from './ApplyProcessTemplate';

// Partner
export { partnerService } from './Partner';
export { partnerContractPaymentService } from './PartnerContractPayment';
export { partnerDashboardService } from './PartnerDashboard';
export { partnerDocumentService } from './PartnerDocument';
export { partnerPaymentPeriodService } from './PartnerPaymentPeriod';
export type { PartnerDashboardStats, PartnerTalentSummary, PartnerTalentDetail, PartnerAssignmentSummary, PartnerMonthlyPayment, PartnerPaymentDetail, PartnerPaymentProof } from './PartnerDashboard';

// Client Company
export { clientCompanyService } from './ClientCompany';
export { clientCompanyCVTemplateService } from './ClientCompanyTemplate';
export { clientContractPaymentService } from './ClientContractPayment';
export { clientDocumentService } from './ClientDocument';
export { clientJobRoleLevelService } from './ClientJobRoleLevel';
export { clientPaymentPeriodService } from './ClientPaymentPeriod';
export { clientTalentBlacklistService } from './ClientTalentBlacklist';

// Project
export { projectService } from './Project';
export { projectPeriodService } from './ProjectPeriod';

// Contact Inquiry
export { contactInquiryService } from './ContactInquiry';
export { ContactInquiryStatus, ContactInquiryStatusConstants } from './ContactInquiry';
// Note: PagedResult được export từ nhiều nơi, nên import từ types/common.types

// Document Type
export { documentTypeService } from './DocumentType';

// Industry
export { industryService } from './Industry';

// Skill
export { skillService } from './Skill';
export { skillGroupService } from './SkillGroup';

// Job Role
export { jobRoleService } from './JobRole';
export { jobRoleLevelService } from './JobRoleLevel';
export { jobRoleLevelSkillService } from './JobRoleLevelSkill';
export { jobSkillService } from './JobSkill';
export { jobStyleService } from './JobStyle';

// Master Data
export { masterDataService } from './MasterData';

// Location
export { locationService } from './location';

// Market
export { marketService } from './Market';

// Expert
export { expertService } from './Expert';

// Certificate Type
export { certificateTypeService } from './CertificateType';

// CV Template
export { cvTemplateService } from './CVTemplate';

// Audit Log
export { auditLogService } from './AuditLog';

// Exchange Rate
export { exchangeRateService } from './ExchangeRate';
export type { CurrencyCode, ExchangeRateResponse } from './ExchangeRate';
export { AVAILABLE_CURRENCIES } from './ExchangeRate';

