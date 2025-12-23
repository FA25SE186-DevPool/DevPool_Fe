import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { getAccessToken as getTokenFromStorage } from '../utils/storage';
import { API_BASE_URL } from '../config/env.config';

// Suy ra HUB_URL từ API_BASE_URL
// SignalR hub có thể nằm ở:
// 1. Root level: https://host:port/notificationHub (không có /api) - phổ biến hơn
// 2. API path: https://host:port/api/notificationHub
// Nếu backend cấu hình khác, có thể override bằng biến môi trường VITE_HUB_URL
const getHubUrl = (): string => {
	// Ưu tiên biến môi trường nếu có
	if (import.meta.env.VITE_HUB_URL) {
		const hubUrl = String(import.meta.env.VITE_HUB_URL).trim();
		console.log('🔗 Notification Hub URL (from env):', hubUrl);
		return hubUrl;
	}
	
	// Mặc định: thử root level trước (loại bỏ /api)
	// Vì SignalR hub thường được map ở root level, không trong /api
	const apiUrl = String(API_BASE_URL).trim();
	const hubBase = apiUrl.replace(/\/api\/?$/, '');
	const hubUrl = `${hubBase}/notificationHub`;
	
	// Log để debug (chỉ trong dev mode)
	if (import.meta.env.DEV) {
		console.log('🔗 Notification Hub URL:', hubUrl);
	}
	
	return hubUrl;
};

const HUB_URL = getHubUrl();

let connection: HubConnection | null = null;
let isStarting = false;
let reconnectAttempts = 0;
let hasInitialized = false;
const MAX_RECONNECT_ATTEMPTS = 3;

// Hàm refresh token (sử dụng cùng logic như axios config)
const refreshToken = async (): Promise<string | null> => {
	try {
		// Luôn lấy refresh token từ localStorage
		const refreshTokenValue = localStorage.getItem('refreshToken');
		
		if (!refreshTokenValue) {
			console.warn('⚠️ No refresh token found in storage (notificationHub)');
			return null;
		}

		const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ refreshToken: refreshTokenValue }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage = errorData?.message || 'Unknown error';
			console.error('❌ Unable to refresh token (notificationHub):', errorMessage);
			
			// Xử lý đặc biệt cho lỗi "Refresh token is revoked or does not match"
			if (errorMessage.includes('revoked') || errorMessage.includes('does not match')) {
				console.warn('⚠️ Refresh token mismatch - user may have logged in elsewhere (notificationHub)');
			}
			
			// Nếu refresh thất bại, xóa tokens
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('remember_me');
			// Xóa từ sessionStorage để đảm bảo (nếu có)
			sessionStorage.removeItem('accessToken');
			sessionStorage.removeItem('refreshToken');
			return null;
		}

		const data = await response.json();
		if (data.accessToken) {
			// Lưu token mới vào localStorage
			localStorage.setItem('accessToken', data.accessToken);
			if (data.refreshToken) {
				localStorage.setItem('refreshToken', data.refreshToken);
			}
			return data.accessToken;
		}
		return null;
	} catch (error) {
		console.error('❌ Error refreshing token (notificationHub):', error);
		return null;
	}
};

// Function kept for potential future use
const getAccessToken = async (): Promise<string> => {
	let token = getTokenFromStorage() ?? '';
	
	// Luôn thử refresh token để đảm bảo token còn hiệu lực
	// Nếu không có token hoặc token có thể đã hết hạn, refresh
	if (!token) {
		const newToken = await refreshToken();
		if (newToken) {
			token = newToken;
		}
	}
	
	return token;
};

// Suppress unused function warning - may be used in future
void getAccessToken;

