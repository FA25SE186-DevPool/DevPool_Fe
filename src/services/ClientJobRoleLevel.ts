import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ClientJobRoleLevel, ClientJobRoleLevelCreate, ClientJobRoleLevelFilter } from "../types/clientjobrolelevel.types";

export type { ClientJobRoleLevel, ClientJobRoleLevelCreate, ClientJobRoleLevelFilter };

export const clientJobRoleLevelService = {
  // Lấy danh sách ClientJobRoleLevel với filter
  async getAll(filter?: ClientJobRoleLevelFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.clientCompanyId)
        params.append("ClientCompanyId", filter.clientCompanyId.toString());
      if (filter?.jobRoleLevelId)
        params.append("JobRoleLevelId", filter.jobRoleLevelId.toString());
      if (filter?.currency)
        params.append("Currency", filter.currency);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/clientjobrolelevel${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách job role level khách hàng" };
      throw { message: "Lỗi không xác định khi tải danh sách job role level khách hàng" };
    }
  },

  // Lấy ClientJobRoleLevel theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/clientjobrolelevel/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin job role level khách hàng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới ClientJobRoleLevel
  async create(payload: ClientJobRoleLevelCreate) {
    try {
      const response = await apiClient.post("/clientjobrolelevel", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo job role level khách hàng" };
      throw { message: "Lỗi không xác định khi tạo job role level khách hàng" };
    }
  },

  // Cập nhật ClientJobRoleLevel
  async update(id: number, payload: ClientJobRoleLevelCreate) {
    try {
      const response = await apiClient.put(`/clientjobrolelevel/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw { message: "Không tìm thấy job role level khách hàng để cập nhật" };
        }
        throw error.response?.data || { message: "Không thể cập nhật job role level khách hàng" };
      }
      throw { message: "Lỗi không xác định khi cập nhật job role level khách hàng" };
    }
  },

  // Xóa ClientJobRoleLevel
  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/clientjobrolelevel/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw { message: "Không tìm thấy job role level khách hàng để xóa" };
        }
        throw error.response?.data || { message: "Không thể xóa job role level khách hàng" };
      }
      throw { message: "Lỗi không xác định khi xóa job role level khách hàng" };
    }
  },
};

