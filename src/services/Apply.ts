import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { Apply, ApplyCreate, ApplyStatusUpdate, ApplyFilter } from "../types/apply.types";

export type { Apply, ApplyCreate, ApplyStatusUpdate, ApplyFilter };

export const applyService = {
  async getAll(filter?: ApplyFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.jobRequestId) params.append("JobRequestId", filter.jobRequestId.toString());
      if (filter?.cvId) params.append("CvId", filter.cvId.toString());
      if (filter?.status) params.append("Status", filter.status);

      const url = `/apply${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);

      return response.data as Apply[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot fetch apply list" };
      throw { message: "Unknown error while fetching applies" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/apply/${id}`);
      return response.data as Apply;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot fetch apply details" };
      throw { message: "Unknown error while fetching apply details" };
    }
  },

  async create(payload: ApplyCreate) {
    try {
      const response = await apiClient.post("/apply", payload);
      return response.data as Apply;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot create apply" };
      throw { message: "Unknown error while creating apply" };
    }
  },

  async update(id: number, payload: Partial<ApplyCreate> & { status?: string }) {
    try {
      const response = await apiClient.put(`/apply/${id}`, payload);
      return response.data as Apply;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot update apply" };
      throw { message: "Unknown error while updating apply" };
    }
  },

  async updateStatus(id: number, payload: ApplyStatusUpdate) {
    try {
      const response = await apiClient.patch(`/apply/${id}/status`, payload);
      return response.data as Apply;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot update apply status" };
      throw { message: "Unknown error while updating apply status" };
    }
  },

  async delete(id: number) {
    try {
      const response = await apiClient.delete(`/apply/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Cannot delete apply" };
      throw { message: "Unknown error while deleting apply" };
    }
  },
};
