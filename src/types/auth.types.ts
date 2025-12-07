// Role từ backend (số)
// Lưu ý: Backend vẫn trả về HR (chưa đổi), nhưng frontend hiển thị là TA
export const BackendRole = {
  Admin: 1,
  Manager: 2,
  HR: 3, // Backend vẫn trả về HR (chưa đổi), frontend sẽ map thành Staff TA
  Accountant: 4,
  Sale: 5,
  Dev: 6,
} as const;

export type BackendRole = typeof BackendRole[keyof typeof BackendRole];

// Role type cho frontend
export type FrontendRole =
  | "Admin"
  | "Manager"
  | "Staff TA"
  | "Staff Accountant"
  | "Staff Sales"
  | "Developer";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string | null;
  address?: string | null;
  phoneNumber: string;
  role: string; // ví dụ: "TA", "Admin", ...
}

// Payload cho Admin Provision User (backend tự generate password)
export interface UserProvisionPayload {
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  role: string; // ví dụ: "TA", "Manager", "Sale", "Accountant" - sẽ được parse thành enum Role ở backend
}

export interface UserProvisionResponse {
  message: string;
  email: string;
  password: string; // Password được generate tự động bởi backend
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userID: string;
  fullName: string;
  email: string;
  firebaseCustomToken?: string; // Firebase custom token từ backend (nếu có)
}

export interface JwtPayload {
  jti: string;
  iat: number;
  exp: number;
  nameid: string;
  email: string;
  role?: string | string[];
  [key: string]: any;
}

