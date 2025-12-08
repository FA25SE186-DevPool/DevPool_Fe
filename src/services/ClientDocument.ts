import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ClientDocument, ClientDocumentCreate, ClientDocumentFilter } from "../types/clientdocument.types";

export type { ClientDocument, ClientDocumentCreate, ClientDocumentFilter };

export const clientDocumentService = {
  // Lấy danh sách ClientDocument với filter
  async getAll(filter?: ClientDocumentFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.clientContractPaymentId)
        params.append("ClientContractPaymentId", filter.clientContractPaymentId.toString());
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

      const url = `/clientdocument${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách tài liệu khách hàng" };
      throw { message: "Lỗi không xác định khi tải danh sách tài liệu khách hàng" };
    }
  },

  // Lấy ClientDocument theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/clientdocument/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin tài liệu khách hàng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới ClientDocument
  async create(payload: ClientDocumentCreate) {
    try {
      const response = await apiClient.post("/clientdocument", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo tài liệu khách hàng" };
      throw { message: "Lỗi không xác định khi tạo tài liệu khách hàng" };
    }
  },

  // Xóa ClientDocument
  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/clientdocument/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa tài liệu khách hàng" };
      throw { message: "Lỗi không xác định khi xóa tài liệu khách hàng" };
    }
  },
};

