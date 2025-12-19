/**
 * Utility functions để quản lý token và user data
 * Luôn sử dụng localStorage cho token và user data
 */

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'devpool_user',
  REMEMBER_ME: 'remember_me',
  PASSWORD: 'user_password',
} as const;

/**
 * Lấy token từ localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Lấy refresh token từ localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Lưu token vào localStorage
 */
export const setTokens = (accessToken: string, refreshToken: string, rememberMe: boolean): void => {
  // Luôn lưu vào localStorage
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(TOKEN_KEYS.REMEMBER_ME, String(rememberMe));
  
  // Xóa tokens khỏi sessionStorage nếu có (để tránh conflict)
  sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Lưu user data vào localStorage
 */
export const setUser = (userData: any, rememberMe: boolean): void => {
  // Luôn lưu vào localStorage
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
  localStorage.setItem(TOKEN_KEYS.REMEMBER_ME, String(rememberMe));
  
  // Xóa user data khỏi sessionStorage nếu có (để tránh conflict)
  sessionStorage.removeItem(TOKEN_KEYS.USER);
};

/**
 * Lấy user data từ localStorage
 */
export const getUser = (): any | null => {
  const localUser = localStorage.getItem(TOKEN_KEYS.USER);
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {
      return null;
    }
  }
  
  return null;
};

/**
 * Xóa tất cả tokens và user data
 */
export const clearAuthData = (): void => {
  // Xóa từ localStorage
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(TOKEN_KEYS.REMEMBER_ME);
  localStorage.removeItem(TOKEN_KEYS.PASSWORD);

  // Xóa từ sessionStorage để đảm bảo (nếu có)
  sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.USER);
};

/**
 * Kiểm tra xem có đang dùng remember me không
 */
export const isRememberMe = (): boolean => {
  return localStorage.getItem(TOKEN_KEYS.REMEMBER_ME) === 'true';
};

/**
 * Lưu password vào localStorage
 */
export const setPassword = (password: string): void => {
  localStorage.setItem(TOKEN_KEYS.PASSWORD, password);
};

/**
 * Lấy password từ localStorage
 */
export const getPassword = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.PASSWORD);
};

