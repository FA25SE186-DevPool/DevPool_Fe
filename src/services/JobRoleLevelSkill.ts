import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { JobRoleLevelSkill, JobRoleLevelSkillFilter, JobRoleLevelSkillCreate } from "../types/jobrolelevelskill.types";

export type { JobRoleLevelSkill, JobRoleLevelSkillFilter, JobRoleLevelSkillCreate };

export const jobRoleLevelSkillService = {
  async getAll(filter?: JobRoleLevelSkillFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.jobRoleLevelId) params.append("JobRoleLevelId", filter.jobRoleLevelId.toString());
      if (filter?.skillId) params.append("SkillId", filter.skillId.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/jobrolelevelskill${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch job role level skills" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/jobrolelevelskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch job role level skill details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: JobRoleLevelSkillCreate) {
    try {
      const response = await apiClient.post("/jobrolelevelskill", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new job role level skill" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<JobRoleLevelSkillCreate>) {
    try {
      const response = await apiClient.put(`/jobrolelevelskill/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update job role level skill" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/jobrolelevelskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete job role level skill" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
