import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { DocumentType, DocumentTypeCreate, DocumentTypeFilter } from "../types/documenttype.types";

export type { DocumentType, DocumentTypeCreate, DocumentTypeFilter };

export const documentTypeService = {
  // Lấy danh sách DocumentType với filter
  async getAll(filter?: DocumentTypeFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.typeName) params.append("TypeName", filter.typeName);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/documenttype${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách loại tài liệu" };
      throw { message: "Lỗi không xác định khi tải danh sách loại tài liệu" };
    }
  },

  // Lấy DocumentType theo id
  async getById(id: number) {
    try {
      const response = await axios.get(`/documenttype/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin loại tài liệu" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới DocumentType
  async create(payload: DocumentTypeCreate) {
    try {
      const response = await axios.post("/documenttype", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo loại tài liệu" };
      throw { message: "Lỗi không xác định khi tạo loại tài liệu" };
    }
  },

  // Cập nhật DocumentType
  async update(id: number, payload: DocumentTypeCreate) {
    try {
      const response = await axios.put(`/documenttype/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật loại tài liệu" };
      throw { message: "Lỗi không xác định khi cập nhật loại tài liệu" };
    }
  },

  // Xóa DocumentType
  async deleteById(id: number) {
    try {
      const response = await axios.delete(`/documenttype/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa loại tài liệu" };
      throw { message: "Lỗi không xác định khi xóa loại tài liệu" };
    }
  },
};
