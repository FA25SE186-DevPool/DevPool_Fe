import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { TalentSkill, TalentSkillFilter, TalentSkillCreate } from "../types/talentskill.types";

export type { TalentSkill, TalentSkillFilter, TalentSkillCreate };

export const talentSkillService = {
  async getAll(filter?: TalentSkillFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.skillId) params.append("SkillId", filter.skillId.toString());
      if (filter?.level) params.append("Level", filter.level);
      if (filter?.minYearsExp) params.append("MinYearsExp", filter.minYearsExp.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/talentskill${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent skills" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talentskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent skill details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentSkillCreate) {
    try {
      const response = await apiClient.post("/talentskill", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent skill" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<TalentSkillCreate>) {
    try {
      const response = await apiClient.put(`/talentskill/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent skill" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/talentskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent skill" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
