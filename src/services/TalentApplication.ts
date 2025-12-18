import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { TalentApplicationStatusConstants, type TalentApplication, type TalentApplicationCreate, type TalentApplicationFilter, type TalentApplicationStatusUpdate, type TalentApplicationStatusTransitionResult, type TalentApplicationUpdate, type TalentApplicationDetailed, type TalentApplicationsByJobRequestResponse, type ApplicationOwnershipTransferModel, type BulkApplicationOwnershipTransferModel, type ApplicationOwnershipTransferResult, type BulkApplicationOwnershipTransferResult } from "../types/talentapplication.types";

export { TalentApplicationStatusConstants };
export type { TalentApplication, TalentApplicationCreate, TalentApplicationFilter, TalentApplicationStatusUpdate, TalentApplicationStatusTransitionResult, TalentApplicationUpdate, TalentApplicationDetailed, TalentApplicationsByJobRequestResponse, ApplicationOwnershipTransferModel, BulkApplicationOwnershipTransferModel, ApplicationOwnershipTransferResult, BulkApplicationOwnershipTransferResult };

export const talentApplicationService = {
  async getAll(filter?: TalentApplicationFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.jobRequestId) params.append("JobRequestId", filter.jobRequestId.toString());
      if (filter?.cvId) params.append("CvId", filter.cvId.toString());
      if (filter?.submittedBy) params.append("SubmittedBy", filter.submittedBy);
      if (filter?.status) params.append("Status", filter.status);
      if (filter?.submittedFrom) params.append("SubmittedFrom", filter.submittedFrom);
      if (filter?.submittedTo) params.append("SubmittedTo", filter.submittedTo);
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/talentapplication${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      
      // Ensure response.data is an array
      const data = response.data;
      if (Array.isArray(data)) {
        return data as TalentApplication[];
      } else if (data && Array.isArray(data.data)) {
        // In case API returns { data: [...] }
        return data.data as TalentApplication[];
      } else {
        console.warn("⚠️ Response không phải là mảng:", data);
        return [] as TalentApplication[];
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("❌ Lỗi khi fetch TalentApplication:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        throw error.response?.data || { message: "Không thể tải danh sách đơn ứng tuyển" };
      }
      throw { message: "Lỗi không xác định khi tải danh sách đơn ứng tuyển" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talentapplication/${id}`);
      return response.data as TalentApplication;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getDetailedById(id: number) {
    try {
      const response = await apiClient.get(`/talentapplication/${id}/detailed`);
      
      // API trả về format: { success: true, message: "...", data: {...} }
      const responseData = response.data;
      
      // Kiểm tra nếu có cấu trúc { success, message, data }
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data as TalentApplicationDetailed;
      }
      
      // Nếu không có cấu trúc trên, trả về trực tiếp
      return responseData as TalentApplicationDetailed;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("❌ Lỗi khi fetch TalentApplicationDetailed:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        throw error.response?.data || { message: "Không thể tải thông tin chi tiết đơn ứng tuyển" };
      }
      throw { message: "Lỗi không xác định khi tải thông tin chi tiết" };
    }
  },

  async create(payload: TalentApplicationCreate) {
    try {
      const response = await apiClient.post("/talentapplication", payload);
      return response.data as TalentApplication;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi tạo đơn ứng tuyển" };
    }
  },

  async update(id: number, payload: TalentApplicationUpdate) {
    try {
      const response = await apiClient.put(`/talentapplication/${id}`, payload);
      return response.data as TalentApplication;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi cập nhật đơn ứng tuyển" };
    }
  },

  async updateStatus(id: number, payload: TalentApplicationStatusUpdate) {
    try {
      const response = await apiClient.patch(`/talentapplication/${id}/change-status`, payload);
      return response.data as TalentApplicationStatusTransitionResult;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật trạng thái đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi cập nhật trạng thái" };
    }
  },

  async getByJobRequest(jobRequestId: number, status?: string) {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const url = `/talentapplication/by-jobrequest/${jobRequestId}${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);

      const data = response.data as TalentApplicationsByJobRequestResponse;
      if (!data || !data.success) {
        console.warn("⚠️ Response getByJobRequest không thành công:", response.data);
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("❌ Lỗi khi gọi getByJobRequest:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw error.response?.data || { message: "Không thể tải danh sách hồ sơ ứng tuyển theo job request" };
      }
      throw { message: "Lỗi không xác định khi tải danh sách hồ sơ ứng tuyển theo job request" };
    }
  },

  async transferOwnership(id: number, payload: ApplicationOwnershipTransferModel) {
    try {
      const response = await apiClient.post(`/talentapplication/${id}/transfer-ownership`, payload);
      return response.data as ApplicationOwnershipTransferResult;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể chuyển quyền sở hữu đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi chuyển quyền sở hữu đơn ứng tuyển" };
    }
  },

  async bulkTransferOwnership(payload: BulkApplicationOwnershipTransferModel) {
    try {
      const response = await apiClient.post("/talentapplication/bulk-transfer-ownership", payload);
      return response.data as BulkApplicationOwnershipTransferResult;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể chuyển quyền sở hữu hàng loạt đơn ứng tuyển" };
      throw { message: "Lỗi không xác định khi chuyển quyền sở hữu hàng loạt đơn ứng tuyển" };
    }
  },
};

