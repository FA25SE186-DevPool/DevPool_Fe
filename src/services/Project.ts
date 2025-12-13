import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { Project, ProjectPayload, ProjectFilter, ProjectStatusUpdateModel, ProjectStatusTransitionResult, ProjectDetailedModel } from "../types/project.types";

export type { Project, ProjectPayload, ProjectFilter, ProjectStatusUpdateModel, ProjectStatusTransitionResult, ProjectDetailedModel };

export const projectService = {
  async getAll(filter?: ProjectFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.clientCompanyId)
        params.append("ClientCompanyId", filter.clientCompanyId.toString());
      if (filter?.marketId)
        params.append("MarketId", filter.marketId.toString());
      if (filter?.industryIds?.length) {
        filter.industryIds.forEach((industryId) =>
          params.append("IndustryIds", industryId.toString())
        );
      }
      if (filter?.name)
        params.append("Name", filter.name);
      if (filter?.status)
        params.append("Status", filter.status);
      if (filter?.startDateFrom)
        params.append("StartDateFrom", filter.startDateFrom);
      if (filter?.startDateTo)
        params.append("StartDateTo", filter.startDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");
      if (filter?.pageNumber !== undefined) params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize !== undefined) params.append("PageSize", filter.pageSize.toString());

      const url = `/project${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách dự án" };
      throw { message: "Lỗi không xác định khi tải danh sách dự án" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/project/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin dự án" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getDetailedById(id: number): Promise<ProjectDetailedModel> {
    try {
      const response = await apiClient.get(`/project/${id}/detailed`);
      // Backend trả về { success: true, message: "...", data: ProjectDetailedModel }
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin chi tiết dự án" };
      throw { message: "Lỗi không xác định khi tải thông tin chi tiết dự án" };
    }
  },

  async create(payload: Partial<ProjectPayload>) {
    try {
      const response = await apiClient.post("/project", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo dự án" };
      throw { message: "Lỗi không xác định khi tạo dự án" };
    }
  },

  async update(id: number, payload: Partial<ProjectPayload>) {
    try {
      const response = await apiClient.put(`/project/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật dự án" };
      throw { message: "Lỗi không xác định khi cập nhật dự án" };
    }
  },

  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/project/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa dự án" };
      throw { message: "Lỗi không xác định khi xóa dự án" };
    }
  },

  async updateStatus(id: number, payload: ProjectStatusUpdateModel): Promise<ProjectStatusTransitionResult> {
    try {
      const response = await apiClient.put(`/project/${id}/change-status`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể thay đổi trạng thái dự án" };
      throw { message: "Lỗi không xác định khi thay đổi trạng thái dự án" };
    }
  },
};
