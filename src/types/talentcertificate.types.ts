export interface TalentCertificate {
  id: number;
  talentId: number;
  certificateTypeId: number;
  certificateName: string;
  certificateDescription?: string;
  issuedDate?: string; // DateTime as ISO string
  isVerified: boolean;
  imageUrl: string;
}

export interface TalentCertificateFilter {
  talentId?: number;
  certificateTypeId?: number;
  isVerified?: boolean;
  excludeDeleted?: boolean;
}

export interface TalentCertificateCreate {
  talentId: number;
  certificateTypeId: number;
  certificateName: string;
  certificateDescription?: string;
  issuedDate?: string; // DateTime as ISO string
  isVerified: boolean;
  imageUrl: string;
}

