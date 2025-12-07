import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { JobSkill, JobSkillPayload, JobSkillFilter } from "../types/jobskill.types";

export type { JobSkill, JobSkillPayload, JobSkillFilter };

export const jobSkillService = {
  async getAll(filter?: JobSkillFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.jobRequestId)
        params.append("JobRequestId", filter.jobRequestId.toString());
      if (filter?.skillsId)
        params.append("SkillsId", filter.skillsId.toString());
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/jobskill${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw (
          error.response?.data || { message: "Không thể tải danh sách JobSkill" }
        );
      throw { message: "Lỗi không xác định khi tải dữ liệu JobSkill" };
    }
  },

  async getById(id: number) {
    try {
      const response = await axios.get(`/jobskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw (
          error.response?.data || { message: "Không thể tải dữ liệu JobSkill" }
        );
      throw { message: "Lỗi không xác định khi tải JobSkill" };
    }
  },

  async create(payload: JobSkillPayload) {
    try {
      const response = await axios.post("/jobskill", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw (
          error.response?.data || { message: "Không thể tạo JobSkill mới" }
        );
      throw { message: "Lỗi không xác định khi tạo JobSkill" };
    }
  },

  async update(id: number, payload: Partial<JobSkillPayload>) {
    try {
      const response = await axios.put(`/jobskill/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw (
          error.response?.data || { message: "Không thể cập nhật JobSkill" }
        );
      throw { message: "Lỗi không xác định khi cập nhật JobSkill" };
    }
  },

  async delete(id: number) {
    try {
      const response = await axios.delete(`/jobskill/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw (
          error.response?.data || { message: "Không thể xóa JobSkill" }
        );
      throw { message: "Lỗi không xác định khi xóa JobSkill" };
    }
  },
};
