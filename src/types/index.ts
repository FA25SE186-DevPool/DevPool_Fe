/**
 * Re-export tất cả types để import dễ dàng
 * import { User, Product } from '../types';
 * 
 * Note: Một số types có thể bị conflict (như PagedResult, JobSkill),
 * trong trường hợp đó nên import trực tiếp từ file cụ thể
 */

// Common types (nên import từ đây)
export * from './common.types';

// Auth
export * from './auth.types';

// User
export * from './user.types';

// Dashboard
export * from './dashboard.types';

// Notification
export * from './notification.types';

// Talent
export * from './talent.types';
export * from './talentapplication.types';
export * from './talentassignment.types';
export * from './talentavailabletime.types';
export * from './talentcertificate.types';
export * from './talentcv.types';
export * from './talentjobrolelevel.types';
export * from './talentproject.types';
export * from './talentskill.types';
export * from './talentskillgroupassessment.types';
export * from './talentstaffassignment.types';
export * from './talentworkexperience.types';

// Job Request
export * from './jobrequest.types';
// Note: JobSkill trong jobrequest.types khác với JobSkill trong jobskill.types
// Nếu cần cả hai, import trực tiếp từ file cụ thể

// Apply
export * from './apply.types';
export * from './applyactivity.types';
export * from './applyprocessstep.types';
export * from './applyprocesstemplate.types';

// Partner
export * from './partner.types';
export * from './partnercontractpayment.types';
export * from './partnerdocument.types';
export * from './partnerpaymentperiod.types';

// Client Company
export * from './clientcompany.types';
export * from './clientcompanytemplate.types';
export * from './clientcontractpayment.types';
export * from './clientdocument.types';
export * from './clientjobrolelevel.types';
export * from './clientpaymentperiod.types';
export * from './clienttalentblacklist.types';

// Project
export * from './project.types';
export * from './projectperiod.types';

// Contact Inquiry
// Note: PagedResult trong contactinquiry.types đã được chuyển sang common.types
export type { ContactInquiryStatusType, ContactInquiryModel, ContactInquiryCreateModel, ContactInquiryFilterModel, ContactInquiryStatusUpdateModel, ContactInquiryClaimResult, ContactInquiryStatusTransitionResult } from './contactinquiry.types';
export { ContactInquiryStatus, ContactInquiryStatusConstants } from './contactinquiry.types';

// Document Type
export * from './documenttype.types';

// Industry
export * from './industry.types';

// Skill
export * from './skill.types';
export * from './skillgroup.types';

// Job Role
export * from './jobrole.types';
export * from './jobrolelevel.types';
export * from './jobrolelevelskill.types';
// JobSkill từ jobskill.types (khác với JobSkill trong jobrequest.types)
export type { JobSkill as JobSkillEntity, JobSkillPayload, JobSkillFilter } from './jobskill.types';
export * from './jobstyle.types';

// Location
export * from './location.types';

// Market
export * from './market.types';

// Expert
export * from './expert.types';

// Certificate Type
export * from './certificatetype.types';

// CV Template
export * from './cvtemplate.types';

// Audit Log
export * from './auditlog.types';

// Working Mode (đã chuyển sang constants/)
export * from '../constants/WORKING_MODE';

