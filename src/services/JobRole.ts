import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { JobRole, JobRoleFilter, JobRoleCreatePayload } from "../types/jobrole.types";

export type { JobRole, JobRoleFilter, JobRoleCreatePayload };

export const jobRoleService = {
  async getAll(filter?: JobRoleFilter): Promise<JobRole[]> {
    try {
      const params = new URLSearchParams();

      if (filter?.name) params.append("Name", filter.name);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/jobrole${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách loại vị trí" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getById(id: number): Promise<JobRole> {
    try {
      const response = await apiClient.get(`/jobrole/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải loại vị trí" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async create(payload: JobRoleCreatePayload): Promise<JobRole> {
    try {
      const response = await apiClient.post("/jobrole", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo loại vị trí" };
      throw { message: "Lỗi không xác định khi tạo loại vị trí" };
    }
  },

  async update(id: number, payload: Partial<JobRoleCreatePayload>): Promise<JobRole> {
    try {
      const response = await apiClient.put(`/jobrole/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật loại vị trí" };
      throw { message: "Lỗi không xác định khi cập nhật loại vị trí" };
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/jobrole/${id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa loại vị trí" };
      throw { message: "Lỗi không xác định khi xóa loại vị trí" };
    }
  },
};
