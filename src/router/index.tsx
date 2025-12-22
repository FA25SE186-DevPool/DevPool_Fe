import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UnauthorizedRedirectListener from '../components/common/UnauthorizedRedirectListener';
import PageLoader from '../components/common/PageLoader';

// Layouts
import PublicLayout from '../components/layouts/PublicLayout';
import PrivateLayout from '../components/layouts/PrivateLayout';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES, getDashboardRoute, NOTIFICATION_CENTER_ROUTE, CHAT_ROUTE } from './routes';

// ========================================
// PUBLIC PAGES (Client) - Lazy Loading
// ========================================
const AboutPage = React.lazy(() => import('../pages/client/about-page'));
const Auth = React.lazy(() => import('../pages/client/auth-page'));
const ContactPage = React.lazy(() => import('../pages/client/contact-page'));
const HomePage = React.lazy(() => import('../pages/client/home-page'));
const ProfessionalPage = React.lazy(() => import('../pages/client/professional-page'));
const ForgotPasswordPage = React.lazy(() => import('../pages/client/forgot-password-page'));

// ========================================
// COMMON PAGES - Lazy Loading
// ========================================
const NotificationCenterPage = React.lazy(() => import('../pages/common/notifications/List'));
const ChatPage = React.lazy(() => import('../pages/common/chat/ChatPage'));

// ========================================
// ADMIN PAGES - Lazy Loading
// ========================================
// Dashboard
const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard/AdminDashboard'));
const AdminProfile = React.lazy(() => import('../pages/admin/Profile'));

// Users
const StaffManagementPage = React.lazy(() => import('../pages/admin/Users/UserList'));
const PartnerManagementPage = React.lazy(() => import('../pages/admin/Users/PartnerList'));

// Categories - Certificate Types
const CertificateTypeCreatePage = React.lazy(() => import('../pages/admin/Categories/certificate-types/Create'));
const CertificateTypeDetailPage = React.lazy(() => import('../pages/admin/Categories/certificate-types/Detail'));
const CertificateTypeEditPage = React.lazy(() => import('../pages/admin/Categories/certificate-types/Edit'));
const CertificateTypeListPage = React.lazy(() => import('../pages/admin/Categories/certificate-types/List'));

// Categories - CV Templates
const CVTemplateCreatePage = React.lazy(() => import('../pages/admin/Categories/cv-templates/Create'));
const CVTemplateDetailPage = React.lazy(() => import('../pages/admin/Categories/cv-templates/Detail'));
const CVTemplateEditPage = React.lazy(() => import('../pages/admin/Categories/cv-templates/Edit'));
const CVTemplateListPage = React.lazy(() => import('../pages/admin/Categories/cv-templates/List'));

// Categories - Document Types
const DocumentTypeCreatePage = React.lazy(() => import('../pages/admin/Categories/document-types/Create'));
const DocumentTypeDetailPage = React.lazy(() => import('../pages/admin/Categories/document-types/Detail'));
const DocumentTypeEditPage = React.lazy(() => import('../pages/admin/Categories/document-types/Edit'));
const DocumentTypeListPage = React.lazy(() => import('../pages/admin/Categories/document-types/List'));

// Categories - Industries
const IndustryCreatePage = React.lazy(() => import('../pages/admin/Categories/industries/Create'));
const IndustryDetailPage = React.lazy(() => import('../pages/admin/Categories/industries/Detail'));
const IndustryEditPage = React.lazy(() => import('../pages/admin/Categories/industries/Edit'));
const IndustryListPage = React.lazy(() => import('../pages/admin/Categories/industries/List'));

// Categories - Job Role Levels
const JobRoleLevelCreatePage = React.lazy(() => import('../pages/admin/Categories/job-role-levels/Create'));
const JobRoleLevelDetailPage = React.lazy(() => import('../pages/admin/Categories/job-role-levels/Detail'));
const JobRoleLevelEditPage = React.lazy(() => import('../pages/admin/Categories/job-role-levels/Edit'));
const JobRoleLevelListPage = React.lazy(() => import('../pages/admin/Categories/job-role-levels/List'));

