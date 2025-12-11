import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type { CurrencyCode, ExchangeRateResponse } from "../types/exchangerate.types";

export type { CurrencyCode, ExchangeRateResponse } from "../types/exchangerate.types";
export { AVAILABLE_CURRENCIES } from "../types/exchangerate.types";

export const exchangeRateService = {
  /**
   * Lấy tỷ giá tiền tệ từ Vietcombank
   * @param currencyCode - Mã tiền tệ (AUD, CAD, CHF, CNY, DKK, EUR, GBP, HKD, INR, JPY, KRW, KWD, MYR, NOK, RUB, SAR, SEK, SGD, THB, USD)
   * @returns ExchangeRateResponse - Thông tin tỷ giá từ Vietcombank
   */
  async getVietcombankRate(currencyCode: CurrencyCode): Promise<ExchangeRateResponse> {
    try {
      const response = await apiClient.get(`/exchangerate/vietcombank/${currencyCode}`);
      return response.data as ExchangeRateResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || { message: `Không thể lấy tỷ giá ${currencyCode} từ Vietcombank` };
      }
      throw { message: "Lỗi không xác định khi lấy tỷ giá" };
    }
  },
};

