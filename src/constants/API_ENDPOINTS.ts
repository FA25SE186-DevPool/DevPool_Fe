/**
 * API Endpoints - Single source of truth for all API routes
 * Tập trung tất cả các endpoint để dễ quản lý và refactor
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },

  // User
  USER: {
    BASE: '/user',
    PROFILE: '/user/profile',
  },

  // Dashboard
  DASHBOARD: {
    EXECUTIVE: '/dashboard/executive',
    FINANCIAL: '/dashboard/financial',
    HR: '/dashboard/hr',
    SALES: '/dashboard/sales',
    ACCOUNTANT: '/dashboard/accountant',
    DEVELOPER: '/dashboard/developer',
  },

  // Notification
  NOTIFICATION: {
    BASE: '/notification',
    MARK_READ: '/notification/mark-read',
    MARK_ALL_READ: '/notification/mark-all-read',
  },

  // Talent
  TALENT: {
    BASE: '/talent',
  },

  // Job Request
  JOB_REQUEST: {
    BASE: '/jobrequest',
  },

  // Apply
  APPLY: {
    BASE: '/apply',
  },

  // Partner
  PARTNER: {
    BASE: '/partner',
  },

  // Client Company
  CLIENT_COMPANY: {
    BASE: '/clientcompany',
  },

  // Project
  PROJECT: {
    BASE: '/project',
  },

  // Contact Inquiry
  CONTACT_INQUIRY: {
    BASE: '/contactinquiry',
  },

  // Document Type
  DOCUMENT_TYPE: {
    BASE: '/documenttype',
  },

  // Industry
  INDUSTRY: {
    BASE: '/industry',
  },

  // Skill
  SKILL: {
    BASE: '/skill',
  },

  // Job Role
  JOB_ROLE: {
    BASE: '/jobrole',
  },

  // Location
  LOCATION: {
    BASE: '/location',
  },

  // Market
  MARKET: {
    BASE: '/market',
  },
} as const;

