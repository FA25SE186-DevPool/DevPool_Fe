import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ApplyProcessTemplate, ApplyProcessTemplateFilter, ApplyProcessTemplateCreatePayload } from "../types/applyprocesstemplate.types";

export type { ApplyProcessTemplate, ApplyProcessTemplateFilter, ApplyProcessTemplateCreatePayload };

export const applyProcessTemplateService = {
  async getAll(filter?: ApplyProcessTemplateFilter): Promise<ApplyProcessTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/applyprocesstemplate${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách mẫu quy trình apply" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getById(id: number): Promise<ApplyProcessTemplate> {
    try {
      const response = await apiClient.get(`/applyprocesstemplate/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải mẫu quy trình apply" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async create(payload: ApplyProcessTemplateCreatePayload): Promise<ApplyProcessTemplate> {
    try {
      const response = await apiClient.post("/applyprocesstemplate", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo mẫu quy trình apply" };
      throw { message: "Lỗi không xác định khi tạo dữ liệu" };
    }
  },

  async update(id: number, payload: Partial<ApplyProcessTemplateCreatePayload>): Promise<ApplyProcessTemplate> {
    try {
      const response = await apiClient.put(`/applyprocesstemplate/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật mẫu quy trình apply" };
      throw { message: "Lỗi không xác định khi cập nhật dữ liệu" };
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/applyprocesstemplate/${id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa mẫu quy trình apply" };
      throw { message: "Lỗi không xác định khi xóa dữ liệu" };
    }
  },
};