// Categories - Job Roles
const JobRoleCreatePage = React.lazy(() => import('../pages/admin/Categories/job-roles/Create'));
const JobRoleDetailPage = React.lazy(() => import('../pages/admin/Categories/job-roles/Detail'));
const JobRoleEditPage = React.lazy(() => import('../pages/admin/Categories/job-roles/Edit'));
const JobRoleListPage = React.lazy(() => import('../pages/admin/Categories/job-roles/List'));

// Categories - Locations
const LocationCreatePage = React.lazy(() => import('../pages/admin/Categories/locations/Create'));
const LocationDetailPage = React.lazy(() => import('../pages/admin/Categories/locations/Detail'));
const LocationEditPage = React.lazy(() => import('../pages/admin/Categories/locations/Edit'));
const LocationListPage = React.lazy(() => import('../pages/admin/Categories/locations/List'));

// Categories - Markets
const MarketCreatePage = React.lazy(() => import('../pages/admin/Categories/markets/Create'));
const MarketDetailPage = React.lazy(() => import('../pages/admin/Categories/markets/Detail'));
const MarketEditPage = React.lazy(() => import('../pages/admin/Categories/markets/Edit'));
const MarketListPage = React.lazy(() => import('../pages/admin/Categories/markets/List'));

// Audit Log
const AuditLogListPage = React.lazy(() => import('../pages/admin/AuditLog/List'));
const AuditLogDetailPage = React.lazy(() => import('../pages/admin/AuditLog/Detail'));

// Categories - Skills
const SkillCreatePage = React.lazy(() => import('../pages/admin/Categories/skill/Create'));
const SkillDetailPage = React.lazy(() => import('../pages/admin/Categories/skill/Detail'));
const SkillEditPage = React.lazy(() => import('../pages/admin/Categories/skill/Edit'));
const SkillListPage = React.lazy(() => import('../pages/admin/Categories/skill/List'));

// Categories - Skill Groups
const SkillGroupCreatePage = React.lazy(() => import('../pages/admin/Categories/skill-groups/Create'));
const SkillGroupDetailPage = React.lazy(() => import('../pages/admin/Categories/skill-groups/Detail'));
const SkillGroupEditPage = React.lazy(() => import('../pages/admin/Categories/skill-groups/Edit'));
const SkillGroupListPage = React.lazy(() => import('../pages/admin/Categories/skill-groups/List'));

// Categories - Experts
const ExpertListPage = React.lazy(() => import('../pages/admin/Categories/experts/List'));
const ExpertDetailPage = React.lazy(() => import('../pages/admin/Categories/experts/Detail'));

// ========================================
// TA STAFF PAGES - Lazy Loading
// ========================================
// Dashboard
const HRDashboard = React.lazy(() => import('../pages/hr_staff/dashboard/Dashboard'));
const HRStaffProfile = React.lazy(() => import('../pages/hr_staff/Profile'));

// Talents
const CreateTalent = React.lazy(() => import('../pages/hr_staff/talents/Create'));
const ListDev = React.lazy(() => import('../pages/hr_staff/talents/List'));
const TalentDetailPage = React.lazy(() => import('../pages/hr_staff/talents/Detail'));
const TalentEditPage = React.lazy(() => import('../pages/hr_staff/talents/Edit'));

