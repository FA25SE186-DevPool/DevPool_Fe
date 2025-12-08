import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { ContactInquiryStatus, ContactInquiryStatusConstants, type ContactInquiryStatusType, type ContactInquiryModel, type ContactInquiryCreateModel, type ContactInquiryFilterModel, type ContactInquiryStatusUpdateModel, type ContactInquiryClaimResult, type ContactInquiryStatusTransitionResult, type PagedResult } from "../types/contactinquiry.types";

export { ContactInquiryStatus, ContactInquiryStatusConstants };
export type { ContactInquiryStatusType, ContactInquiryModel, ContactInquiryCreateModel, ContactInquiryFilterModel, ContactInquiryStatusUpdateModel, ContactInquiryClaimResult, ContactInquiryStatusTransitionResult, PagedResult };

export const contactInquiryService = {
  /**
   * Submit contact inquiry (Public endpoint - no auth required)
   */
  async submitInquiry(payload: ContactInquiryCreateModel): Promise<ContactInquiryModel> {
    try {
      const response = await apiClient.post<ContactInquiryModel>("/contactinquiry", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể gửi yêu cầu liên hệ" };
      throw { message: "Lỗi không xác định khi gửi yêu cầu" };
    }
  },

  /**
   * Get all contact inquiries with pagination and filtering (Sales, Manager, Admin only)
   */
  async getAll(filter?: ContactInquiryFilterModel): Promise<PagedResult<ContactInquiryModel>> {
    try {
      const params = new URLSearchParams();

      if (filter?.fullName) params.append("FullName", filter.fullName);
      if (filter?.email) params.append("Email", filter.email);
      if (filter?.company) params.append("Company", filter.company);
      if (filter?.subject) params.append("Subject", filter.subject);
      if (filter?.status) params.append("Status", filter.status);
      if (filter?.assignedTo) params.append("AssignedTo", filter.assignedTo);
      if (filter?.createdAtFrom) params.append("CreatedAtFrom", filter.createdAtFrom);
      if (filter?.createdAtTo) params.append("CreatedAtTo", filter.createdAtTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      if (filter?.pageNumber !== undefined)
        params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize !== undefined)
        params.append("PageSize", filter.pageSize.toString());

      const url = `/contactinquiry${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get<PagedResult<ContactInquiryModel>>(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách yêu cầu liên hệ" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Get contact inquiry by ID (Sales, Manager, Admin only)
   */
  async getById(id: number): Promise<ContactInquiryModel> {
    try {
      const response = await apiClient.get<ContactInquiryModel>(`/contactinquiry/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404)
          throw { message: "Không tìm thấy yêu cầu liên hệ" };
        throw error.response?.data || { message: "Không thể tải thông tin yêu cầu liên hệ" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Claim inquiry - Sales person claims it to prevent duplicate contacts (Sales, Manager, Admin only)
   */
  async claimInquiry(id: number): Promise<ContactInquiryClaimResult> {
    try {
      const response = await apiClient.post<ContactInquiryClaimResult>(`/contactinquiry/${id}/claim`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401)
          throw { message: "Bạn chưa đăng nhập" };
        throw error.response?.data || { message: "Không thể nhận yêu cầu liên hệ" };
      }
      throw { message: "Lỗi không xác định khi nhận yêu cầu" };
    }
  },

  /**
   * Update inquiry status (Sales, Manager, Admin only)
   */
  async updateStatus(
    id: number,
    payload: ContactInquiryStatusUpdateModel
  ): Promise<ContactInquiryStatusTransitionResult> {
    try {
      const response = await apiClient.put<ContactInquiryStatusTransitionResult>(
        `/contactinquiry/${id}/change-status`,
        payload
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401)
          throw { message: "Bạn chưa đăng nhập" };
        throw error.response?.data || { message: "Không thể cập nhật trạng thái" };
      }
      throw { message: "Lỗi không xác định khi cập nhật trạng thái" };
    }
  },

  /**
   * Get available status transitions for an inquiry (Sales, Manager, Admin only)
   */
  async getAvailableStatusTransitions(id: number): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(`/contactinquiry/${id}/available-status-transitions`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404)
          throw { message: "Không tìm thấy yêu cầu liên hệ" };
        throw error.response?.data || { message: "Không thể tải danh sách trạng thái có thể chuyển" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  }
};

