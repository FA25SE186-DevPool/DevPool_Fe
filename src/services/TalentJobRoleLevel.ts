import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { TalentJobRoleLevel, TalentJobRoleLevelFilter, TalentJobRoleLevelCreate } from "../types/talentjobrolelevel.types";

export type { TalentJobRoleLevel, TalentJobRoleLevelFilter, TalentJobRoleLevelCreate };

export const talentJobRoleLevelService = {
  async getAll(filter?: TalentJobRoleLevelFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.jobRoleLevelId) params.append("JobRoleLevelId", filter.jobRoleLevelId.toString());
      if (filter?.minYearsOfExp) params.append("MinYearsOfExp", filter.minYearsOfExp.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/talentjobrolelevel${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent job role levels" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talentjobrolelevel/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent job role level details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentJobRoleLevelCreate) {
    try {
      const response = await apiClient.post("/talentjobrolelevel", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent job role level" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<TalentJobRoleLevelCreate>) {
    try {
      const response = await apiClient.put(`/talentjobrolelevel/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent job role level" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/talentjobrolelevel/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent job role level" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
