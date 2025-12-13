import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type {
  TalentCV,
  TalentCVFilter,
  TalentCVCreate,
  TalentCVMatchResult,
  TalentCVJobRequestFilter,
  TalentCVExtractResponse,
  BasicInfoData,
  BasicInfoComparison,
  SkillComparisonItem,
  SkillMatchResult,
  ExtractedSkill,
  SkillsComparison,
  ExistingWorkExperienceData,
  ExtractedWorkExperience,
  WorkExperienceDuplicateCheck,
  WorkExperiencesComparison,
  ExistingProjectData,
  ExtractedProject,
  ProjectDuplicateCheck,
  ProjectsComparison,
  ExistingCertificateData,
  ExtractedCertificate,
  CertificatesComparison,
  JobRoleLevelComparisonItem,
  ExtractedJobRoleLevel,
  JobRoleLevelsComparison,
  BasicInfoUpdateDecision,
  SkillsUpdateDecision,
  WorkExperienceActionType,
  WorkExperienceUpdateAction,
  WorkExperiencesUpdateDecision,
  ProjectActionType,
  ProjectUpdateAction,
  ProjectsUpdateDecision,
  CertificateActionType,
  CertificateUpdateAction,
  CertificatesUpdateDecision,
  JobRoleLevelActionType,
  JobRoleLevelUpdateAction,
  JobRoleLevelsUpdateDecision,
  ApplyCVUpdatesRequest,
  UpdateStatistics,
  ApplyCVUpdatesResponse,
  CVAnalysisComparisonResponse,
  TalentCVExtractRequest,
  TalentCVToggleActiveModel,
  TalentCVFieldsUpdateModel
} from "../types/talentcv.types";

export type {
  TalentCV,
  TalentCVFilter,
  TalentCVCreate,
  TalentCVMatchResult,
  TalentCVJobRequestFilter,
  TalentCVExtractResponse,
  BasicInfoData,
  BasicInfoComparison,
  SkillComparisonItem,
  SkillMatchResult,
  ExtractedSkill,
  SkillsComparison,
  ExistingWorkExperienceData,
  ExtractedWorkExperience,
  WorkExperienceDuplicateCheck,
  WorkExperiencesComparison,
  ExistingProjectData,
  ExtractedProject,
  ProjectDuplicateCheck,
  ProjectsComparison,
  ExistingCertificateData,
  ExtractedCertificate,
  CertificatesComparison,
  JobRoleLevelComparisonItem,
  ExtractedJobRoleLevel,
  JobRoleLevelsComparison,
  BasicInfoUpdateDecision,
  SkillsUpdateDecision,
  WorkExperienceActionType,
  WorkExperienceUpdateAction,
  WorkExperiencesUpdateDecision,
  ProjectActionType,
  ProjectUpdateAction,
  ProjectsUpdateDecision,
  CertificateActionType,
  CertificateUpdateAction,
  CertificatesUpdateDecision,
  JobRoleLevelActionType,
  JobRoleLevelUpdateAction,
  JobRoleLevelsUpdateDecision,
  ApplyCVUpdatesRequest,
  UpdateStatistics,
  ApplyCVUpdatesResponse,
  CVAnalysisComparisonResponse,
  TalentCVExtractRequest,
  TalentCVToggleActiveModel,
  TalentCVFieldsUpdateModel
};

export const talentCVService = {
  async getAll(filter?: TalentCVFilter) {
    try {
      const params = new URLSearchParams();
      if (filter?.talentId) params.append("TalentId", filter.talentId.toString());
      if (filter?.jobRoleLevelId) params.append("JobRoleLevelId", filter.jobRoleLevelId.toString());
      if (filter?.isActive !== undefined) params.append("IsActive", filter.isActive.toString());
      if (filter?.isGeneratedFromTemplate !== undefined) params.append("IsGeneratedFromTemplate", filter.isGeneratedFromTemplate.toString());
      if (filter?.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      if (filter?.pageNumber !== undefined) params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize !== undefined) params.append("PageSize", filter.pageSize.toString());
      const url = `/talentcv${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent CVs" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get(`/talentcv/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch talent CV details" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: TalentCVCreate) {
    try {
      const response = await apiClient.post("/talentcv", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create new talent CV" };
      throw { message: "Unexpected error occurred during creation" };
    }
  },

  async update(id: number, payload: Partial<TalentCVCreate>) {
    try {
      const response = await apiClient.put(`/talentcv/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent CV" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/talentcv/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete talent CV" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async activate(id: number) {
    try {
      const response = await apiClient.patch(`/talentcv/${id}/activate`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to activate talent CV" };
      throw { message: "Unexpected error occurred during activation" };
    }
  },

  async deactivate(id: number) {
    try {
      const response = await apiClient.patch(`/talentcv/${id}/deactivate`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to deactivate talent CV" };
      throw { message: "Unexpected error occurred during deactivation" };
    }
  },

  async updateFields(id: number, payload: TalentCVFieldsUpdateModel) {
    try {
      const response = await apiClient.patch(`/talentcv/${id}/update-fields`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update talent CV fields" };
      throw { message: "Unexpected error occurred during field update" };
    }
  },

  async getMatchesForJobRequest(filter: TalentCVJobRequestFilter) {
    try {
      const params = new URLSearchParams();
      params.append("JobRequestId", filter.jobRequestId.toString());
      if (filter.excludeDeleted !== undefined) params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      if (filter.maxResults !== undefined) params.append("MaxResults", filter.maxResults.toString());
      const url = `/talentcv/filter-by-job-request${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch CV matches for job request" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async extractFromPDF(file: File) {
    try {
      const formData = new FormData();
      formData.append("filePDF", file);
      const response = await apiClient.post("/talentcv/extract-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to extract CV from PDF" };
      throw { message: "Unexpected error occurred during extraction" };
    }
  },

  async extractFromPDFWithOllama(file: File) {
    try {
      const formData = new FormData();
      formData.append("filePDF", file);
      const response = await apiClient.post("/talentcv/extract-pdf-ollama", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data as TalentCVExtractResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to extract CV from PDF with Ollama" };
      throw { message: "Unexpected error occurred during extraction with Ollama" };
    }
  },

  async analyzeCVForUpdate(talentId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append("CVFile", file);
      const response = await apiClient.post(`/talentcv/talents/${talentId}/analyze-cv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data as CVAnalysisComparisonResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to analyze CV for update" };
      throw { message: "Unexpected error occurred during CV analysis" };
    }
  },

  async applyCVUpdates(talentId: number, payload: ApplyCVUpdatesRequest) {
    try {
      const response = await apiClient.put(`/talentcv/talents/${talentId}/apply-cv-updates`, payload);
      return response.data as ApplyCVUpdatesResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to apply CV updates" };
      throw { message: "Unexpected error occurred while applying CV updates" };
    }
  },
};
