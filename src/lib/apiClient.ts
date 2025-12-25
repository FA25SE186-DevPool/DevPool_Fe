import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { UNAUTHORIZED_EVENT } from '../constants/events';
import { API_BASE_URL } from '../config/env.config';
import { isTokenExpired } from '../utils/storage';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
});

const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

// 🔎 Chuẩn hóa message lỗi trả về từ BE để hiển thị cho người dùng
const extractServerMessage = (data: unknown): string => {
    try {
        if (!data) return '';
        if (typeof data === 'string') return data;
        if (typeof data === 'object') {
            const obj = data as Record<string, unknown>;
            const candidates: string[] = [];
            const tryPush = (v: unknown) => {
                if (typeof v === 'string' && v.trim()) candidates.push(v.trim());
            };
            // Các field phổ biến từ BE
            tryPush(obj.error);
            tryPush(obj.message);
            tryPush((obj as any).objecterror);
            tryPush((obj as any).Objecterror);
            tryPush((obj as any).detail);
            tryPush((obj as any).title);
            // Thu thập thêm các string values khác (tránh đè lên candidates đã có)
            Object.values(obj).forEach((v) => tryPush(v));
            // Loại trùng và nối lại
            return Array.from(new Set(candidates)).join(' ').trim();
        }
        return '';
    } catch {
        return '';
    }
};

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token: string | null) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const handleRefreshToken = async (): Promise<string | null> => {
    // Luôn lấy refresh token từ localStorage
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
        // Không log warning vì đây là tình huống hợp lệ:
        // - User chưa login
        // - User đã logout (token đã bị xóa)
        // - Token đã hết hạn và bị xóa bởi interceptor khác
        return null;
    }

    try {
        const response = await refreshClient.post('/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data ?? {};

        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
        }

        // Backend có thể không trả về newRefreshToken nếu không rotate token
        // Nếu có newRefreshToken, cập nhật; nếu không, giữ nguyên token cũ
        if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
        }

        return accessToken ?? null;
    } catch (refreshError: any) {
        const errorMessage = refreshError?.response?.data?.message || refreshError?.message || 'Unknown error';
        console.error('❌ Unable to refresh token:', errorMessage);

        // Xử lý đặc biệt cho lỗi "Refresh token is revoked or does not match"
        // Đây thường xảy ra khi user login lại ở tab/device khác
        if (errorMessage.includes('revoked') || errorMessage.includes('does not match')) {
            console.warn('⚠️ Refresh token mismatch - user may have logged in elsewhere');
        }

        // Xóa từ localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('devpool_user');
        localStorage.removeItem('remember_me');
        // Xóa từ sessionStorage để đảm bảo (nếu có)
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('devpool_user');
        return null;
    }
};

// 🧩 Request interceptor: tự động thêm token vào header và check expiry
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('accessToken');
        if (token) {
            // Check if token is expired before sending request
            if (isTokenExpired(token)) {
                console.warn('🚨 Token expired, dispatching unauthorized event');
                // Clear expired token
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('devpool_user');
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('devpool_user');
                // Dispatch unauthorized event to trigger logout
                window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
                return Promise.reject(new Error('Token expired'));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ⚡ Response interceptor: xử lý lỗi & token hết hạn
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Kiểm tra error có tồn tại không
        if (!error) {
            console.error('⚠️ Unexpected error: error object is undefined');
            return Promise.reject(new Error('Đã xảy ra lỗi không xác định'));
        }
        
        const status = error.response?.status;
        // Gắn normalizedMessage để màn FE có thể đọc thống nhất
        const normalized = extractServerMessage(error.response?.data);
        (error as any).normalizedMessage = normalized || error.message;
        if (normalized && typeof error.message === 'string') {
            // Cập nhật luôn error.message để các nơi chỉ đọc message vẫn thấy nội dung từ BE
            error.message = normalized;
        }
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Skip refresh token logic cho logout endpoint - đây là hành động logout, không cần refresh
        const isLogoutRequest = originalRequest?.url?.includes('/auth/logout') ?? false;

        // Skip refresh token logic cho các auth endpoints - đây là authentication failed, không phải token expired
        const isAuthRequest = originalRequest?.url?.includes('/auth/') ?? false;

        if (status === 401 && originalRequest && !originalRequest._retry && !isLogoutRequest && !isAuthRequest) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                const newToken = await handleRefreshToken();
                isRefreshing = false;
                notifyRefreshSubscribers(newToken);

                if (!newToken) {
                    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
                    return Promise.reject(error);
                }
            }

            return new Promise((resolve, reject) => {
                addRefreshSubscriber((token) => {
                    if (!token) {
                        reject(error);
                        return;
                    }

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    } else {
                        originalRequest.headers = { Authorization: `Bearer ${token}` };
                    }

                    resolve(apiClient(originalRequest));
                });
            });
        }

        if (status === 401) {
            // Không log warning cho logout request vì đây là hành động hợp lệ
            if (!isLogoutRequest && !isAuthRequest) {
                console.warn('🔒 Token expired or unauthorized.');
            }
            // Chỉ xóa token và dispatch event nếu không phải auth request (login/register/forgot-password/etc.)
            if (!isAuthRequest) {
                // Xóa từ localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('devpool_user');
                // Xóa từ sessionStorage để đảm bảo (nếu có)
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('devpool_user');
                // Chỉ dispatch UNAUTHORIZED_EVENT nếu không phải logout request
                if (!isLogoutRequest) {
                    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
                }
            }
        } else if (status && status >= 400 && status < 500) {
            // Không log error cho logout request vì 401 là expected behavior
            // Không log error cho business logic errors (409 Conflict) vì sẽ được handle ở tầng trên
            if (!isLogoutRequest && status !== 409) {
                console.error('⚠️ Client Error:', error.response?.data || error.message);
            }
            // Hiển thị cảnh báo thân thiện cho một số lỗi phổ biến
            const lower = (normalized || '').toLowerCase();
            if (lower.includes('email') && lower.includes('already exists')) {
                alert('❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
            }
        } else if (status && status >= 500) {
            // Ưu tiên in ra thông điệp chuẩn hóa nếu có (ví dụ: "Email already exists")
            console.error('💥 Server Error:', normalized || error.response?.data || error.message);
            // Hiển thị cảnh báo nếu có thông điệp cụ thể
            if (normalized) {
                const lower = normalized.toLowerCase();
                if (lower.includes('email') && lower.includes('already exists')) {
                    alert('❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
                }
            }
        } else {
            console.error('❗ Unexpected Error:', error.message);
        }

        // Không reject error cho logout requests để tránh logging không mong muốn
        if (isLogoutRequest) {
            return Promise.resolve({ data: { message: 'Logout completed' }, status: 200, statusText: 'OK', headers: {}, config: originalRequest });
        }

        return Promise.reject(error);
    }
);

export default apiClient;

