import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { CertificateType, CertificateTypeFilter, CertificateTypeCreate } from "../types/certificatetype.types";

export type { CertificateType, CertificateTypeFilter, CertificateTypeCreate };

export const certificateTypeService = {
  async getAll(filter?: CertificateTypeFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.name) params.append("Name", filter.name);
      if (filter?.skillGroupId) params.append("SkillGroupId", filter.skillGroupId.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/certificatetype${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch certificate types" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/certificatetype/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch certificate type details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: CertificateTypeCreate) {
    try {
      const response = await apiClient.post("/certificatetype", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new certificate type" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<CertificateTypeCreate>) {
    try {
      const response = await apiClient.put(`/certificatetype/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update certificate type" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/certificatetype/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete certificate type" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
