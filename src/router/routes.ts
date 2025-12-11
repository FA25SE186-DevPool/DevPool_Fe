export const ROUTES = {
  REGISTER: '/register',

  // =======================================
  // GUEST - Khách vãng lai (chưa đăng nhập)
  // =======================================
  GUEST: {
    HOME: '/',                                       // Trang chủ
    ABOUT: '/about',                                 // Giới thiệu
    SERVICES: '/services',                           // Dịch vụ
    CONTACT: '/contact',                             // Liên hệ
    DEVELOPERS: '/developers',                       // Xem danh sách dev (public)
    LOGIN: '/login',                                 // Đăng nhập
  },

  // =======================================
  // TA_STAFF - Nhân viên TA
  // =======================================
  TA_STAFF: {
    DASHBOARD: '/ta/dashboard',
    PROFILE: '/ta/profile',

    // Talent & nguồn cung
    DEVELOPERS: {
      LIST: '/ta/developers',                    // Danh sách tất cả developers
      DETAIL: '/ta/developers/:id',              // Chi tiết developer   
      EDIT: '/ta/developers/edit/:id',           // Sửa thông tin developer
      CREATE: '/ta/developers/create',

    },
    TALENT_AVAILABLE_TIMES: {
      LIST: '/ta/talent-available-times',
      EDIT: '/ta/talent-available-times/edit/:id',
      CREATE: '/ta/talent-available-times/create',
    },
    TALENT_CERTIFICATES: {
      LIST: '/ta/talent-certificates',
      EDIT: '/ta/talent-certificates/edit/:id',
      CREATE: '/ta/talent-certificates/create',
    },
    TALENT_CVS: {
      LIST: '/ta/talent-cvs',
      EDIT: '/ta/talent-cvs/edit/:id',
      CREATE: '/ta/talent-cvs/create',
    },

    TALENT_JOB_ROLE_LEVELS: {
      LIST: '/ta/talent-job-role-levels',
      EDIT: '/ta/talent-job-role-levels/edit/:id',
      CREATE: '/ta/talent-job-role-levels/create',
    },

    TALENT_PROJECTS: {
      LIST: '/ta/talent-projects',
      EDIT: '/ta/talent-projects/edit/:id',
      CREATE: '/ta/talent-projects/create',
    },
    TALENT_SKILLS: {
      LIST: '/ta/talent-skills',
      EDIT: '/ta/talent-skills/edit/:id',
      CREATE: '/ta/talent-skills/create',
    },
    TALENT_WORK_EXPERIENCES: {
      LIST: '/ta/talent-work-experiences',
      EDIT: '/ta/talent-work-experiences/edit/:id',
      CREATE: '/ta/talent-work-experiences/create',
    },

    JOB_REQUESTS: {
      LIST: '/ta/job-requests',
      DETAIL: '/ta/job-requests/:id',
      MATCHING: '/ta/job-requests/matching-cv', // Matching CV với yêu cầu
    },

    APPLICATIONS: {
      LIST: '/ta/applications',
      DETAIL: '/ta/applications/:id',
    },

    APPLY_ACTIVITIES: {
      LIST: '/ta/apply-activities',
      DETAIL: '/ta/apply-activities/:id',
      EDIT: '/ta/apply-activities/edit/:id',
      CREATE: '/ta/apply-activities/create',
    },

    PARTNERS: {
      LIST: '/ta/partners',
      DETAIL: '/ta/partners/:id',
      EDIT: '/ta/partners/edit/:id',
      CREATE: '/ta/partners/create',
    },

    ASSIGNMENTS: '/ta/assignments',                // staffTalentAssignments

  },

  // =====================================
  // ADMIN - Quản trị hệ thống
  // =====================================
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PROFILE: '/admin/profile',

    // Quản lý Users
    USERS: {
      LIST: '/admin/users',                          // Danh sách users (staff)
      CREATE_ACCOUNT: '/admin/users/create-account', // Tạo tài khoản cho staff
    },

    // Danh mục
    CATEGORIES: {
      SKILLS: {
        LIST: '/admin/categories/skills',
        DETAIL: '/admin/categories/skills/:id',
        EDIT: '/admin/categories/skills/edit/:id',
        CREATE: '/admin/categories/skills/create',
      },
      SKILL_GROUPS: {
        LIST: '/admin/categories/skill-groups',
        DETAIL: '/admin/categories/skill-groups/:id',
        EDIT: '/admin/categories/skill-groups/edit/:id',
        CREATE: '/admin/categories/skill-groups/create',
      },
      CERTIFICATE_TYPES: {
        LIST: '/admin/categories/certificate-types',
        DETAIL: '/admin/categories/certificate-types/:id',
        EDIT: '/admin/categories/certificate-types/edit/:id',
        CREATE: '/admin/categories/certificate-types/create',
      },
      CV_TEMPLATES: {
        LIST: '/admin/categories/cv-templates',
        DETAIL: '/admin/categories/cv-templates/:id',
        EDIT: '/admin/categories/cv-templates/edit/:id',
        CREATE: '/admin/categories/cv-templates/create',
      },
      JOB_ROLE_LEVELS: {
        LIST: '/admin/categories/job-role-levels',
        DETAIL: '/admin/categories/job-role-levels/:id',
        EDIT: '/admin/categories/job-role-levels/edit/:id',
        CREATE: '/admin/categories/job-role-levels/create',
      },
      JOB_ROLES: {
        LIST: '/admin/categories/job-roles',
        DETAIL: '/admin/categories/job-roles/:id',
        EDIT: '/admin/categories/job-roles/edit/:id',
        CREATE: '/admin/categories/job-roles/create',
      },
      LOCATIONS: {
        LIST: '/admin/categories/locations',
        DETAIL: '/admin/categories/locations/:id',
        EDIT: '/admin/categories/locations/edit/:id',
        CREATE: '/admin/categories/locations/create',
      },
      MARKETS: {
        LIST: '/admin/categories/markets',
        DETAIL: '/admin/categories/markets/:id',
        EDIT: '/admin/categories/markets/edit/:id',
        CREATE: '/admin/categories/markets/create',
      },
      INDUSTRIES:
      {
        LIST: '/admin/categories/industries',
        DETAIL: '/admin/categories/industries/:id',
        EDIT: '/admin/categories/industries/edit/:id',
        CREATE: '/admin/categories/industries/create',
      },
    },

    AUDIT: {
      LIST: '/admin/audit-log',                   // Audit logs list
      DETAIL: '/admin/audit-log/:entityName/:entityId', // Audit log detail for entity
    },
  },

  // =======================================
  // SALES_STAFF - Nhân viên Kinh doanh/Account
  // (MỚI THÊM – chịu trách nhiệm với KH & tạo JobRequest)
  // =======================================
  SALES_STAFF: {
    DASHBOARD: '/sales/dashboard',
    PROFILE: '/sales/profile',

    APPLICATIONS: {
      LIST: '/sales/applications',
      DETAIL: '/sales/applications/:id',
    },
    APPLY_PROCESS_TEMPLATES: {
      LIST: '/sales/apply-process-templates',
      DETAIL: '/sales/apply-process-templates/:id',
      EDIT: '/sales/apply-process-templates/edit/:id',
      CREATE: '/sales/apply-process-templates/create',
    },
    APPLY_PROCESS_STEPS: {
      LIST: '/sales/apply-process-steps',
      DETAIL: '/sales/apply-process-steps/:id',
      EDIT: '/sales/apply-process-steps/edit/:id',
      CREATE: '/sales/apply-process-steps/create',
    },
    JOB_REQUESTS: {
      LIST: '/sales/job-requests',
      DETAIL: '/sales/job-requests/:id',
      EDIT: '/sales/job-requests/edit/:id',
      CREATE: '/sales/job-requests/create',
    },
    CLIENTS: {
      LIST: '/sales/clients',
      DETAIL: '/sales/clients/:id',
      EDIT: '/sales/clients/edit/:id',
      CREATE: '/sales/clients/create',
    },
    PROJECTS: {
      LIST: '/sales/projects',
      DETAIL: '/sales/projects/:id',
      EDIT: '/sales/projects/edit/:id',
      CREATE: '/sales/projects/create',
    },
    CONTACT_INQUIRIES: {
      LIST: '/sales/contact-inquiries',
      DETAIL: '/sales/contact-inquiries/:id',
    },
    CONTRACTS: {
      CLIENT_DETAIL: '/sales/contracts/clients/:id',
      PARTNER_DETAIL: '/sales/contracts/partners/:id',
    },

  },

  // ==============================================================
  // MANAGER - Quản lý (phê duyệt & báo cáo)
  // ==============================================================
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    PROFILE: '/manager/profile',
    
    CLIENT_COMPANY: {
      LIST: '/manager/client-companies',
      DETAIL: '/manager/client-companies/:id',
    },
    CONTRACTS: {
      CLIENT_DETAIL: '/manager/contracts/clients/:id',
      PARTNER_DETAIL: '/manager/contracts/partners/:id',
    },
    HANDOVER_ASSIGNMENT: '/manager/handover-assignment',

    // BUSINESS: {
    //   OVERVIEW: '/manager/business/overview',
    //   REVENUE: '/manager/business/revenue',
    //   CLIENTS: '/manager/business/clients',
    //   PROJECTS: '/manager/business/projects',
    //   SUCCESS_RATE: '/manager/business/success-rate',
    // },
    // HUMAN_RESOURCES: {
    //   OVERVIEW: '/manager/hr/overview',
    //   DEVELOPERS: '/manager/hr/developers',
    //   UTILIZATION: '/manager/hr/utilization',
    //   PERFORMANCE: '/manager/hr/performance',
    // },
    // FINANCE: {
    //   OVERVIEW: '/manager/finance/overview',
    //   CASHFLOW: '/manager/finance/cashflow',
    //   DEBT: '/manager/finance/debt',
    //   PROFIT: '/manager/finance/profit',
    // },
    // ANALYTICS: {
    //   TRENDS: '/manager/analytics/trends',
    //   FORECAST: '/manager/analytics/forecast',
    //   KPI: '/manager/analytics/kpi',
    // },
  },

  // ====================================
  // ACCOUNTANT_STAFF - Nhân viên Kế toán
  // ====================================
  ACCOUNTANT_STAFF: {
    DASHBOARD: '/accountant/dashboard',
    PROFILE: '/accountant/profile',
    PROJECTS: {
      LIST: '/accountant/projects',
      DETAIL: '/accountant/projects/:id',
    },
    DOCUMENTS: {
      LIST: '/accountant/documents',
    },
    CONTRACTS: {
      CLIENT_DETAIL: '/accountant/contracts/clients/:id',
      PARTNER_DETAIL: '/accountant/contracts/partners/:id',
    },
  },

  // ==============================================================
  // DEVELOPER - Lập trình viên - có tài khoản sau khi ký hợp đồng
  // ==============================================================
  DEVELOPER: {
    DASHBOARD: '/developer/dashboard',          // Tổng quan

    // Thông tin cá nhân
    PROFILE: '/developer/profile',              // Xem/sửa thông tin cá nhân
    CV: '/developer/cv',                        // submit thay đổi → TA duyệt
    CV_CREATE: '/developer/cv/create',          // Tạo CV mới

    // Hợp đồng
    CONTRACTS: {
      LIST: '/developer/contracts',             // Danh sách hợp đồng của mình
      CURRENT: '/developer/contracts/current',  // Hợp đồng đang thực hiện
      DETAIL: '/developer/contracts/:id',       // Chi tiết hợp đồng đối tác
    },

    // Payment Status
    PAYMENTS: {
      LIST: '/developer/payments',
      DETAIL: '/developer/payments/:id',
    },
  },

} as const;

export const NOTIFICATION_CENTER_ROUTE = '/notifications' as const;

export type UserRole =
  | 'Staff TA'
  | 'Staff Accountant'
  | 'Staff Sales'
  | 'Developer'
  | 'Manager'
  | 'Admin';

export const getDashboardRoute = (role: string): string => {
  switch (role) {
    case 'Staff TA':
      return ROUTES.TA_STAFF.DASHBOARD;
    case 'Staff Accountant':
      return ROUTES.ACCOUNTANT_STAFF.DASHBOARD;
    case 'Staff Sales':
      return ROUTES.SALES_STAFF.DASHBOARD;
    case 'Developer':
      return ROUTES.DEVELOPER.DASHBOARD;
    case 'Manager':
      return ROUTES.MANAGER.DASHBOARD;
    case 'Admin':
      return ROUTES.ADMIN.DASHBOARD;
    default:
      return ROUTES.GUEST.HOME;
  }
};

export const getRoleBasedRoutes = (role: UserRole) => {
  switch (role) {
    case 'Staff TA':
      return ROUTES.TA_STAFF;
    case 'Manager':
      return ROUTES.MANAGER;
    case 'Admin':
      return ROUTES.ADMIN;
    default:
      return null;
  }
};