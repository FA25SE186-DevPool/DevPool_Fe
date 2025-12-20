// Status constants - can be used as enum-like object
export const ContactInquiryStatus = {
  New: "New",
  InProgress: "InProgress",
  Closed: "Closed",
} as const;

// Status type derived from the constant
export type ContactInquiryStatusType = typeof ContactInquiryStatus[keyof typeof ContactInquiryStatus];

// Status constants with additional info
export const ContactInquiryStatusConstants = {
  New: "New",
  InProgress: "InProgress",
  Closed: "Closed",
  AllStatuses: ["New", "InProgress", "Closed"] as const,
  AllowedTransitions: {
    New: ["InProgress", "Closed"],
    InProgress: ["Closed"],
    Closed: []
  } as Record<string, string[]>
};

// Model interfaces
export interface ContactInquiryModel {
  id: number;
  fullName: string;
  email: string;
  company?: string | null;
  subject: string;
  content: string;
  status: ContactInquiryStatusType;
  assignedTo?: string | null;
  assignedToName?: string | null;
  contactedAt?: string | null; // DateTime as ISO string
  contactedBy?: string | null;
  responseNotes?: string | null;
  createdAt: string; // DateTime as ISO string
  updatedAt?: string | null; // DateTime as ISO string
}

export interface ContactInquiryCreateModel {
  fullName: string;
  email: string;
  company?: string | null;
  subject: string;
  content: string;
}

export interface ContactInquiryFilterModel {
  fullName?: string;
  email?: string;
  company?: string;
  subject?: string;
  status?: ContactInquiryStatusType;
  assignedTo?: string;
  createdAtFrom?: string; // DateTime as ISO string
  createdAtTo?: string; // DateTime as ISO string
  excludeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ContactInquiryStatusUpdateModel {
  newStatus: ContactInquiryStatusType | number; // Can be string or enum number (1, 2, 3)
  responseNotes?: string | null;
  jobRequestId?: string;
}

export interface ContactInquiryClaimResult {
  isSuccess: boolean;
  message: string;
  inquiryId: number;
  assignedTo?: string | null;
  assignedToName?: string | null;
}

export interface ContactInquiryStatusTransitionResult {
  isSuccess: boolean;
  message: string;
  oldStatus?: string;
  newStatus?: string;
  validationErrors?: string[];
}

// PagedResult đã được chuyển sang common.types.ts
export type { PagedResult } from './common.types';