// Talent Sub-entities
const TalentAvailableTimeCreatePage = React.lazy(() => import('../pages/hr_staff/talent-available-times/Create'));
const TalentAvailableTimeEditPage = React.lazy(() => import('../pages/hr_staff/talent-available-times/Edit'));
const TalentCertificateCreatePage = React.lazy(() => import('../pages/hr_staff/talent-certificates/Create'));
const TalentCertificateEditPage = React.lazy(() => import('../pages/hr_staff/talent-certificates/Edit'));
const TalentCVCreatePage = React.lazy(() => import('../pages/hr_staff/talent-cvs/Create'));
const TalentCVEditPage = React.lazy(() => import('../pages/hr_staff/talent-cvs/Edit'));
const TalentJobRoleLevelCreatePage = React.lazy(() => import('../pages/hr_staff/talent-job-role-levels/Create'));
const TalentJobRoleLevelEditPage = React.lazy(() => import('../pages/hr_staff/talent-job-role-levels/Edit'));
const TalentProjectCreatePage = React.lazy(() => import('../pages/hr_staff/talent-projects/Create'));
const TalentProjectEditPage = React.lazy(() => import('../pages/hr_staff/talent-projects/Edit'));
const TalentSkillCreatePage = React.lazy(() => import('../pages/hr_staff/talent-skills/Create'));
const TalentSkillEditPage = React.lazy(() => import('../pages/hr_staff/talent-skills/Edit'));
const TalentWorkExperienceCreatePage = React.lazy(() => import('../pages/hr_staff/talent-work-experiences/Create'));
const TalentWorkExperienceEditPage = React.lazy(() => import('../pages/hr_staff/talent-work-experiences/Edit'));

// Partners
const CreatePartner = React.lazy(() => import('../pages/hr_staff/partners/Create'));
const ListPartner = React.lazy(() => import('../pages/hr_staff/partners/List'));
const PartnerDetailPage = React.lazy(() => import('../pages/hr_staff/partners/Detail'));
const PartnerEditPage = React.lazy(() => import('../pages/hr_staff/partners/Edit'));

// Job Requests
const JobRequestDetailHRPage = React.lazy(() => import('../pages/hr_staff/job-requests/Detail'));
const ListRequest = React.lazy(() => import('../pages/hr_staff/job-requests/List'));
const MatchingCVPage = React.lazy(() => import('../pages/hr_staff/job-requests/Matching'));

// Applications
const TalentCVApplicationDetailPage = React.lazy(() => import('../pages/hr_staff/applications/Detail'));
const TalentCVApplicationPage = React.lazy(() => import('../pages/hr_staff/applications/List'));

// Apply Activities
const ApplyActivityCreatePage = React.lazy(() => import('../pages/hr_staff/apply-activities/Create'));
const ApplyActivityDetailPage = React.lazy(() => import('../pages/hr_staff/apply-activities/Detail'));
const ApplyActivityEditPage = React.lazy(() => import('../pages/hr_staff/apply-activities/Edit'));

// Assignments
const Assignments = React.lazy(() => import('../pages/hr_staff/assignments'));

// ========================================
// SALES STAFF PAGES - Lazy Loading
// ========================================
// Dashboard
const SalesStaffDashboard = React.lazy(() => import('../pages/sales_staff/Dashboard'));
const SalesStaffProfile = React.lazy(() => import('../pages/sales_staff/Profile'));

// Job Requests
const JobRequestCreatePage = React.lazy(() => import('../pages/sales_staff/job-requests/Create'));
const JobRequestDetailPage = React.lazy(() => import('../pages/sales_staff/job-requests/Detail'));
const JobRequestEditPage = React.lazy(() => import('../pages/sales_staff/job-requests/Edit'));
const JobRequestListPage = React.lazy(() => import('../pages/sales_staff/job-requests/List'));

// Clients
const ClientCompanyCreatePage = React.lazy(() => import('../pages/sales_staff/client-companies/Create'));
const ClientCompanyDetailPage = React.lazy(() => import('../pages/sales_staff/client-companies/Detail'));
const ClientCompanyEditPage = React.lazy(() => import('../pages/sales_staff/client-companies/Edit'));
const ClientCompanyListPage = React.lazy(() => import('../pages/sales_staff/client-companies/List'));

// Projects
const ProjectCreatePage = React.lazy(() => import('../pages/sales_staff/projects/Create'));
const ProjectDetailPage = React.lazy(() => import('../pages/sales_staff/projects/Detail'));
const ProjectEditPage = React.lazy(() => import('../pages/sales_staff/projects/Edit'));
const ProjectListPage = React.lazy(() => import('../pages/sales_staff/projects/List'));


// Applications
const SalesApplicationDetailPage = React.lazy(() => import('../pages/sales_staff/applications/Detail'));
const SalesApplicationListPage = React.lazy(() => import('../pages/sales_staff/applications/List'));

