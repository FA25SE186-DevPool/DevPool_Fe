import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { TalentSkillGroupAssessment, TalentSkillGroupAssessmentFilter, VerifiedSkillUpdate, TalentSkillGroupAssessmentCreate, SkillGroupVerificationStatus } from "../types/talentskillgroupassessment.types";

export type { TalentSkillGroupAssessment, TalentSkillGroupAssessmentFilter, VerifiedSkillUpdate, TalentSkillGroupAssessmentCreate, SkillGroupVerificationStatus };

export const talentSkillGroupAssessmentService = {
  // GET api/TalentSkillGroupAssessment
  async getAll(filter?: TalentSkillGroupAssessmentFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.skillGroupId) params.append("SkillGroupId", filter.skillGroupId.toString());
      if (filter?.expertId) params.append("ExpertId", filter.expertId.toString());
      if (filter?.isVerified !== undefined) params.append("IsVerified", filter.isVerified.toString());
      if (filter?.isActive !== undefined) params.append("IsActive", filter.isActive.toString());
      if (filter?.assessmentDateFrom) params.append("AssessmentDateFrom", filter.assessmentDateFrom);
      if (filter?.assessmentDateTo) params.append("AssessmentDateTo", filter.assessmentDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted.toString());

      const url = `/TalentSkillGroupAssessment${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data as TalentSkillGroupAssessment[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent skill group assessments" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // GET api/TalentSkillGroupAssessment/{id}
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/TalentSkillGroupAssessment/${id}`);
      return response.data as TalentSkillGroupAssessment;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch assessment details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // GET api/TalentSkillGroupAssessment/latest?talentId=&skillGroupId=
  async getLatest(talentId: number, skillGroupId: number) {
    try {
      const response = await apiClient.get(
        `/TalentSkillGroupAssessment/latest?talentId=${talentId}&skillGroupId=${skillGroupId}`
      );
      return response.data as TalentSkillGroupAssessment;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch latest assessment" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // POST api/TalentSkillGroupAssessment/verify
  async verifySkillGroup(payload: TalentSkillGroupAssessmentCreate) {
    try {
      const response = await apiClient.post("/TalentSkillGroupAssessment/verify", payload);
      return response.data as TalentSkillGroupAssessment;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to verify skill group" };
      throw { message: "Unexpected error occurred during verification" };
    }
  },

  // GET api/TalentSkillGroupAssessment/status?talentId=&skillGroupId=
  async getVerificationStatus(talentId: number, skillGroupId: number) {
    try {
      const response = await apiClient.get(
        `/TalentSkillGroupAssessment/status?talentId=${talentId}&skillGroupId=${skillGroupId}`
      );
      return response.data as SkillGroupVerificationStatus;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch verification status" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // POST api/TalentSkillGroupAssessment/statuses?talentId=
  async getVerificationStatuses(talentId: number, skillGroupIds: number[]) {
    try {
      const response = await apiClient.post(
        `/TalentSkillGroupAssessment/statuses?talentId=${talentId}`,
        skillGroupIds
      );
      return response.data as SkillGroupVerificationStatus[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch verification statuses" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // POST api/TalentSkillGroupAssessment/invalidate?talentId=&skillGroupId=&reason=
  async invalidateAssessment(talentId: number, skillGroupId: number, reason?: string) {
    try {
      const params = new URLSearchParams();
      params.append("talentId", talentId.toString());
      params.append("skillGroupId", skillGroupId.toString());
      if (reason) params.append("reason", reason);

      const response = await apiClient.post(
        `/TalentSkillGroupAssessment/invalidate?${params.toString()}`
      );
      return response.data as { message: string; success: boolean };
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to invalidate assessment" };
      throw { message: "Unexpected error occurred" };
    }
  },

  // GET api/TalentSkillGroupAssessment/history?talentId=&skillGroupId=
  async getAssessmentHistory(talentId: number, skillGroupId: number) {
    try {
      const response = await apiClient.get(
        `/TalentSkillGroupAssessment/history?talentId=${talentId}&skillGroupId=${skillGroupId}`
      );
      return response.data as TalentSkillGroupAssessment[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch assessment history" };
      throw { message: "Unexpected error occurred" };
    }
  },
};


