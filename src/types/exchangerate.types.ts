/**
 * Exchange Rate Types
 * Types cho API lấy tỷ giá tiền tệ từ Vietcombank
 */

export type CurrencyCode = 
  | "AUD"
  | "CAD"
  | "CHF"
  | "CNY"
  | "DKK"
  | "EUR"
  | "GBP"
  | "HKD"
  | "INR"
  | "JPY"
  | "KRW"
  | "KWD"
  | "MYR"
  | "NOK"
  | "RUB"
  | "SAR"
  | "SEK"
  | "SGD"
  | "THB"
  | "USD";

export interface ExchangeRateData {
  currencyCode: CurrencyCode;
  buyRate: number;
  sellRate: number;
  transferRate: number;
  date: string;
  source: string;
  note: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  message: string;
  data: ExchangeRateData;
  warning?: string;
}

export const AVAILABLE_CURRENCIES: CurrencyCode[] = [
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "INR",
  "JPY",
  "KRW",
  "KWD",
  "MYR",
  "NOK",
  "RUB",
  "SAR",
  "SEK",
  "SGD",
  "THB",
  "USD"
];

