import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type {
  OvertimeTierCoefficient,
  OvertimeTierCoefficientFilter,
  OvertimeTierCoefficientConfig
} from "../types/overtimetiercoefficient.types";

export type { OvertimeTierCoefficient, OvertimeTierCoefficientFilter, OvertimeTierCoefficientConfig };

export const overtimeTierCoefficientService = {
  async getAll(filter?: OvertimeTierCoefficientFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.isActive !== undefined) params.append("IsActive", filter.isActive.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/overtimetiercoefficient${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch overtime tier coefficients" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/overtimetiercoefficient/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch overtime tier coefficient details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async updateConfig(id: number, payload: OvertimeTierCoefficientConfig) {
    try {
      const response = await apiClient.put(`/overtimetiercoefficient/${id}/config`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update overtime tier coefficient config" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
