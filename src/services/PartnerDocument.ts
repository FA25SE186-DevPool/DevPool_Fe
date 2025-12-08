import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { PartnerDocument, PartnerDocumentCreate, PartnerDocumentFilter } from "../types/partnerdocument.types";

export type { PartnerDocument, PartnerDocumentCreate, PartnerDocumentFilter };

export const partnerDocumentService = {
  // Lấy danh sách PartnerDocument với filter
  async getAll(filter?: PartnerDocumentFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.partnerContractPaymentId)
        params.append("PartnerContractPaymentId", filter.partnerContractPaymentId.toString());
      if (filter?.documentTypeId)
        params.append("DocumentTypeId", filter.documentTypeId.toString());
      if (filter?.uploadedByUserId)
        params.append("UploadedByUserId", filter.uploadedByUserId);
      if (filter?.source)
        params.append("Source", filter.source);
      if (filter?.uploadDateFrom)
        params.append("UploadDateFrom", filter.uploadDateFrom);
      if (filter?.uploadDateTo)
        params.append("UploadDateTo", filter.uploadDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/partnerdocument${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách tài liệu đối tác" };
      throw { message: "Lỗi không xác định khi tải danh sách tài liệu đối tác" };
    }
  },

  // Lấy PartnerDocument theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/partnerdocument/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin tài liệu đối tác" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới PartnerDocument
  async create(payload: PartnerDocumentCreate) {
    try {
      const response = await apiClient.post("/partnerdocument", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo tài liệu đối tác" };
      throw { message: "Lỗi không xác định khi tạo tài liệu đối tác" };
    }
  },

  // Xóa PartnerDocument
  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/partnerdocument/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa tài liệu đối tác" };
      throw { message: "Lỗi không xác định khi xóa tài liệu đối tác" };
    }
  },
};

