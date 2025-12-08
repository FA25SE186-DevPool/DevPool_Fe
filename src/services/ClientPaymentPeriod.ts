import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { ClientPaymentPeriod, ClientPaymentPeriodCreate, ClientPaymentPeriodFilter } from "../types/clientpaymentperiod.types";

export type { ClientPaymentPeriod, ClientPaymentPeriodCreate, ClientPaymentPeriodFilter };

export const clientPaymentPeriodService = {
  // Lấy danh sách ClientPaymentPeriod với filter
  async getAll(filter?: ClientPaymentPeriodFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.clientCompanyId)
        params.append("ClientCompanyId", filter.clientCompanyId.toString());
      if (filter?.periodMonth)
        params.append("PeriodMonth", filter.periodMonth.toString());
      if (filter?.periodYear)
        params.append("PeriodYear", filter.periodYear.toString());
      if (filter?.status)
        params.append("Status", filter.status);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/clientpaymentperiod${params.toString() ? `?${params}` : ""}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách kỳ thanh toán khách hàng" };
      throw { message: "Lỗi không xác định khi tải danh sách kỳ thanh toán khách hàng" };
    }
  },

  // Lấy ClientPaymentPeriod theo id
  async getById(id: number) {
    try {
      const response = await apiClient.get(`/clientpaymentperiod/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin kỳ thanh toán khách hàng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  // Tạo mới ClientPaymentPeriod
  async create(payload: ClientPaymentPeriodCreate) {
    try {
      const response = await apiClient.post("/clientpaymentperiod", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo kỳ thanh toán khách hàng" };
      throw { message: "Lỗi không xác định khi tạo kỳ thanh toán khách hàng" };
    }
  },

  // Cập nhật ClientPaymentPeriod
  async update(id: number, payload: Partial<ClientPaymentPeriodCreate>) {
    try {
      const response = await apiClient.put(`/clientpaymentperiod/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật kỳ thanh toán khách hàng" };
      throw { message: "Lỗi không xác định khi cập nhật kỳ thanh toán khách hàng" };
    }
  },
};

