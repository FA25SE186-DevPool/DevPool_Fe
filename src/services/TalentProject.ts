import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { TalentProject, TalentProjectFilter, TalentProjectCreate } from "../types/talentproject.types";

export type { TalentProject, TalentProjectFilter, TalentProjectCreate };

export const talentProjectService = {
  async getAll(filter?: TalentProjectFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.talentCVId) params.append("TalentCVId", filter.talentCVId.toString());
      if (filter?.projectName) params.append("ProjectName", filter.projectName);
      if (filter?.position) params.append("Position", filter.position);
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/talentproject${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent projects" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await axios.get(`/talentproject/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent project details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentProjectCreate) {
    try {
      const response = await axios.post("/talentproject", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent project" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<TalentProjectCreate>) {
    try {
      const response = await axios.put(`/talentproject/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent project" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await axios.delete(`/talentproject/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent project" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
