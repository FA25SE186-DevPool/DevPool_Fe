import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { Market, MarketPayload, MarketFilter } from "../types/market.types";

export type { Market, MarketPayload, MarketFilter };

export const marketService = {
  // Lấy danh sách Market
  async getAll(filter?: MarketFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/market${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách thị trường" };
      throw { message: "Lỗi không xác định khi tải danh sách thị trường" };
    }
  },

  // Lấy Market theo id
  async getById(id: number) {
    try {
      const response = await axios.get(`/market/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thị trường" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới Market
  async create(payload: MarketPayload) {
    try {
      const response = await axios.post("/market", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo thị trường" };
      throw { message: "Lỗi không xác định khi tạo thị trường" };
    }
  },

  // Cập nhật Market
  async update(id: number, payload: Partial<MarketPayload>) {
    try {
      const response = await axios.put(`/market/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật thị trường" };
      throw { message: "Lỗi không xác định khi cập nhật thị trường" };
    }
  },

  // Xóa Market
  async delete(id: number) {
    try {
      const response = await axios.delete(`/market/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa thị trường" };
      throw { message: "Lỗi không xác định khi xóa thị trường" };
    }
  },
};
