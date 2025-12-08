import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { AuditLogModel, AuditLogFilterModel, PaginatedAuditLogResponse, AuditLogHistoryResponse } from "../types/auditlog.types";

export type { AuditLogModel, AuditLogFilterModel, PaginatedAuditLogResponse, AuditLogHistoryResponse };

export const auditLogService = {
  async getAll(filter?: AuditLogFilterModel): Promise<PaginatedAuditLogResponse> {
    try {
      const params = new URLSearchParams();

      if (filter?.entityName) params.append("EntityName", filter.entityName);
      if (filter?.entityId !== undefined) params.append("EntityId", filter.entityId.toString());
      if (filter?.action) params.append("Action", filter.action);
      if (filter?.changedBy) params.append("ChangedBy", filter.changedBy);
      if (filter?.changedAtFrom) params.append("ChangedAtFrom", filter.changedAtFrom);
      if (filter?.changedAtTo) params.append("ChangedAtTo", filter.changedAtTo);
      if (filter?.fieldName) params.append("FieldName", filter.fieldName);
      if (filter?.metaDataSearch) params.append("MetaDataSearch", filter.metaDataSearch);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted.toString());
      if (filter?.pageNumber !== undefined) params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize !== undefined) params.append("PageSize", filter.pageSize.toString());

      const url = `/auditlog${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách audit log" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Get audit history for a specific entity
   * @param entityName Entity name (e.g., "JobRequest", "TalentApplication")
   * @param entityId ID of the entity
   */
  async getEntityHistory(
    entityName: string,
    entityId: number
  ): Promise<AuditLogHistoryResponse> {
    try {
      const response = await apiClient.get(`/auditlog/${entityName}/${entityId}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải lịch sử audit log" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Get audit history for a specific TalentApplication
   * @param applicationId ID of the TalentApplication
   */
  async getTalentApplicationHistory(applicationId: number): Promise<AuditLogHistoryResponse> {
    try {
      const response = await apiClient.get(`/auditlog/TalentApplication/${applicationId}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải lịch sử TalentApplication" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  /**
   * Get audit history for a specific JobRequest
   * @param jobRequestId ID of the JobRequest
   */
  async getJobRequestHistory(jobRequestId: number): Promise<AuditLogHistoryResponse> {
    try {
      const response = await apiClient.get(`/auditlog/JobRequest/${jobRequestId}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải lịch sử JobRequest" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },
};