// Apply Process Templates
const SalesApplyProcessTemplateCreatePage = React.lazy(() => import('../pages/sales_staff/apply-process-templates/Create'));
const SalesApplyProcessTemplateDetailPage = React.lazy(() => import('../pages/sales_staff/apply-process-templates/Detail'));
const SalesApplyProcessTemplateEditPage = React.lazy(() => import('../pages/sales_staff/apply-process-templates/Edit'));
const SalesApplyProcessTemplateListPage = React.lazy(() => import('../pages/sales_staff/apply-process-templates/List'));

// Apply Process Steps
const SalesApplyProcessStepCreatePage = React.lazy(() => import('../pages/sales_staff/apply-process-steps/Create'));
const SalesApplyProcessStepDetailPage = React.lazy(() => import('../pages/sales_staff/apply-process-steps/Detail'));
const SalesApplyProcessStepEditPage = React.lazy(() => import('../pages/sales_staff/apply-process-steps/Edit'));
const SalesApplyProcessStepListPage = React.lazy(() => import('../pages/sales_staff/apply-process-steps/List'));

// Contact Inquiries
const ContactInquiryListPage = React.lazy(() => import('../pages/sales_staff/contact-inquiries/List'));
const ContactInquiryDetailPage = React.lazy(() => import('../pages/sales_staff/contact-inquiries/Detail'));

// Contracts - Sales có thể xem và thao tác client contract, chỉ xem partner contract
const SalesClientContractDetail = React.lazy(() => import('../pages/sales_staff/contracts/clients/Detail'));
// const SalesPartnerContractDetail = React.lazy(() => import('../pages/sales_staff/contracts/partners/Detail'));

// ========================================
// ACCOUNTANT STAFF PAGES - Lazy Loading
// ========================================
const AccountantDashboard = React.lazy(() => import('../pages/accountant_staff/Dashboard'));
const AccountantStaffProfile = React.lazy(() => import('../pages/accountant_staff/Profile'));
const AccountantClientContractDetail = React.lazy(() => import('../pages/accountant_staff/contracts/clients/Detail'));
const AccountantPartnerContractDetail = React.lazy(() => import('../pages/accountant_staff/contracts/partners/Detail'));
const AccountantDocumentsList = React.lazy(() => import('../pages/accountant_staff/documents/List'));
const AccountantProjectListPage = React.lazy(() => import('../pages/accountant_staff/projects/List'));
const AccountantProjectDetailPage = React.lazy(() => import('../pages/accountant_staff/projects/Detail'));

// ========================================
// DEVELOPER PAGES - Lazy Loading
// ========================================
const PartnerDashboard = React.lazy(() => import('../pages/partner/Dashboard'));
const PartnerTalents = React.lazy(() => import('../pages/partner/Talents'));
const PartnerTalentDetailPage = React.lazy(() => import('../pages/partner/TalentDetail'));
const PartnerPayments = React.lazy(() => import('../pages/partner/Payments'));
const PartnerProfile = React.lazy(() => import('../pages/partner/Profile'));

// ========================================
// MANAGER PAGES - Lazy Loading
// ========================================
// Dashboard
const ManagerDashboard = React.lazy(() => import('../pages/manager/dashboard/Dashboard'));
const ManagerProfile = React.lazy(() => import('../pages/manager/Profile'));

// Client Companies
const ManagerClientCompanyListPage = React.lazy(() => import('../pages/manager/client-companies/List'));
const ManagerClientCompanyDetailPage = React.lazy(() => import('../pages/manager/client-companies/Detail'));

// Projects
const ManagerProjectListPage = React.lazy(() => import('../pages/manager/projects/List'));
const ManagerProjectDetailPage = React.lazy(() => import('../pages/manager/projects/Detail'));

// Contracts
const ManagerClientContractDetail = React.lazy(() => import('../pages/manager/contract/clients/Detail'));
const ManagerPartnerContractDetail = React.lazy(() => import('../pages/manager/contract/partners/Detail'));

