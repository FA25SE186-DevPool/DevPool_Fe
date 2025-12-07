import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { Location, LocationCreatePayload, LocationFilter } from "../types/location.types";

export type { Location, LocationCreatePayload, LocationFilter };

export const locationService = {
  async getAll(filter?: LocationFilter): Promise<Location[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.code) params.append("Code", filter.code);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/location${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách khu vực làm việc" };
      throw { message: "Lỗi không xác định khi tải danh sách khu vực làm việc" };
    }
  },

  async getById(id: number): Promise<Location> {
    try {
      const response = await axios.get(`/location/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải khu vực làm việc" };
      throw { message: "Lỗi không xác định khi tải khu vực làm việc" };
    }
  },

  async create(payload: LocationCreatePayload): Promise<Location> {
    try {
      const response = await axios.post("/location", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo khu vực làm việc" };
      throw { message: "Lỗi không xác định khi tạo khu vực làm việc" };
    }
  },

  async update(id: number, payload: Partial<LocationCreatePayload>): Promise<Location> {
    try {
      const response = await axios.put(`/location/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật khu vực làm việc" };
      throw { message: "Lỗi không xác định khi cập nhật khu vực làm việc" };
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/location/${id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa khu vực làm việc" };
      throw { message: "Lỗi không xác định khi xóa khu vực làm việc" };
    }
  },
};



