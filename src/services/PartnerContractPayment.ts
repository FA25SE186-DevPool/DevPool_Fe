import axios from "../configs/axios";
import { AxiosError } from "axios";
import type {
  PartnerContractPaymentModel,
  PartnerContractPaymentCreateModel,
  PartnerContractPaymentFilter,
  PartnerContractPaymentCalculateModel,
  PartnerContractPaymentMarkAsPaidModel,
  PartnerContractPaymentVerifyModel,
  PartnerContractPaymentApproveModel,
  PartnerContractPaymentRejectModel
} from "../types/partnercontractpayment.types";

export type {
  PartnerContractPaymentModel,
  PartnerContractPaymentCreateModel,
  PartnerContractPaymentFilter,
  PartnerContractPaymentCalculateModel,
  PartnerContractPaymentMarkAsPaidModel,
  PartnerContractPaymentVerifyModel,
  PartnerContractPaymentApproveModel,
  PartnerContractPaymentRejectModel
};

export const partnerContractPaymentService = {
  // Lấy danh sách PartnerContractPayment với filter
  async getAll(filter?: PartnerContractPaymentFilter) {
    try {
      const params = new URLSearchParams();

      if (filter?.projectPeriodId)
        params.append("ProjectPeriodId", filter.projectPeriodId.toString());
      if (filter?.talentAssignmentId)
        params.append("TalentAssignmentId", filter.talentAssignmentId.toString());
      if (filter?.talentId)
        params.append("TalentId", filter.talentId.toString());
      if (filter?.contractStatus)
        params.append("ContractStatus", filter.contractStatus);
      if (filter?.paymentStatus)
        params.append("PaymentStatus", filter.paymentStatus);
      if (filter?.paymentDateFrom)
        params.append("PaymentDateFrom", filter.paymentDateFrom);
      if (filter?.paymentDateTo)
        params.append("PaymentDateTo", filter.paymentDateTo);
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");

      const url = `/partnercontractpayment${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data as PartnerContractPaymentModel[];
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách thanh toán hợp đồng đối tác" };
      throw { message: "Lỗi không xác định khi tải danh sách thanh toán hợp đồng đối tác" };
    }
  },

  // Lấy PartnerContractPayment theo id
  async getById(id: number) {
    try {
      const response = await axios.get(`/partnercontractpayment/${id}`);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin thanh toán hợp đồng đối tác" };
      throw { message: "Lỗi không xác định khi tải thông tin thanh toán hợp đồng đối tác" };
    }
  },

  // Tạo mới PartnerContractPayment
  async create(payload: PartnerContractPaymentCreateModel) {
    try {
      const response = await axios.post("/partnercontractpayment", payload);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo thanh toán hợp đồng đối tác" };
      throw { message: "Lỗi không xác định khi tạo thanh toán hợp đồng đối tác" };
    }
  },

  // Cập nhật PartnerContractPayment
  async update(id: number, payload: Partial<PartnerContractPaymentCreateModel>) {
    try {
      const response = await axios.put(`/partnercontractpayment/${id}`, payload);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật thanh toán hợp đồng đối tác" };
      throw { message: "Lỗi không xác định khi cập nhật thanh toán hợp đồng đối tác" };
    }
  },

  // Verify contract - Xác minh hợp đồng
  async verifyContract(id: number, payload?: PartnerContractPaymentVerifyModel) {
    try {
      const response = await axios.post(`/partnercontractpayment/${id}/verify-contract`, payload || {});
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xác minh hợp đồng" };
      throw { message: "Lỗi không xác định khi xác minh hợp đồng" };
    }
  },

  // Approve contract - Phê duyệt hợp đồng
  async approveContract(id: number, payload?: PartnerContractPaymentApproveModel) {
    try {
      const response = await axios.post(`/partnercontractpayment/${id}/approve-contract`, payload || {});
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể phê duyệt hợp đồng" };
      throw { message: "Lỗi không xác định khi phê duyệt hợp đồng" };
    }
  },

  // Reject contract - Từ chối hợp đồng
  async rejectContract(id: number, payload: PartnerContractPaymentRejectModel) {
    try {
      const response = await axios.post(`/partnercontractpayment/${id}/reject-contract`, payload);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể từ chối hợp đồng" };
      throw { message: "Lỗi không xác định khi từ chối hợp đồng" };
    }
  },

  // Start billing - Bắt đầu thanh toán
  async startBilling(id: number, payload: PartnerContractPaymentCalculateModel) {
    try {
      const response = await axios.post(`/partnercontractpayment/${id}/start-billing`, payload);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể bắt đầu thanh toán" };
      throw { message: "Lỗi không xác định khi bắt đầu thanh toán" };
    }
  },

  // Mark as paid - Đánh dấu đã thanh toán
  async markAsPaid(id: number, payload: PartnerContractPaymentMarkAsPaidModel) {
    try {
      const response = await axios.post(`/partnercontractpayment/${id}/mark-as-paid`, payload);
      return response.data as PartnerContractPaymentModel;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể đánh dấu đã thanh toán" };
      throw { message: "Lỗi không xác định khi đánh dấu đã thanh toán" };
    }
  },
};
