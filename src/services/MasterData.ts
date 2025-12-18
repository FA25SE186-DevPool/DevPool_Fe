import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { Skill } from "../types/skill.types";

export interface MasterDataResponse<T> {
  success: boolean;
  message?: string;
  jobRoleLevelId?: number;
  data: T;
}

export interface SkillCanDeleteResponse {
  success: boolean;
  skillId: number;
  canDelete: boolean;
  isInUse: boolean;
  usageDetails?: string;
  message?: string;
}

export const masterDataService = {
  /**
   * Lấy danh sách skill template theo JobRoleLevelId (backend: GET /api/master-data/skills-by-level/{jobRoleLevelId})
   */
  async getSkillsByJobRoleLevel(jobRoleLevelId: number) {
    try {
      const response = await apiClient.get<MasterDataResponse<Skill[]>>(
        `/master-data/skills-by-level/${jobRoleLevelId}`
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tải kỹ năng theo vị trí" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Kiểm tra Skill có thể xóa hay không (backend: GET /api/master-data/skills/{skillId}/can-delete)
   */
  async checkSkillCanDelete(skillId: number) {
    try {
      const response = await apiClient.get<SkillCanDeleteResponse>(`/master-data/skills/${skillId}/can-delete`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể kiểm tra skill có thể xóa hay không" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },
};


