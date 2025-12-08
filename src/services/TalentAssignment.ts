import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { TalentAssignmentStatusConstants, type TalentAssignmentModel, type TalentAssignmentCreateModel, type TalentAssignmentExtendModel, type TalentAssignmentTerminateModel, type TalentAssignmentUpdateModel, type TalentAssignmentFilter } from "../types/talentassignment.types";

export { TalentAssignmentStatusConstants };
export type { TalentAssignmentModel, TalentAssignmentCreateModel, TalentAssignmentExtendModel, TalentAssignmentTerminateModel, TalentAssignmentUpdateModel, TalentAssignmentFilter };

export const talentAssignmentService = {
  async getAll(filter?: TalentAssignmentFilter) {
    try {
      const params = new URLSearchParams();
      
      if (filter?.talentId)
        params.append("TalentId", filter.talentId.toString());
      if (filter?.projectId)
        params.append("ProjectId", filter.projectId.toString());
      if (filter?.partnerId)
        params.append("PartnerId", filter.partnerId.toString());
      if (filter?.talentApplicationId)
        params.append("TalentApplicationId", filter.talentApplicationId.toString());
      if (filter?.status)
        params.append("Status", filter.status);
      if (filter?.startDateFrom)
        params.append("StartDateFrom", filter.startDateFrom);
      if (filter?.startDateTo)
        params.append("StartDateTo", filter.startDateTo);
      if (filter?.endDateFrom)
        params.append("EndDateFrom", filter.endDateFrom);
      if (filter?.endDateTo)
        params.append("EndDateTo", filter.endDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/talentassignment${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      
      // Ensure response.data is an array
      const data = response.data;
      if (Array.isArray(data)) {
        return data as TalentAssignmentModel[];
      } else if (data && Array.isArray(data.data)) {
        return data.data as TalentAssignmentModel[];
      } else {
        console.warn("⚠️ Response không phải là mảng:", data);
        return [] as TalentAssignmentModel[];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("❌ Lỗi khi fetch TalentAssignment:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        throw error.response?.data || { message: "Không thể tải danh sách phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi tải danh sách phân công nhân sự" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talentassignment/${id}`);
      return response.data as TalentAssignmentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tải thông tin phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async create(payload: TalentAssignmentCreateModel) {
    try {
      const response = await apiClient.post("/talentassignment", payload);
      return response.data as TalentAssignmentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tạo phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi tạo phân công nhân sự" };
    }
  },

  async update(id: number, payload: TalentAssignmentUpdateModel) {
    try {
      const response = await apiClient.put(`/talentassignment/${id}/update-estimates`, payload);
      return response.data as TalentAssignmentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể cập nhật phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi cập nhật phân công nhân sự" };
    }
  },

  async extend(id: number, payload: TalentAssignmentExtendModel) {
    try {
      const response = await apiClient.post(`/talentassignment/${id}/extend`, payload);
      return response.data as TalentAssignmentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể gia hạn phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi gia hạn phân công nhân sự" };
    }
  },

  async terminate(id: number, payload: TalentAssignmentTerminateModel) {
    try {
      const response = await apiClient.post(`/talentassignment/${id}/terminate`, payload);
      return response.data as TalentAssignmentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể chấm dứt phân công nhân sự" };
      }
      throw { message: "Lỗi không xác định khi chấm dứt phân công nhân sự" };
    }
  },

  async getActiveByProject(projectId: number) {
    try {
      const response = await apiClient.get(`/talentassignment/project/${projectId}/active`);
      const data = response.data;
      if (Array.isArray(data)) {
        return data as TalentAssignmentModel[];
      } else if (data && Array.isArray(data.data)) {
        return data.data as TalentAssignmentModel[];
      } else {
        console.warn("⚠️ Response không phải là mảng:", data);
        return [] as TalentAssignmentModel[];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tải danh sách phân công đang hoạt động" };
      }
      throw { message: "Lỗi không xác định khi tải danh sách phân công đang hoạt động" };
    }
  },
};

