import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";

// Types for Partner Dashboard API
export interface PartnerDashboardStats {
  // Talent statistics
  totalTalents: number;
  totalActiveTalents: number; // Working status
  totalAvailableTalents: number; // Available status
  totalInterviewingTalents: number; // Interviewing status

  // Financial summary
  totalUnpaidAmount: number; // Current debt/unpaid
  paymentsReceivedThisMonth: number;
  paymentsReceivedThisYear: number;

  // Additional metrics
  totalActiveProjects: number; // Projects with active assignments
}

export interface PartnerTalentSummary {
  talentId: number;
  code?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;

  // Current assignment info (if Working)
  currentProjectName?: string;
  currentRole?: string;
  assignmentStartDate?: string;
  assignmentEndDate?: string;

  // Interview info (if Interviewing)
  interviewingForClient?: string;
  nextInterviewDate?: string;

  // Skills summary
  primarySkills?: string; // Comma-separated top skills
}

export interface PartnerTalentDetail extends PartnerTalentSummary {
  // Additional detail fields
  bio?: string;
  locationId?: number;
  workingMode: number;
  githubUrl?: string;
  portfolioUrl?: string;
  dateOfBirth?: string;

  // Related data
  skills?: any[];
  workExperience?: any[];
  projects?: any[];
  certificates?: any[];
  availableTimes?: any[];
}

export interface PartnerAssignmentSummary {
  assignmentId: number;
  talentId: number;
  talentName?: string;
  talentCode?: string;
  projectId: number;
  projectName?: string;
  projectCode?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  status?: string;

  // Buying Rate (Partner rate) - VISIBLE
  buyingRate?: number; // EstimatedPartnerRate
  currencyCode?: string;

  // Document
  commitmentFileUrl?: string; // Work Order / Assignment document
}

export interface PartnerMonthlyPayment {
  paymentId: number;
  projectPeriodId: number;

  // Period info
  periodMonth: number;
  periodYear: number;
  periodDisplay?: string; // e.g., "December 2025"

  // Talent info
  talentId: number;
  talentName?: string;
  talentCode?: string;

  // Project info
  projectName?: string;

  // Work hours
  reportedHours?: number; // Actual work hours
  standardHours: number; // Standard hours (usually 160)
  otHours?: number; // Overtime hours

  // Payment amount
  plannedAmountVND?: number; // Expected amount
  actualAmountVND?: number; // Final amount after verification
  currencyCode?: string;
  unitPriceForeignCurrency: number;
  exchangeRate: number;

  // Timesheet
  clientTimesheetFileUrl?: string; // Signed timesheet from client

  // Status
  contractStatus?: string; // Draft/Verified/Approved/Rejected
  paymentStatus?: string; // Pending/Processing/Paid/Overdue
  paymentDate?: string;

  // Payment proof documents
  paymentProofs?: PartnerPaymentProof[];
  notes?: string;
}

export interface PartnerPaymentProof {
  documentId: number;
  documentType?: string; // "PaymentProof", "PartnerReceipt"
  fileUrl?: string;
  uploadedAt?: string;
}

export interface PartnerPaymentDetail extends PartnerMonthlyPayment {
  // Inherits all fields from PartnerMonthlyPayment
  // Additional fields if needed for detailed view
}

export const partnerDashboardService = {
  /**
   * Get Partner Dashboard - Overview statistics
   * Shows talent counts and financial summary
   */
  async getDashboard(partnerId: number): Promise<PartnerDashboardStats> {
    try {
      const response = await apiClient.get(`/partner/${partnerId}/dashboard`);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error("Partner not found");
        }
        throw error.response?.data || { message: "Failed to fetch dashboard" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Get My Talents - List of talents managed by this partner
   * Optionally filter by status
   */
  async getMyTalents(partnerId: number, status?: string): Promise<PartnerTalentSummary[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const url = `/partner/${partnerId}/talents${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Failed to fetch talents" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Get Talent Detail - Detailed information about a specific talent
   */
  async getTalentDetail(partnerId: number, talentId: number): Promise<PartnerTalentDetail> {
    try {
      const response = await apiClient.get(`/partner/${partnerId}/talents/${talentId}`);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error("Talent not found");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied to this talent");
        }
        throw error.response?.data || { message: "Failed to fetch talent detail" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Get My Contracts/Assignments - List of talent assignments with buying rates
   * Shows ONLY partner rates, hides client rates
   */
  async getMyAssignments(partnerId: number, status?: string): Promise<PartnerAssignmentSummary[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const url = `/partner/${partnerId}/assignments${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Failed to fetch assignments" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Get Monthly Payments - Track payments for a specific period (month/year)
   */
  async getMonthlyPayments(partnerId: number, year: number, month: number): Promise<PartnerMonthlyPayment[]> {
    try {
      if (month < 1 || month > 12) {
        throw new Error("Month must be between 1 and 12");
      }

      const response = await apiClient.get(`/partner/${partnerId}/payments/${year}/${month}`);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Failed to fetch monthly payments" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Get Payment Detail - Detailed information about a specific payment
   */
  async getPaymentDetail(partnerId: number, paymentId: number): Promise<PartnerPaymentDetail> {
    try {
      const response = await apiClient.get(`/partner/${partnerId}/payments/${paymentId}`);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error("Payment not found");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied to this payment");
        }
        throw error.response?.data || { message: "Failed to fetch payment detail" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },
};