// Handover Assignment
const ManagerHandoverAssignmentPage = React.lazy(() => import('../pages/manager/handover-assignment/HandoverAssignment'));


const AppRouter: React.FC = () => {
  const authContext = useAuth();
  const { user } = authContext;

  return (
    <>
      <UnauthorizedRedirectListener />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ======================================== */}
          {/* PUBLIC ROUTES (với PublicLayout) */}
          {/* ======================================== */}
          <Route element={<PublicLayout />}>
            {/* Guest Routes */}
            <Route path={ROUTES.GUEST.HOME} element={<HomePage />} />
            <Route path={ROUTES.GUEST.DEVELOPERS} element={<ProfessionalPage />} />
            <Route path={ROUTES.GUEST.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.GUEST.CONTACT} element={<ContactPage />} />

            {/* Auth Routes */}
            <Route
              path={ROUTES.GUEST.LOGIN}
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <Auth />}
            />
            <Route
              path={ROUTES.REGISTER}
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <Auth />}
            />
            <Route
              path={ROUTES.GUEST.FORGOT_PASSWORD}
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <ForgotPasswordPage />}
            />

            {/* Thông báo chung cho tất cả vai trò */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path={NOTIFICATION_CENTER_ROUTE} element={<NotificationCenterPage />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* COMMON PRIVATE ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            {/* Chat - chỉ dành cho internal staff */}
            <Route element={<ProtectedRoute requiredRoles={["Admin", "Manager", "TA", "Accountant", "Sale", "Staff TA", "Staff Sales", "Staff Accountant"]}><Outlet /></ProtectedRoute>}>
              <Route path={CHAT_ROUTE} element={<ChatPage />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* TA STAFF ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRole="Staff TA"><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.TA_STAFF.DASHBOARD} element={<HRDashboard />} />
              <Route path={ROUTES.TA_STAFF.PROFILE} element={<HRStaffProfile />} />

              {/* Talents */}
              <Route path={ROUTES.TA_STAFF.TALENTS.LIST} element={<ListDev />} />
              <Route path={ROUTES.TA_STAFF.TALENTS.DETAIL} element={<TalentDetailPage />} />
              <Route path={ROUTES.TA_STAFF.TALENTS.EDIT} element={<TalentEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENTS.CREATE} element={<CreateTalent />} />

              {/* Talent Sub-entities */}
              <Route path={ROUTES.TA_STAFF.TALENT_AVAILABLE_TIMES.CREATE} element={<TalentAvailableTimeCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_AVAILABLE_TIMES.EDIT} element={<TalentAvailableTimeEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_CERTIFICATES.CREATE} element={<TalentCertificateCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_CERTIFICATES.EDIT} element={<TalentCertificateEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_CVS.CREATE} element={<TalentCVCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_CVS.EDIT} element={<TalentCVEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_JOB_ROLE_LEVELS.CREATE} element={<TalentJobRoleLevelCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_JOB_ROLE_LEVELS.EDIT} element={<TalentJobRoleLevelEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_PROJECTS.CREATE} element={<TalentProjectCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_PROJECTS.EDIT} element={<TalentProjectEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_SKILLS.CREATE} element={<TalentSkillCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_SKILLS.EDIT} element={<TalentSkillEditPage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_WORK_EXPERIENCES.CREATE} element={<TalentWorkExperienceCreatePage />} />
              <Route path={ROUTES.TA_STAFF.TALENT_WORK_EXPERIENCES.EDIT} element={<TalentWorkExperienceEditPage />} />

              {/* Partners */}
              <Route path={ROUTES.TA_STAFF.PARTNERS.LIST} element={<ListPartner />} />
              <Route path={ROUTES.TA_STAFF.PARTNERS.DETAIL} element={<PartnerDetailPage />} />
              <Route path={ROUTES.TA_STAFF.PARTNERS.EDIT} element={<PartnerEditPage />} />
              <Route path={ROUTES.TA_STAFF.PARTNERS.CREATE} element={<CreatePartner />} />

              {/* Job Requests */}
              <Route path={ROUTES.TA_STAFF.JOB_REQUESTS.LIST} element={<ListRequest />} />
              <Route path={ROUTES.TA_STAFF.JOB_REQUESTS.DETAIL} element={<JobRequestDetailHRPage />} />
              <Route path={ROUTES.TA_STAFF.JOB_REQUESTS.MATCHING} element={<MatchingCVPage />} />

              {/* Applications */}
              <Route path={ROUTES.TA_STAFF.APPLICATIONS.LIST} element={<TalentCVApplicationPage />} />
              <Route path={ROUTES.TA_STAFF.APPLICATIONS.DETAIL} element={<TalentCVApplicationDetailPage />} />

              {/* Apply Activities */}
              <Route path={ROUTES.TA_STAFF.APPLY_ACTIVITIES.CREATE} element={<ApplyActivityCreatePage />} />
              <Route path={ROUTES.TA_STAFF.APPLY_ACTIVITIES.DETAIL} element={<ApplyActivityDetailPage />} />
              <Route path={ROUTES.TA_STAFF.APPLY_ACTIVITIES.EDIT} element={<ApplyActivityEditPage />} />

              {/* Assignments */}
              <Route path={ROUTES.TA_STAFF.ASSIGNMENTS} element={<Assignments />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* SALES STAFF ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRole="Staff Sales"><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.SALES_STAFF.DASHBOARD} element={<SalesStaffDashboard />} />
              <Route path={ROUTES.SALES_STAFF.PROFILE} element={<SalesStaffProfile />} />

              {/* Job Requests */}
              <Route path={ROUTES.SALES_STAFF.JOB_REQUESTS.LIST} element={<JobRequestListPage />} />
              <Route path={ROUTES.SALES_STAFF.JOB_REQUESTS.DETAIL} element={<JobRequestDetailPage />} />
              <Route path={ROUTES.SALES_STAFF.JOB_REQUESTS.CREATE} element={<JobRequestCreatePage />} />
              <Route path={ROUTES.SALES_STAFF.JOB_REQUESTS.EDIT} element={<JobRequestEditPage />} />

              {/* Clients */}
              <Route path={ROUTES.SALES_STAFF.CLIENTS.LIST} element={<ClientCompanyListPage />} />
              <Route path={ROUTES.SALES_STAFF.CLIENTS.DETAIL} element={<ClientCompanyDetailPage />} />
              <Route path={ROUTES.SALES_STAFF.CLIENTS.CREATE} element={<ClientCompanyCreatePage />} />
              <Route path={ROUTES.SALES_STAFF.CLIENTS.EDIT} element={<ClientCompanyEditPage />} />

              {/* Projects */}
              <Route path={ROUTES.SALES_STAFF.PROJECTS.LIST} element={<ProjectListPage />} />
              <Route path={ROUTES.SALES_STAFF.PROJECTS.DETAIL} element={<ProjectDetailPage />} />
              <Route path={ROUTES.SALES_STAFF.PROJECTS.CREATE} element={<ProjectCreatePage />} />
              <Route path={ROUTES.SALES_STAFF.PROJECTS.EDIT} element={<ProjectEditPage />} />

              {/* Contact Inquiries */}
              <Route path={ROUTES.SALES_STAFF.CONTACT_INQUIRIES.LIST} element={<ContactInquiryListPage />} />
              <Route path={ROUTES.SALES_STAFF.CONTACT_INQUIRIES.DETAIL} element={<ContactInquiryDetailPage />} />

              {/* Applications */}
              <Route path={ROUTES.SALES_STAFF.APPLICATIONS.LIST} element={<SalesApplicationListPage />} />
              <Route path={ROUTES.SALES_STAFF.APPLICATIONS.DETAIL} element={<SalesApplicationDetailPage />} />

              {/* Apply Process Templates */}
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_TEMPLATES.LIST} element={<SalesApplyProcessTemplateListPage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_TEMPLATES.DETAIL} element={<SalesApplyProcessTemplateDetailPage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_TEMPLATES.CREATE} element={<SalesApplyProcessTemplateCreatePage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_TEMPLATES.EDIT} element={<SalesApplyProcessTemplateEditPage />} />

              {/* Apply Process Steps */}
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_STEPS.LIST} element={<SalesApplyProcessStepListPage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_STEPS.DETAIL} element={<SalesApplyProcessStepDetailPage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_STEPS.CREATE} element={<SalesApplyProcessStepCreatePage />} />
              <Route path={ROUTES.SALES_STAFF.APPLY_PROCESS_STEPS.EDIT} element={<SalesApplyProcessStepEditPage />} />

              {/* Contracts */}
              <Route path={ROUTES.SALES_STAFF.CONTRACTS.CLIENT_DETAIL} element={<SalesClientContractDetail />} />
              {/* Sales không được phép xem partner contract - route đã bị xóa */}
            </Route>
          </Route>

          {/* ======================================== */}
          {/* ACCOUNTANT STAFF ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRole="Staff Accountant"><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.ACCOUNTANT_STAFF.DASHBOARD} element={<AccountantDashboard />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.PROFILE} element={<AccountantStaffProfile />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.PROJECTS.LIST} element={<AccountantProjectListPage />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.PROJECTS.DETAIL} element={<AccountantProjectDetailPage />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.DOCUMENTS.LIST} element={<AccountantDocumentsList />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.CONTRACTS.CLIENT_DETAIL} element={<AccountantClientContractDetail />} />
              <Route path={ROUTES.ACCOUNTANT_STAFF.CONTRACTS.PARTNER_DETAIL} element={<AccountantPartnerContractDetail />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* PARTNER ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRoles={["Developer", "Partner"]}><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.PARTNER.DASHBOARD} element={<PartnerDashboard />} />
              <Route path={ROUTES.PARTNER.TALENTS} element={<PartnerTalents />} />
              <Route path={ROUTES.PARTNER.TALENT_DETAIL} element={<PartnerTalentDetailPage />} />
              <Route path={ROUTES.PARTNER.PAYMENTS} element={<PartnerPayments />} />
              <Route path={ROUTES.PARTNER.PROFILE} element={<PartnerProfile />} />
              <Route path={ROUTES.PARTNER.CV_CREATE} element={<TalentCVCreatePage />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* MANAGER ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRole="Manager"><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.MANAGER.DASHBOARD} element={<ManagerDashboard />} />
              <Route path={ROUTES.MANAGER.PROFILE} element={<ManagerProfile />} />

              {/* Client Companies */}
              <Route path={ROUTES.MANAGER.CLIENT_COMPANY.LIST} element={<ManagerClientCompanyListPage />} />
              <Route path={ROUTES.MANAGER.CLIENT_COMPANY.DETAIL} element={<ManagerClientCompanyDetailPage />} />

              {/* Projects */}
              <Route path="/manager/projects" element={<ManagerProjectListPage />} />
              <Route path="/manager/projects/:id" element={<ManagerProjectDetailPage />} />

              {/* Contracts */}
              <Route path={ROUTES.MANAGER.CONTRACTS.CLIENT_DETAIL} element={<ManagerClientContractDetail />} />
              <Route path={ROUTES.MANAGER.CONTRACTS.PARTNER_DETAIL} element={<ManagerPartnerContractDetail />} />

              {/* Handover Assignment */}
              <Route path={ROUTES.MANAGER.HANDOVER_ASSIGNMENT} element={<ManagerHandoverAssignmentPage />} />

            </Route>
          </Route>

          {/* ======================================== */}
          {/* ADMIN ROUTES (với PrivateLayout) */}
          {/* ======================================== */}
          <Route element={<PrivateLayout />}>
            <Route element={<ProtectedRoute requiredRole="Admin"><Outlet /></ProtectedRoute>}>
              <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
              <Route path={ROUTES.ADMIN.PROFILE} element={<AdminProfile />} />

              {/* Users */}
              <Route path={ROUTES.ADMIN.USERS.LIST} element={<StaffManagementPage />} />
              <Route path={ROUTES.ADMIN.USERS.PARTNERS} element={<PartnerManagementPage />} />

              {/* Categories - Certificate Types */}
              <Route path={ROUTES.ADMIN.CATEGORIES.CERTIFICATE_TYPES.LIST} element={<CertificateTypeListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CERTIFICATE_TYPES.DETAIL} element={<CertificateTypeDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CERTIFICATE_TYPES.CREATE} element={<CertificateTypeCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CERTIFICATE_TYPES.EDIT} element={<CertificateTypeEditPage />} />

              {/* Categories - CV Templates */}
              <Route path={ROUTES.ADMIN.CATEGORIES.CV_TEMPLATES.LIST} element={<CVTemplateListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CV_TEMPLATES.DETAIL} element={<CVTemplateDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CV_TEMPLATES.CREATE} element={<CVTemplateCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.CV_TEMPLATES.EDIT} element={<CVTemplateEditPage />} />

              {/* Categories - Document Types */}
              <Route path="/admin/categories/document-types" element={<DocumentTypeListPage />} />
              <Route path="/admin/categories/document-types/:id" element={<DocumentTypeDetailPage />} />
              <Route path="/admin/categories/document-types/create" element={<DocumentTypeCreatePage />} />
              <Route path="/admin/categories/document-types/edit/:id" element={<DocumentTypeEditPage />} />

              {/* Categories - Industries */}
              <Route path={ROUTES.ADMIN.CATEGORIES.INDUSTRIES.LIST} element={<IndustryListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.INDUSTRIES.DETAIL} element={<IndustryDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.INDUSTRIES.CREATE} element={<IndustryCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.INDUSTRIES.EDIT} element={<IndustryEditPage />} />

              {/* Categories - Job Role Levels */}
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLE_LEVELS.LIST} element={<JobRoleLevelListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLE_LEVELS.DETAIL} element={<JobRoleLevelDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLE_LEVELS.CREATE} element={<JobRoleLevelCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLE_LEVELS.EDIT} element={<JobRoleLevelEditPage />} />

              {/* Categories - Job Roles */}
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLES.LIST} element={<JobRoleListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLES.DETAIL} element={<JobRoleDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLES.CREATE} element={<JobRoleCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.JOB_ROLES.EDIT} element={<JobRoleEditPage />} />

              {/* Categories - Locations */}
              <Route path={ROUTES.ADMIN.CATEGORIES.LOCATIONS.LIST} element={<LocationListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.LOCATIONS.DETAIL} element={<LocationDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.LOCATIONS.CREATE} element={<LocationCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.LOCATIONS.EDIT} element={<LocationEditPage />} />

              {/* Categories - Markets */}
              <Route path={ROUTES.ADMIN.CATEGORIES.MARKETS.LIST} element={<MarketListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.MARKETS.DETAIL} element={<MarketDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.MARKETS.CREATE} element={<MarketCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.MARKETS.EDIT} element={<MarketEditPage />} />

              {/* Categories - Skills */}
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILLS.LIST} element={<SkillListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILLS.DETAIL} element={<SkillDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILLS.CREATE} element={<SkillCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILLS.EDIT} element={<SkillEditPage />} />

              {/* Categories - Skill Groups */}
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILL_GROUPS.LIST} element={<SkillGroupListPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILL_GROUPS.DETAIL} element={<SkillGroupDetailPage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILL_GROUPS.CREATE} element={<SkillGroupCreatePage />} />
              <Route path={ROUTES.ADMIN.CATEGORIES.SKILL_GROUPS.EDIT} element={<SkillGroupEditPage />} />

              {/* Categories - Experts */}
              <Route path="/admin/categories/experts" element={<ExpertListPage />} />
              <Route path="/admin/categories/experts/:id" element={<ExpertDetailPage />} />

              {/* Audit Log */}
              <Route path={ROUTES.ADMIN.AUDIT.LIST} element={<AuditLogListPage />} />
              <Route path={ROUTES.ADMIN.AUDIT.DETAIL} element={<AuditLogDetailPage />} />
            </Route>
          </Route>

          {/* ======================================== */}
          {/* CATCH ALL ROUTE */}
          {/* ======================================== */}
          <Route path="*" element={<Navigate to={ROUTES.GUEST.HOME} replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRouter;
