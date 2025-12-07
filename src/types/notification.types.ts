// Enums
export const NotificationType = {
  // Recruitment & Application (1xxx)
  ApplicationStatusChanged: 1001,
  InterviewRescheduled: 1003,
  InterviewCompleted: 1004,
  InterviewResultPassed: 1005,
  InterviewResultFailed: 1006,
  ApplicationOffered: 1007,
  ApplicationHired: 1008,
  ApplicationRejected: 1009,
  ApplicationWithdrawn: 1010,

  // Jobs & Projects (2xxx)
  NewJobPosted: 2001,
  JobStatusChanged: 2002,

  // Contracts (3xxx)
  ContractCreated: 3001,
  ContractPendingApproval: 3002,
  ContractActivated: 3003,
  ContractExpiringSoon: 3004,
  ContractExpired: 3005,
  ContractTerminated: 3006,
  ContractRejected: 3007,


  // Talent (5xxx)
  TalentStatusChanged: 5001,
  TalentHired: 5002,

  // Documents (6xxx)
  DocumentUploaded: 6001,

  // Skills & CV Analysis (7xxx)
  NewSkillDetectedFromCV: 7001,
  CVUploadedByDeveloper: 7002,
  SkillGroupAutoInvalidated: 7003, // Skill group bị auto-invalidate do thay đổi skill

  // Payments (8xxx)
  PaymentDueSoon: 8001,
  PaymentOverdue: 8002,
  PaymentReceived: 8003,
  PaymentCalculated: 8004,
  PaymentApproved: 8005,
  PaymentRejected: 8006,
  PaymentMarkedAsPaid: 8007,
  InvoiceRecorded: 8008,

  // Contact Inquiries (9xxx)
  ContactInquiryReceived: 9001,
  ContactInquiryAssigned: 9002,
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationPriority = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
} as const;

export type NotificationPriority = typeof NotificationPriority[keyof typeof NotificationPriority];

// Interfaces
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId: string;
  isRead: boolean;
  readAt?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  actionUrl?: string | null;
  iconClass?: string | null;
  metaData?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  userIds: string[];
  entityType?: string | null;
  entityId?: number | null;
  actionUrl?: string | null;
  iconClass?: string | null;
  metaData?: Record<string, string> | null;
}

export interface NotificationFilter {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
  title?: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

