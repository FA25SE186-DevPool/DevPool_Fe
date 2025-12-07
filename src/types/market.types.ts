//  Market
export interface Market {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface MarketPayload {
  name: string;
  code: string;
  description?: string;
}

export interface MarketFilter {
  name?: string;
  excludeDeleted?: boolean;
}

