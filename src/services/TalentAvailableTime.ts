import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { TalentAvailableTime, TalentAvailableTimeFilter, TalentAvailableTimeCreate } from "../types/talentavailabletime.types";

export type { TalentAvailableTime, TalentAvailableTimeFilter, TalentAvailableTimeCreate };

export const talentAvailableTimeService = {
  async getAll(filter?: TalentAvailableTimeFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.startTimeFrom) params.append("StartTimeFrom", filter.startTimeFrom);
      if (filter?.startTimeTo) params.append("StartTimeTo", filter.startTimeTo);
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      const url = `/talentavailabletime${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent available times" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await axios.get(`/talentavailabletime/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent available time details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentAvailableTimeCreate) {
    try {
      const response = await axios.post("/talentavailabletime", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent available time" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<TalentAvailableTimeCreate>) {
    try {
      const response = await axios.put(`/talentavailabletime/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent available time" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await axios.delete(`/talentavailabletime/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent available time" };
      throw { message: "Unexpected error occurred" };
    }
  },
};
