// src/services/partnerService.ts
import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import { PartnerType, type Partner, type PartnerPayload, type PartnerContractModel, type PartnerTalentModel, type PartnerPaymentPeriodModel, type PartnerDetailedModel, type SuggestCodeResponse, type CheckCodeUniqueResponse } from "../types/partner.types";

export { PartnerType };
export type { Partner, PartnerPayload, PartnerContractModel, PartnerTalentModel, PartnerPaymentPeriodModel, PartnerDetailedModel, SuggestCodeResponse, CheckCodeUniqueResponse };

export const partnerService = {
  async getAll(filter?: { companyName?: string; taxCode?: string; contactPerson?: string }) {
    try {
      const params = new URLSearchParams();
      if (filter?.companyName) params.append("CompanyName", filter.companyName);
      if (filter?.taxCode) params.append("TaxCode", filter.taxCode);
      if (filter?.contactPerson) params.append("ContactPerson", filter.contactPerson);
      const url = `/partner${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch partners" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async create(payload: PartnerPayload) {
    try {
      const response = await apiClient.post(`/partner`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to create partner" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async update(id: number, payload: PartnerPayload) {
    try {
      const response = await apiClient.put(`/partner/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to update partner" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async deleteById(id: number) {
    try {
      const response = await apiClient.delete(`/partner/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to delete partner" };
      throw { message: "Unexpected error occurred" };
    }
  },

  async getDetailedById(id: number) {
    try {
      const response = await apiClient.get(`/partner/${id}/detailed`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Failed to fetch partner detailed information" };
      throw { message: "Unexpected error occurred" };
    }
  },

  /**
   * Suggest code from company name for Partner
   * @param name Company name
   * @returns Suggested code
   */
  async suggestCode(name: string): Promise<SuggestCodeResponse> {
    try {
      if (!name || !name.trim()) {
        throw { message: "Company name is required" };
      }
      const params = new URLSearchParams();
      params.append("name", name.trim());
      const response = await apiClient.get(`/partner/suggest-code?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to suggest code" };
      }
      throw error || { message: "Unexpected error occurred" };
    }
  },

  /**
   * Check if partner code is unique
   * @param code Code to check
   * @param excludeId Partner ID to exclude (for update)
   * @returns True if unique
   */
  async checkCodeUnique(code: string, excludeId?: number): Promise<CheckCodeUniqueResponse> {
    try {
      if (!code || !code.trim()) {
        throw { message: "Code is required" };
      }
      const params = new URLSearchParams();
      params.append("code", code.trim());
      if (excludeId !== undefined) {
        params.append("excludeId", excludeId.toString());
      }
      const response = await apiClient.get(`/partner/check-code-unique?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw errorData;
        }
        throw { message: "Failed to check code uniqueness" };
      }
      throw error || { message: "Unexpected error occurred" };
    }
  },
};
