import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { PartnerPaymentPeriod, PartnerPaymentPeriodCreate, PartnerPaymentPeriodFilter } from "../types/partnerpaymentperiod.types";

export type { PartnerPaymentPeriod, PartnerPaymentPeriodCreate, PartnerPaymentPeriodFilter };

export const partnerPaymentPeriodService = {
  // Lấy danh sách PartnerPaymentPeriod với filter
  async getAll(filter?: PartnerPaymentPeriodFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.partnerId)
        params.append("PartnerId", filter.partnerId.toString());
      if (filter?.periodMonth)
        params.append("PeriodMonth", filter.periodMonth.toString());
      if (filter?.periodYear)
        params.append("PeriodYear", filter.periodYear.toString());
      if (filter?.status)
        params.append("Status", filter.status);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/partnerpaymentperiod${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách kỳ thanh toán đối tác" };
      throw { message: "Lỗi không xác định khi tải danh sách kỳ thanh toán đối tác" };
    }
  },

  // Lấy PartnerPaymentPeriod theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/partnerpaymentperiod/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin kỳ thanh toán đối tác" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới PartnerPaymentPeriod
  async create(payload: PartnerPaymentPeriodCreate) {
    try {
      const response = await apiClient.post("/partnerpaymentperiod", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo kỳ thanh toán đối tác" };
      throw { message: "Lỗi không xác định khi tạo kỳ thanh toán đối tác" };
    }
  },

  // Cập nhật PartnerPaymentPeriod
  async update(id: number, payload: Partial<PartnerPaymentPeriodCreate>) {
    try {
      const response = await apiClient.put(`/partnerpaymentperiod/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật kỳ thanh toán đối tác" };
      throw { message: "Lỗi không xác định khi cập nhật kỳ thanh toán đối tác" };
    }
  },
};

