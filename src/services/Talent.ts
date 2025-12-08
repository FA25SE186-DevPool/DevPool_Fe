import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { 
  Talent, 
  TalentFilter, 
  TalentCreate, 
  TalentSkillCreateModel, 
  TalentWorkExperienceCreateModel, 
  TalentProjectCreateModel, 
  TalentCertificateCreateModel, 
  TalentJobRoleLevelCreateModel, 
  TalentCVCreateModel, 
  TalentWithRelatedDataCreateModel, 
  TalentStatusUpdateModel, 
  TalentUpdateModel, 
  TalentStatusTransitionResult, 
  CreateDeveloperAccountModel, 
  CreateDeveloperAccountResult, 
  HandoverTalentRequest, 
  HandoverTalentResponse, 
  TalentDetailedModel 
} from "../types/talent.types";

export type { 
  Talent,
  TalentFilter,
  TalentCreate,
  TalentSkillCreateModel,
  TalentWorkExperienceCreateModel,
  TalentProjectCreateModel,
  TalentCertificateCreateModel,
  TalentJobRoleLevelCreateModel,
  TalentCVCreateModel,
  TalentWithRelatedDataCreateModel,
  TalentStatusUpdateModel,
  TalentUpdateModel,
  TalentStatusTransitionResult,
  CreateDeveloperAccountModel,
  CreateDeveloperAccountResult,
  HandoverTalentRequest,
  HandoverTalentResponse,
  TalentDetailedModel
};

export const talentService = {
  async getAll(filter?: TalentFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.currentPartnerId) params.append("CurrentPartnerId", filter.currentPartnerId.toString());
      if (filter?.fullName) params.append("FullName", filter.fullName);
      if (filter?.email) params.append("Email", filter.email);
      if (filter?.locationId) params.append("LocationId", filter.locationId.toString());
      if (filter?.workingMode !== undefined) params.append("WorkingMode", filter.workingMode.toString());
      if (filter?.status) params.append("Status", filter.status);
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/talent${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talents" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talent/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentCreate) {
    try {
      const response = await apiClient.post("/talent", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async createWithRelatedData(payload: TalentWithRelatedDataCreateModel) {
    try {
      const response = await apiClient.post("/talent/with-related-data", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create talent with related data" };
      throw { message: "Unexpected error occurred during creation with related data" };
    }
  },

  async update(id: number, payload: Partial<TalentCreate>) {
    try {
      const response = await apiClient.put(`/talent/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async updateProfile(id: number, payload: TalentUpdateModel) {
    try {
      const response = await apiClient.patch(`/talent/${id}/profile`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent profile" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/talent/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async changeStatus(id: number, payload: TalentStatusUpdateModel) {
    try {
      const response = await apiClient.patch(`/talent/${id}/change-status`, payload);
      return response.data as TalentStatusTransitionResult;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to change talent status" };
      throw { message: "Unexpected error occurred during status change" };
    }
  },

  async getByClientOrProject(clientCompanyId?: number, projectId?: number) {
    try {
      if (!clientCompanyId && !projectId) {
        throw { message: "Either clientCompanyId or projectId must be provided" };
      }

      const params = new URLSearchParams();
      if (clientCompanyId) params.append("clientCompanyId", clientCompanyId.toString());
      if (projectId) params.append("projectId", projectId.toString());

      const url = `/talent/by-client-or-project${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      
      // Backend trả về format { success, message, data }
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback nếu format khác
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to fetch talents by client or project" };
      }
      throw error || { message: "Unexpected error occurred" };
    }
  },

  /**
   * Create developer account for talent (Workflow 4.3)
   * Validates: Talent.Status == Working AND Talent.UserId == null
   * Creates user account with role=Dev, links to talent, and sends credentials email
   */
  async createDeveloperAccount(id: number, payload: CreateDeveloperAccountModel): Promise<CreateDeveloperAccountResult> {
    try {
      const response = await apiClient.post(`/talent/${id}/create-account`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to create developer account" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Lấy danh sách Talent với tất cả dữ liệu liên quan (detailed)
   * Endpoint: GET /talent/detailed
   */
  async getAllDetailed(filter?: TalentFilter): Promise<TalentDetailedModel[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.currentPartnerId) params.append("CurrentPartnerId", filter.currentPartnerId.toString());
      if (filter?.fullName) params.append("FullName", filter.fullName);
      if (filter?.email) params.append("Email", filter.email);
      if (filter?.locationId) params.append("LocationId", filter.locationId.toString());
      if (filter?.workingMode !== undefined) params.append("WorkingMode", filter.workingMode.toString());
      if (filter?.status) params.append("Status", filter.status);
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      
      const url = `/talent/detailed${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      
      // Backend trả về format { success, message, data }
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback nếu format khác
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to fetch detailed talents" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Chuyển giao quyền quản lý Talent từ TA hiện tại (JWT) sang TA khác
   * Endpoint: POST /talent/{id}/handover-assignment
   * Lưu ý: Backend đã đổi role từ HR sang TA, đảm bảo backend xử lý notification đúng role "TA"
   * @param id - ID của Talent
   * @param payload - HandoverTalentRequest (toUserId, note?)
   * @returns HandoverTalentResponse
   */
  async handoverAssignment(id: number, payload: HandoverTalentRequest): Promise<HandoverTalentResponse> {
    try {
      const response = await apiClient.post<HandoverTalentResponse>(`/talent/${id}/handover-assignment`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to handover talent assignment" };
      }
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Lấy danh sách Talent mà user hiện tại đang quản lý
   * Endpoint: GET /talent/my-managed-talents
   * Trả về các Talent có active TalentStaffAssignment với Responsibility = TaManagement
   * @returns Promise với mảng Talent
   */
  async getMyManagedTalents(): Promise<Talent[]> {
    try {
      const response = await apiClient.get(`/talent/my-managed-talents`);
      
      // Backend trả về format { success, message, data }
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback nếu format khác (trả về trực tiếp mảng)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Nếu không có data, trả về mảng rỗng
      return [];
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        // Xử lý lỗi 401 (Unauthorized)
        if (status === 401) {
          const message = errorData?.message || "Không có quyền truy cập. Vui lòng đăng nhập lại.";
          throw { message };
        }
        
        // Xử lý các lỗi khác
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Không thể lấy danh sách Talent đang quản lý" };
      }
      throw { message: "Lỗi không xác định khi lấy danh sách Talent đang quản lý" };
    }
  },
};