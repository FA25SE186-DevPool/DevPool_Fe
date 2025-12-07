export const PartnerType = {
  OwnCompany: 1,
  Partner: 2,
  Individual: 3,
} as const;

export type PartnerType = typeof PartnerType[keyof typeof PartnerType];

export interface Partner {
  id: number;
  code: string;
  partnerType: PartnerType;
  companyName: string;
  taxCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PartnerPayload {
  code: string;
  partnerType: PartnerType;
  companyName: string;
  taxCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PartnerContractModel {
  id: number;
  partnerId: number;
  talentId: number;
  devRate?: number | null;
  rateType: string;
  contractNumber: string;
  status: string;
  startDate: string; // DateTime as ISO string
  endDate?: string | null; // DateTime as ISO string
  contractFileUrl?: string | null;
}

export interface PartnerTalentModel {
  id: number;
  partnerId: number;
  talentId: number;
  startDate: string; // DateTime as ISO string
  endDate?: string | null; // DateTime as ISO string
  status?: string | null;
  notes?: string | null;
}

export interface PartnerPaymentPeriodModel {
  id: number;
  partnerId: number;
  periodMonth: number;
  periodYear: number;
  status: string;
}

export interface PartnerDetailedModel {
  id: number;
  code: string;
  partnerType: PartnerType;
  companyName: string;
  taxCode?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string; // DateTime as ISO string
  updatedAt: string; // DateTime as ISO string
  contracts: PartnerContractModel[];
  talents: PartnerTalentModel[];
  paymentPeriods: PartnerPaymentPeriodModel[];
}

export interface SuggestCodeResponse {
  success: boolean;
  suggestedCode?: string;
  message?: string;
}

export interface CheckCodeUniqueResponse {
  success: boolean;
  isUnique?: boolean;
  message?: string;
}

