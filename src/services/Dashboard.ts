import axios from "../configs/axios";
import { AxiosError } from "axios";
import type {
  ExecutiveDashboardModel,
  FinancialDashboardModel,
  TalentManagementDashboardModel,
  ProjectAssignmentDashboardModel,
  OperationsDashboardModel,
  AnalyticsReportsModel,
} from "../types/dashboard.types";

export type {
  ExecutiveDashboardModel,
  FinancialDashboardModel,
  TalentManagementDashboardModel,
  ProjectAssignmentDashboardModel,
  OperationsDashboardModel,
  AnalyticsReportsModel,
};

// ==================== SERVICE ====================

export const dashboardService = {
  /**
   * Get Executive Dashboard data
   */
  async getExecutiveDashboard(): Promise<ExecutiveDashboardModel> {
    try {
      const response = await axios.get("/dashboard/executive");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Executive Dashboard",
        };
      throw { message: "Lỗi không xác định khi tải Executive Dashboard" };
    }
  },

  /**
   * Get Financial Dashboard data
   */
  async getFinancialDashboard(): Promise<FinancialDashboardModel> {
    try {
      const response = await axios.get("/dashboard/financial");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Handle 501 Not Implemented
        if (error.response?.status === 501) {
          throw {
            message: "Financial Dashboard chưa được triển khai",
            code: "NOT_IMPLEMENTED",
          };
        }
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Financial Dashboard",
        };
      }
      throw { message: "Lỗi không xác định khi tải Financial Dashboard" };
    }
  },

  /**
   * Get Talent Management Dashboard data
   */
  async getTalentManagementDashboard(): Promise<TalentManagementDashboardModel> {
    try {
      const response = await axios.get("/dashboard/talent-management");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Handle 501 Not Implemented
        if (error.response?.status === 501) {
          throw {
            message: "Talent Management Dashboard chưa được triển khai",
            code: "NOT_IMPLEMENTED",
          };
        }
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Talent Management Dashboard",
        };
      }
      throw { message: "Lỗi không xác định khi tải Talent Management Dashboard" };
    }
  },

  /**
   * Get Project & Assignment Dashboard data
   */
  async getProjectAssignmentDashboard(): Promise<ProjectAssignmentDashboardModel> {
    try {
      const response = await axios.get("/dashboard/project-assignment");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Handle 501 Not Implemented
        if (error.response?.status === 501) {
          throw {
            message: "Project & Assignment Dashboard chưa được triển khai",
            code: "NOT_IMPLEMENTED",
          };
        }
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Project & Assignment Dashboard",
        };
      }
      throw { message: "Lỗi không xác định khi tải Project & Assignment Dashboard" };
    }
  },

  /**
   * Get Operations Dashboard data
   */
  async getOperationsDashboard(): Promise<OperationsDashboardModel> {
    try {
      const response = await axios.get("/dashboard/operations");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Handle 501 Not Implemented
        if (error.response?.status === 501) {
          throw {
            message: "Operations Dashboard chưa được triển khai",
            code: "NOT_IMPLEMENTED",
          };
        }
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Operations Dashboard",
        };
      }
      throw { message: "Lỗi không xác định khi tải Operations Dashboard" };
    }
  },

  /**
   * Get Analytics & Reports data
   */
  async getAnalyticsReports(): Promise<AnalyticsReportsModel> {
    try {
      const response = await axios.get("/dashboard/analytics-reports");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Handle 501 Not Implemented
        if (error.response?.status === 501) {
          throw {
            message: "Analytics & Reports chưa được triển khai",
            code: "NOT_IMPLEMENTED",
          };
        }
        throw error.response?.data || {
          message: "Không thể tải dữ liệu Analytics & Reports",
        };
      }
      throw { message: "Lỗi không xác định khi tải Analytics & Reports" };
    }
  },
};

