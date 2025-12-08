import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ProjectPeriodModel, ProjectPeriodCreateModel, ProjectPeriodFilter } from "../types/projectperiod.types";

export type { ProjectPeriodModel, ProjectPeriodCreateModel, ProjectPeriodFilter };

export const projectPeriodService = {
  // Lấy danh sách ProjectPeriod với filter
  async getAll(filter?: ProjectPeriodFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.projectId)
        params.append("ProjectId", filter.projectId.toString());
      if (filter?.periodMonth)
        params.append("PeriodMonth", filter.periodMonth.toString());
      if (filter?.periodYear)
        params.append("PeriodYear", filter.periodYear.toString());
      if (filter?.status)
        params.append("Status", filter.status);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/projectperiod${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data as ProjectPeriodModel[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách chu kỳ thanh toán dự án" };
      throw { message: "Lỗi không xác định khi tải danh sách chu kỳ thanh toán dự án" };
    }
  },

  // Lấy ProjectPeriod theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/projectperiod/${id}`);
      return response.data as ProjectPeriodModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin chu kỳ thanh toán dự án" };
      throw { message: "Lỗi không xác định khi tải thông tin chu kỳ thanh toán dự án" };
    }
  },

  // Tạo mới ProjectPeriod
  async create(payload: ProjectPeriodCreateModel) {
    try {
      const response = await apiClient.post("/projectperiod", payload);
      return response.data as ProjectPeriodModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo chu kỳ thanh toán dự án" };
      throw { message: "Lỗi không xác định khi tạo chu kỳ thanh toán dự án" };
    }
  },

  // Lấy báo cáo tổng hợp cho ProjectPeriod
  async getConsolidatedReport(projectPeriodId: number) {
    try {
      const response = await apiClient.get(`/projectperiod/${projectPeriodId}/consolidated-report`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải báo cáo tổng hợp" };
      throw { message: "Lỗi không xác định khi tải báo cáo tổng hợp" };
    }
  },

  // Tạo contract payments cho talent assignment trong project period
  async createPaymentsForAssignment(projectPeriodId: number, talentAssignmentId: number) {
    try {
      const response = await apiClient.post(`/projectperiod/${projectPeriodId}/create-payments-for-assignment`, {
        talentAssignmentId,
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo contract payments cho talent assignment" };
      throw { message: "Lỗi không xác định khi tạo contract payments cho talent assignment" };
    }
  },
};