export const createNotificationConnection = (): HubConnection => {
	if (connection && connection.state === 'Disconnected') return connection;

	// Reset connection nếu nó không ở trạng thái Disconnected
	connection = null;

	connection = new HubConnectionBuilder()
		.withUrl(HUB_URL, {
			accessTokenFactory: async () => {
				// Luôn lấy token mới nhất từ storage
				const token = getTokenFromStorage() ?? '';
				if (!token) {
					// Nếu không có token, thử refresh
					const newToken = await refreshToken();
					return newToken || '';
				}
				return token;
			},
			withCredentials: true,
			// Chỉ sử dụng SSE (Server-Sent Events) và Long Polling để tránh lỗi WebSocket trong console
			// WebSocket thường bị chặn bởi proxy/firewall hoặc không được hỗ trợ
			// SSE và Long Polling hoạt động ổn định hơn và không gây lỗi trong console
			// Nếu cần WebSocket, có thể thêm: HttpTransportType.WebSockets |
			transport: HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
			skipNegotiation: false,
			// Thêm timeout cho negotiation
			timeout: 10000,
		})
		.withAutomaticReconnect({
			nextRetryDelayInMilliseconds: (retryContext) => {
				// Exponential backoff: 0s, 2s, 10s, 30s
				if (retryContext.previousRetryCount === 0) return 0;
				if (retryContext.previousRetryCount === 1) return 2000;
				if (retryContext.previousRetryCount === 2) return 10000;
				return 30000;
			},
		})
		.configureLogging(LogLevel.None) // Tắt log từ SignalR library để tránh log lỗi WebSocket không cần thiết
		.build();

	// Optional: lắng nghe sự kiện hệ thống để debug
	connection.onreconnecting(() => {
		reconnectAttempts++;
	});
	connection.onreconnected(() => {
		reconnectAttempts = 0;
	});
	connection.onclose(async (error) => {
		// Nếu lỗi 401 và chưa vượt quá số lần thử, thử refresh token và reconnect
		if (error && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
			const newToken = await refreshToken();
			if (newToken) {
				// Tạo lại connection với token mới
				connection = null;
				setTimeout(() => {
					startNotificationConnection(true).catch(() => {});
				}, 2000);
			}
		}
	});

	return connection;
};

export const startNotificationConnection = async (forceRestart: boolean = false): Promise<void> => {
	// Prevent multiple initialization unless force restart
	if (hasInitialized && !forceRestart) {
		return;
	}

	// Kiểm tra và refresh token trước khi kết nối
	let token = getTokenFromStorage();
	if (!token) {
		// Thử refresh token nếu không có token
		token = await refreshToken();
		if (!token) {
			// Không có token và không thể refresh, không kết nối
			return;
		}
	}

	// Nếu force restart, dừng connection cũ trước
	if (forceRestart && connection && connection.state !== 'Disconnected') {
		try {
			await connection.stop();
			connection = null; // Reset connection để tạo mới
			hasInitialized = false; // Reset flag for force restart
		} catch {
			// ignore
		}
	}
	
	const newConn = createNotificationConnection();
	if (newConn.state !== 'Disconnected' || isStarting) {
		// Nếu connection không ở trạng thái Disconnected, thử stop trước
		if (newConn.state !== 'Disconnected') {
			try {
				await newConn.stop();
			} catch {
				// ignore stop errors
			}
		}
		return;
	}
	isStarting = true;
	
	try {
		await newConn.start();
		reconnectAttempts = 0; // Reset counter khi kết nối thành công
		hasInitialized = true; // Mark as initialized to prevent multiple attempts
		if (import.meta.env.DEV) {
			// Log transport type đang sử dụng (nếu có)
			try {
				const transport = (newConn as any).connection?.transport?.name ||
				                  (newConn as any).connectionState?.transport?.name ||
				                  'unknown';
				console.log(`✅ Notification Hub connected successfully to: ${HUB_URL} (transport: ${transport})`);
			} catch {
				console.log(`✅ Notification Hub connected successfully to: ${HUB_URL}`);
			}
		}
	} catch (err: any) {
		const errorMessage = err?.message || '';
		const statusCode = err?.statusCode || err?.status;
		
		// Bỏ qua các lỗi transport/ngoại cảnh - SignalR sẽ tự động fallback hoặc retry
		// Chỉ log lỗi khi thực sự không kết nối được
		const isRecoverableError = errorMessage.includes('WebSocket failed to connect') ||
			errorMessage.includes('WebSockets transport') ||
			errorMessage.includes('connection could not be found on the server') ||
			errorMessage.includes('sticky sessions') ||
			errorMessage.includes('The connection could not be found on the server') ||
			errorMessage.includes('The connection was stopped during negotiation') ||
			errorMessage.includes('connection was stopped') ||
			errorMessage.includes('negotiation');
		
		// Nếu là lỗi có thể recover (transport/ngoại cảnh), đợi và kiểm tra xem có fallback thành công không
		let shouldRetryWithoutLog = false;
		if (isRecoverableError) {
			// Đợi lâu hơn để SignalR có thời gian fallback hoặc retry
			await new Promise(resolve => setTimeout(resolve, 2000));
			// Kiểm tra lại state sau khi đợi
			const currentState = newConn.state;
			if (String(currentState) === 'Connected') {
				// Connection đã thành công
				if (import.meta.env.DEV) {
					console.log('✅ Notification Hub connected via fallback/retry');
				}
				reconnectAttempts = 0;
				return;
			}
			// Nếu vẫn chưa kết nối được, đánh dấu để retry mà không log error
			shouldRetryWithoutLog = true;
			if (import.meta.env.DEV) {
				console.warn('⚠️ Connection failed, will retry...');
			}
		}

		// Trong production/development, chỉ log lỗi một lần và silent ignore để không spam console
		// Notification hub thường không khả dụng trong môi trường dev, đây là expected behavior
		if (!shouldRetryWithoutLog && statusCode !== 404 && reconnectAttempts === 0) {
			console.warn('⚠️ Notification hub connection failed (this is normal in dev environment):', {
				url: HUB_URL,
				error: errorMessage,
				statusCode,
			});
		}
		
		// Nếu lỗi 401, thử refresh token và reconnect
		if (statusCode === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
			const newToken = await refreshToken();
			if (newToken && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
				// Tạo lại connection với token mới
				connection = null;
				reconnectAttempts++;
				setTimeout(() => {
					isStarting = false;
					startNotificationConnection(true).catch(() => {});
				}, 1000);
				return;
			} else {
				// Không thể refresh token, dừng kết nối
				isStarting = false;
				return;
			}
		}
		
		// Retry đơn giản sau 2s cho các lỗi khác (nếu chưa vượt quá số lần thử)
		if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
			reconnectAttempts++;
			setTimeout(() => {
				isStarting = false;
				startNotificationConnection(forceRestart).catch(() => {});
			}, 2000);
		} else {
			isStarting = false;
			console.error('❌ Max reconnection attempts reached. Please check:', {
				hubUrl: HUB_URL,
				apiUrl: API_BASE_URL,
				note: 'Ensure the backend SignalR hub is properly configured and accessible.',
			});
		}
		return;
	} finally {
		isStarting = false;
	}
};

