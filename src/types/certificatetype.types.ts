export interface CertificateType {
  id: number;
  name: string;
  skillGroupId?: number;
}

export interface CertificateTypeFilter {
  name?: string;
  skillGroupId?: number;
  excludeDeleted?: boolean;
}

export interface CertificateTypeCreate {
  name: string;
  skillGroupId?: number;
}

