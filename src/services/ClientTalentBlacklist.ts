import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ClientTalentBlacklist, ClientTalentBlacklistFilter, ClientTalentBlacklistCreate, ClientTalentBlacklistRemove, CheckBlacklistedResult } from "../types/clienttalentblacklist.types";

export type { ClientTalentBlacklist, ClientTalentBlacklistFilter, ClientTalentBlacklistCreate, ClientTalentBlacklistRemove, CheckBlacklistedResult };

export const clientTalentBlacklistService = {
  /**
   * Get all blacklist records (with optional filtering)
   */
  async getAll(filter?: ClientTalentBlacklistFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.clientCompanyId)
        params.append("ClientCompanyId", filter.clientCompanyId.toString());
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.isActive !== undefined)
        params.append("IsActive", filter.isActive ? "true" : "false");
      if (filter?.blacklistedDateFrom)
        params.append("BlacklistedDateFrom", filter.blacklistedDateFrom);
      if (filter?.blacklistedDateTo)
        params.append("BlacklistedDateTo", filter.blacklistedDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/clienttalentblacklist${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải danh sách blacklist",
        };
      throw { message: "Lỗi không xác định khi tải dữ liệu blacklist" };
    }
  },

  /**
   * Get blacklist record by ID
   */
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/clienttalentblacklist/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải thông tin blacklist",
        };
      throw { message: "Lỗi không xác định khi tải thông tin blacklist" };
    }
  },

  /**
   * Get all blacklisted talents for a specific client
   */
  async getByClientId(clientCompanyId: number, activeOnly: boolean = true) {
    try {
      const params = new URLSearchParams();
      if (activeOnly !== undefined)
        params.append("activeOnly", activeOnly ? "true" : "false");

      const url = `/clienttalentblacklist/by-client/${clientCompanyId}${
        params.toString() ? `?${params}` : ""
      }`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải danh sách blacklist theo client",
        };
      throw { message: "Lỗi không xác định khi tải dữ liệu blacklist theo client" };
    }
  },

  /**
   * Get all clients that blacklisted a specific talent
   */
  async getByTalentId(talentId: number, activeOnly: boolean = true) {
    try {
      const params = new URLSearchParams();
      if (activeOnly !== undefined)
        params.append("activeOnly", activeOnly ? "true" : "false");

      const url = `/clienttalentblacklist/by-talent/${talentId}${
        params.toString() ? `?${params}` : ""
      }`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải danh sách blacklist theo talent",
        };
      throw { message: "Lỗi không xác định khi tải dữ liệu blacklist theo talent" };
    }
  },

  /**
   * Check if a talent is blacklisted by a client
   */
  async checkBlacklisted(
    clientCompanyId: number,
    talentId: number
  ): Promise<CheckBlacklistedResult> {
    try {
      const params = new URLSearchParams();
      params.append("clientCompanyId", clientCompanyId.toString());
      params.append("talentId", talentId.toString());

      const url = `/clienttalentblacklist/check?${params}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể kiểm tra trạng thái blacklist",
        };
      throw { message: "Lỗi không xác định khi kiểm tra blacklist" };
    }
  },

  /**
   * Add talent to client's blacklist
   * Only Sales, HR, Manager can add
   */
  async add(payload: ClientTalentBlacklistCreate) {
    try {
      const response = await apiClient.post("/clienttalentblacklist", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể thêm talent vào blacklist",
        };
      throw { message: "Lỗi không xác định khi thêm blacklist" };
    }
  },

  /**
   * Remove talent from client's blacklist (un-blacklist)
   * Only Manager can remove
   */
  async removeBlacklist(id: number, payload: ClientTalentBlacklistRemove) {
    try {
      const response = await apiClient.post(`/clienttalentblacklist/${id}/remove`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể xóa talent khỏi blacklist",
        };
      throw { message: "Lỗi không xác định khi xóa blacklist" };
    }
  },

  /**
   * Soft delete blacklist record
   * Only Admin or Manager can delete
   */
  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/clienttalentblacklist/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể xóa blacklist",
        };
      throw { message: "Lỗi không xác định khi xóa blacklist" };
    }
  },
};

