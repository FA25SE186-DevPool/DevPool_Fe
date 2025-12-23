import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { JobRequestStatus, type JobSkill, type JobRequest, type JobRequestPayload, type JobRequestStatusUpdateModel, type JobRequestFilter } from "../types/jobrequest.types";

export interface OwnershipTransferModel {
  newOwnerId: string;
  reason?: string;
}

export { JobRequestStatus };
export type { JobSkill, JobRequest, JobRequestPayload, JobRequestStatusUpdateModel, JobRequestFilter };

export const jobRequestService = {
  async getAll(filter?: JobRequestFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.projectId) params.append("ProjectId", filter.projectId.toString());
      if (filter?.jobRoleLevelId) params.append("JobRoleLevelId", filter.jobRoleLevelId.toString());
      if (filter?.applyProcessTemplateId)
        params.append("ApplyProcessTemplateId", filter.applyProcessTemplateId.toString());
      // CV Template filter removed
      if (filter?.title) params.append("Title", filter.title);
      if (filter?.locationId) params.append("LocationId", filter.locationId.toString());
      if (filter?.workingMode !== undefined) params.append("WorkingMode", filter.workingMode.toString());
      if (filter?.status !== undefined) params.append("Status", filter.status.toString());
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");
      if (filter?.pageNumber !== undefined) params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize !== undefined) params.append("PageSize", filter.pageSize.toString());

      const url = `/jobrequest${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/jobrequest/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async create(payload: JobRequestPayload) {
    try {
      const response = await apiClient.post("/jobrequest", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi tạo yêu cầu" };
    }
  },

  async update(id: number, payload: Partial<JobRequestPayload>) {
    try {
      const response = await apiClient.put(`/jobrequest/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi cập nhật yêu cầu" };
    }
  },

  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/jobrequest/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi xóa yêu cầu tuyển dụng" };
    }
  },

  async transferOwnership(id: number, payload: OwnershipTransferModel) {
    try {
      const response = await apiClient.post(`/jobrequest/${id}/transfer-ownership`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể chuyển quyền sở hữu yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi chuyển quyền sở hữu yêu cầu tuyển dụng" };
    }
  },

  async changeStatus(id: number, payload: JobRequestStatusUpdateModel) {
    try {
      const response = await apiClient.patch(`/jobrequest/${id}/change-status`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật trạng thái yêu cầu tuyển dụng" };
      throw { message: "Lỗi không xác định khi cập nhật trạng thái yêu cầu tuyển dụng" };
    }
  },
};
