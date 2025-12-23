import type { Project } from "./project.types";
import type { ClientJobRoleLevel } from "./clientjobrolelevel.types";

export interface ClientCompany {
  id: number;
  code: string;
  name: string;
  taxCode?: string;
  contactPerson: string;
  position?: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
}

export interface ClientCompanyDetailedModel {
  id: number;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  position?: string | null;
  taxCode?: string | null;
  createdAt: string;
  updatedAt: string;
  // Related Collections
  projects: Project[];
  // assignedCVTemplates: ClientCompanyTemplate[]; // Removed - CV Templates deleted
  jobRoleLevels: ClientJobRoleLevel[];
}

export interface ClientCompanyPayload {
  code: string;
  name: string;
  taxCode?: string;
  contactPerson: string;
  position?: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ClientCompanyFilter {
  name?: string;
  email?: string;
  contactPerson?: string;
  excludeDeleted?: boolean;
  /**
   * Page number (1-based)
   */
  pageNumber?: number;
  /**
   * Number of items per page
   */
  pageSize?: number;
}