export const stopNotificationConnection = async (): Promise<void> => {
	if (connection) {
		try {
			await connection.stop();
		} catch {
			// ignore
		} finally {
			// Đảm bảo reset connection state
			connection = null;
			isStarting = false;
			reconnectAttempts = 0;
		}
	}
};

// Đăng ký handler nhận thông báo realtime từ server (ví dụ method name 'ReceiveNotification')
export const onReceiveNotification = (handler: (payload: unknown) => void): void => {
	const conn = createNotificationConnection();
	conn.on('ReceiveNotification', handler as (...args: any[]) => void);
};

export const offReceiveNotification = (handler: (payload: unknown) => void): void => {
	if (!connection) return;
	connection.off('ReceiveNotification', handler as (...args: any[]) => void);
};

// Lắng nghe cập nhật số lượng chưa đọc
export const onUnreadCountUpdated = (handler: (count: number) => void): void => {
	const conn = createNotificationConnection();
	// Đăng ký cả hai biến thể tên để tránh sai khác chữ hoa/thường từ server
	conn.on('UnreadCountUpdated', handler as (...args: any[]) => void);
	conn.on('unreadcountupdated', handler as (...args: any[]) => void);
};

export const offUnreadCountUpdated = (handler: (count: number) => void): void => {
	if (!connection) return;
	connection.off('UnreadCountUpdated', handler as (...args: any[]) => void);
	connection.off('unreadcountupdated', handler as (...args: any[]) => void);
};

// Hủy đăng ký handler nếu cần
// Các hàm invoke tới hub (khớp với BE)
export const getUnreadCount = async (): Promise<number> => {
	const conn = createNotificationConnection();
	if (conn.state !== 'Connected') await startNotificationConnection();
	try {
		const count = await conn.invoke<number>('GetUnreadCount');
		return typeof count === 'number' ? count : 0;
	} catch {
		return 0;
	}
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
	const conn = createNotificationConnection();
	if (conn.state !== 'Connected') await startNotificationConnection();
	await conn.invoke('MarkNotificationAsRead', notificationId);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
	const conn = createNotificationConnection();
	if (conn.state !== 'Connected') await startNotificationConnection();
	await conn.invoke('MarkAllNotificationsAsRead');
};

export const updateActivity = async (): Promise<void> => {
	const conn = createNotificationConnection();
	if (conn.state !== 'Connected') await startNotificationConnection();
	await conn.invoke('UpdateActivity');
};


