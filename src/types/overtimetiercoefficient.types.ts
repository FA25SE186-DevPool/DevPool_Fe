export interface OvertimeTierCoefficient {
  id: number;
  tierLevel: number;
  tierName: string;
  name: string;
  minHours: number;
  maxHours: number;
  coefficient: number;
  description: string;
  displayOrder: number;
  isActive: boolean;
  coefficientFrom: number;
  coefficientTo: number;
  rateMultiplier: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
  isDeleted: boolean;
}

export interface OvertimeTierCoefficientFilter {
  name?: string;
  isActive?: boolean;
  excludeDeleted?: boolean;
}

export interface OvertimeTierCoefficientConfig {
  tierName: string;
  name: string;
  description: string;
  coefficient: string;
}
