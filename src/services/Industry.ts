import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { Industry, IndustryPayload, IndustryFilter } from "../types/industry.types";

export type { Industry, IndustryPayload, IndustryFilter };

export const industryService = {
  // Lấy danh sách Industry
  async getAll(filter?: IndustryFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/industry${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách lĩnh vực" };
      throw { message: "Lỗi không xác định khi tải danh sách lĩnh vực" };
    }
  },

  // Lấy Industry theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/industry/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải lĩnh vực" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới Industry
  async create(payload: IndustryPayload) {
    try {
      const response = await apiClient.post("/industry", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo lĩnh vực" };
      throw { message: "Lỗi không xác định khi tạo lĩnh vực" };
    }
  },

  // Cập nhật Industry
  async update(id: number, payload: Partial<IndustryPayload>) {
    try {
      const response = await apiClient.put(`/industry/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật lĩnh vực" };
      throw { message: "Lỗi không xác định khi cập nhật lĩnh vực" };
    }
  },

  // Xóa Industry
  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/industry/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa lĩnh vực" };
      throw { message: "Lỗi không xác định khi xóa lĩnh vực" };
    }
  },
};
