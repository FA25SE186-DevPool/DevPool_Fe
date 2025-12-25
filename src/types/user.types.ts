export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  roles: string[];
  hasFaceId?: boolean; // FaceID enrollment status
}

export interface UserCreate {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password: string;
  role: string;
}

export interface UserUpdate {
  fullName: string;
  phoneNumber?: string;
}

export interface UserUpdateRole {
  role: string;
}

export interface UserRegister {
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  address?: string;
  role: string;
}

export interface UserFilter {
  name?: string;
  role?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  excludeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface UserChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// PagedResult đã được chuyển sang common.types.ts
export type { PagedResult } from './common.types';

