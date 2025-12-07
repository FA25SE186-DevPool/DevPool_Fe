import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { ClientCompanyTemplate, ClientCompanyTemplateFilter } from "../types/clientcompanytemplate.types";

export type { ClientCompanyTemplate, ClientCompanyTemplateFilter };

export const clientCompanyCVTemplateService = {
  // Lấy danh sách template được gán cho client
  async listAssignedTemplates(clientCompanyId: number): Promise<ClientCompanyTemplate[]> {
    try {
      const response = await axios.get(`/client-companies/${clientCompanyId}/templates/assigned`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tải danh sách template của khách hàng" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu template khách hàng" };
    }
  },

  // Lấy template hiệu lực (assigned hoặc default fallback)
  async listEffectiveTemplates(clientCompanyId: number): Promise<ClientCompanyTemplate[]> {
    try {
      const response = await axios.get(`/client-companies/${clientCompanyId}/templates/effective`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể tải template hiệu lực của khách hàng" };
      }
      throw { message: "Lỗi không xác định khi tải dữ liệu template hiệu lực" };
    }
  },

  // Gán template cho client
  async assignTemplate(clientCompanyId: number, templateId: number): Promise<boolean> {
    try {
      const response = await axios.post(`/client-companies/${clientCompanyId}/templates/${templateId}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể gán template cho khách hàng" };
      }
      throw { message: "Lỗi không xác định khi gán template" };
    }
  },

  // Xóa template khỏi client (soft delete)
  async removeTemplate(clientCompanyId: number, templateId: number): Promise<boolean> {
    try {
      const response = await axios.delete(`/client-companies/${clientCompanyId}/templates/${templateId}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: "Không thể xóa template của khách hàng" };
      }
      throw { message: "Lỗi không xác định khi xóa template" };
    }
  },
};
