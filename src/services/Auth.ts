import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import {
  auth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from "../config/firebase";
import { db } from "../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { BackendRole, type FrontendRole, type LoginPayload, type RegisterPayload, type UserProvisionPayload, type UserProvisionResponse, type LoginResponse, type JwtPayload, type ForgotPasswordPayload, type ResetPasswordByOtpPayload, type MessageResponse } from "../types/auth.types";

export { BackendRole };
export type { FrontendRole, LoginPayload, RegisterPayload, UserProvisionPayload, UserProvisionResponse, LoginResponse, JwtPayload, ForgotPasswordPayload, ResetPasswordByOtpPayload, MessageResponse };

// Hàm decode JWT token để lấy payload
export function decodeJWT(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Hàm lấy role từ JWT token
export function getRoleFromToken(token: string): FrontendRole | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  // Role có thể là string hoặc array
  const roles = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (!roles) return null;

  // Nếu là array, lấy role đầu tiên
  const role = Array.isArray(roles) ? roles[0] : roles;

  // Map role từ backend sang frontend
  // Backend roles: "Admin", "Manager", "HR" (sẽ đổi thành "TA" sau), "Accountant", "Sale", "Dev"
  // Frontend hiển thị "TA" nhưng backend vẫn trả về "HR" (chưa đổi)
  switch (role) {
    case 'Admin':
      return 'Admin';
    case 'Manager':
      return 'Manager';
    case 'HR':
    case 'TA':
      return 'Staff TA';
    case 'Accountant':
      return 'Staff Accountant';
    case 'Sale':
      return 'Staff Sales';
    case 'Dev':
      return 'Developer';
    default:
      return 'Developer';
  }
}

// Hàm chuyển đổi Role từ backend (số) sang frontend (string) - giữ lại để tương thích
export function mapBackendRoleToFrontend(role: BackendRole): FrontendRole {
  switch (role) {
    case BackendRole.Admin:
      return "Admin";
    case BackendRole.Manager:
      return "Manager";
    case BackendRole.HR: // Backend vẫn trả về HR (số 3), frontend hiển thị là Staff TA
      return "Staff TA";
    case BackendRole.Accountant:
      return "Staff Accountant";
    case BackendRole.Sale:
      return "Staff Sales";
    case BackendRole.Dev:
      return "Developer";
    default:
      return "Developer";
  }
}

/**
 * Tạo hoặc cập nhật user document trong Firestore
 * @param userId - Firebase user ID (uid)
 * @param email - Email của user
 * @param role - Role của user từ backend
 */
async function syncUserToFirestore(
  userId: string,
  email: string,
  role: FrontendRole
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    // Xác định isAdmin dựa trên role
    const isAdmin = role === 'Admin' || role === 'Manager';

    const userData = {
      email,
      role,
      isAdmin,
      updatedAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      // Tạo user document mới
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      console.log('Created new user document in Firestore:', {
        userId,
        email,
        role,
        isAdmin
      });
    } else {
      // Cập nhật user document nếu đã tồn tại
      await setDoc(userRef, userData, { merge: true });
      console.log('Updated user document in Firestore:', {
        userId,
        email,
        role,
        isAdmin
      });
    }
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
    // Không throw error để không làm gián đoạn quá trình login
  }
}

/**
 * Authenticate với Firebase sau khi login API thành công
 * @param loginResponse - Response từ API login
 * @param email - Email của user
 * @param password - Password của user (để sign in Firebase nếu không có custom token)
 * @param role - Role của user từ frontend
 */
export async function authenticateWithFirebase(
  loginResponse: LoginResponse,
  email: string,
  password: string,
  role: FrontendRole
): Promise<void> {
  try {
    let firebaseUser;

    // Nếu có Firebase custom token từ backend, dùng nó
    if (loginResponse.firebaseCustomToken) {
      const userCredential = await signInWithCustomToken(auth, loginResponse.firebaseCustomToken);
      firebaseUser = userCredential.user;
    } else {
      // Nếu không có custom token, thử sign in với email/password
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
      } catch (error: any) {
        const errorCode = error?.code || '';
        const errorMessage = error?.message || '';

        console.log('Firebase sign-in error:', { errorCode, errorMessage });

        // Xử lý các trường hợp lỗi khác nhau
        if (errorCode === 'auth/user-not-found') {
          // User chưa tồn tại trong Firebase, tạo user mới
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            firebaseUser = userCredential.user;
            console.log('Created new Firebase user:', firebaseUser.uid);
          } catch (createError: any) {
            console.error('Failed to create Firebase user:', createError);
            // Không throw, tiếp tục với backend authentication
            return;
          }
        } else if (
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/invalid-email' ||
          errorMessage.includes('INVALID_PASSWORD') ||
          errorMessage.includes('INVALID_EMAIL')
        ) {
          // Mật khẩu hoặc email không hợp lệ
          // Có thể user đã đổi mật khẩu ở backend nhưng Firebase chưa được cập nhật
          // Hoặc user chưa tồn tại trong Firebase
          console.warn('Firebase authentication failed - user may have changed password or not exist in Firebase:', {
            errorCode,
            errorMessage
          });

          // Thử tạo user mới với mật khẩu hiện tại (nếu user chưa tồn tại)
          // Nếu user đã tồn tại với mật khẩu cũ, sẽ fail nhưng không sao vì đã có try-catch
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            firebaseUser = userCredential.user;
            console.log('Created new Firebase user after auth failure:', firebaseUser.uid);
          } catch (createError: any) {
            const createErrorCode = createError?.code || '';
            // User có thể đã tồn tại với mật khẩu khác
            if (createErrorCode === 'auth/email-already-in-use') {
              console.warn('⚠️ Firebase user already exists with different password - cannot update from client side.');
              console.warn('💡 Solution: Backend should automatically sync Firebase password when password is changed.');
              console.warn('📝 Continuing with backend auth only. Firebase Storage upload may not work until Firebase password is synced.');
            } else {
              // Hoặc có lỗi khác khi tạo user
              console.warn('Cannot create Firebase user - continuing with backend auth only:', createErrorCode);
            }
            // Không throw, tiếp tục với backend authentication
            // Firebase authentication là optional, backend authentication đã thành công
            // Lưu ý: Upload file lên Firebase Storage có thể không hoạt động nếu Firebase authentication fail
            return;
          }
        } else {
          // Các lỗi khác - log và tiếp tục
          console.warn('Firebase authentication error (non-critical):', {
            errorCode,
            errorMessage
          });
          // Không throw, tiếp tục với backend authentication
          return;
        }
      }
    }

    // Sync user vào Firestore sau khi authenticate thành công
    if (firebaseUser) {
      console.log('Firebase authenticated successfully:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
      await syncUserToFirestore(firebaseUser.uid, email, role);
      console.log('User synced to Firestore successfully');
    }
  } catch (error: any) {
    console.error('Firebase authentication error (caught in outer catch):', error);
    // Không throw error để không làm gián đoạn quá trình login
    // Firebase auth có thể fail nhưng vẫn cho phép login với API
  }
}

/**
 * Kiểm tra và đảm bảo Firebase authentication
 * Nếu chưa authenticate, thử restore từ localStorage
 */
export async function ensureFirebaseAuth(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return true;
  }

  // Nếu chưa có user, kiểm tra localStorage để re-authenticate
  const storedUser = localStorage.getItem('devpool_user');
  const accessToken = localStorage.getItem('accessToken');

  if (storedUser && accessToken) {
    try {
      // Kiểm tra xem có user data trong localStorage
      JSON.parse(storedUser);
      // Thử re-authenticate với email/password (nếu có)
      // Note: Cần lưu password trong secure storage hoặc dùng refresh token
      console.warn('Firebase auth: User not authenticated, need to re-login');
      return false;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return false;
    }
  }

  return false;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể đăng nhập" };
      throw { message: "Lỗi không xác định khi đăng nhập" };
    }
  },

  async register(payload: RegisterPayload) {
    try {
      const response = await apiClient.post("/auth/register", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể đăng ký tài khoản" };
      throw { message: "Lỗi không xác định khi đăng ký" };
    }
  },

  /**
   * Admin provision user - Backend tự động generate password
   * @param payload - UserProvisionPayload (không cần password, avatarUrl, address)
   * @returns UserProvisionResponse với password được generate
   */
  async adminProvision(payload: UserProvisionPayload): Promise<UserProvisionResponse> {
    try {
      const response = await apiClient.post<UserProvisionResponse>("/auth/register", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo tài khoản" };
      throw { message: "Lỗi không xác định khi tạo tài khoản" };
    }
  },

  /**
   * Logout - Gọi API backend để xóa refresh token
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      // Kiểm tra xem có token không trước khi gọi API
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Không có token, không cần gọi API logout
        console.log('No access token found, skipping backend logout');
        return;
      }

      const response = await apiClient.post("/auth/logout");
      // Không log success vì logout API có thể return 401 (expected) nhưng interceptor xử lý thành success
      return response.data;
    } catch (error: unknown) {
      // Fallback: nếu có lỗi bất ngờ (interceptor đã xử lý 401 thành success rồi)
      console.warn('Unexpected logout error:', error);
    }
  },

  async logoutFirebase(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      console.log('Firebase logout successful');
    } catch (error) {
      console.error('Firebase logout error:', error);
    }
  },

  /**
   * Login với FaceID
   * @param faceVector - Face vector từ face detection
   * @returns LoginResponse với JWT tokens
   */
  async loginWithFaceID(faceVector: number[]): Promise<LoginResponse> {
    try {
      // Log chi tiết để debug
      console.log('=== FaceID Login Debug ===');
      console.log('Vector length:', faceVector.length);
      console.log('Vector sample (first 10):', faceVector.slice(0, 10));
      console.log('Vector sample (last 10):', faceVector.slice(-10));
      console.log('Vector min:', Math.min(...faceVector));
      console.log('Vector max:', Math.max(...faceVector));
      console.log('Vector avg:', faceVector.reduce((a, b) => a + b, 0) / faceVector.length);
      console.log('Vector magnitude:', Math.sqrt(faceVector.reduce((sum, val) => sum + val * val, 0)));

      // Log để copy vào backend test
      console.log('=== Copy this to test in backend ===');
      console.log('Frontend Vector:', JSON.stringify(faceVector));

      const response = await apiClient.post<LoginResponse>("/auth/faceid/login", {
        faceVector,
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        // Lấy thông báo lỗi từ backend hoặc normalized message
        const errorData = error.response?.data;
        const normalizedMessage = (error as any).normalizedMessage;
        const errorMessage = normalizedMessage || errorData?.message || errorData?.error || "Không thể đăng nhập bằng FaceID";

        // Log chi tiết lỗi để debug
        console.error('FaceID Login Error:', {
          status: error.response?.status,
          message: errorMessage,
          data: errorData
        });

        throw { message: errorMessage, response: error.response };
      }
      throw { message: "Lỗi không xác định khi đăng nhập bằng FaceID" };
    }
  },

  /**
   * Đăng ký FaceID cho user
   * @param email - Email của user
   * @param faceVector - Face vector từ face detection
   * @returns Promise<void>
   */
  async enrollFaceID(email: string, faceVector: number[]): Promise<void> {
    try {
      const response = await apiClient.post("/auth/faceid/enroll", {
        email,
        faceVector,
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || "Không thể đăng ký FaceID";
        throw { message: errorMessage, response: error.response };
      }
      throw { message: "Lỗi không xác định khi đăng ký FaceID" };
    }
  },

  /**
   * Xóa FaceID của user hiện tại
   * @returns Promise<void>
   */
  async removeFaceID(): Promise<void> {
    try {
      const response = await apiClient.delete("/auth/faceid/remove");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || "Không thể xóa FaceID";
        throw { message: errorMessage, response: error.response };
      }
      throw { message: "Lỗi không xác định khi xóa FaceID" };
    }
  },

  /**
   * Gửi OTP quên mật khẩu đến email
   * @param email - Email của user
   * @returns Promise<MessageResponse>
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>("/auth/forgot-password", null, {
        params: { email },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể gửi OTP quên mật khẩu" };
      throw { message: "Lỗi không xác định khi gửi OTP quên mật khẩu" };
    }
  },

  /**
   * Reset mật khẩu bằng OTP
   * @param payload - ResetPasswordByOtpPayload (email, otp, newPassword)
   * @returns Promise<MessageResponse>
   */
  async resetPasswordByOtp(payload: ResetPasswordByOtpPayload): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>("/auth/reset-password-by-otp", payload);

      // Sau khi đổi mật khẩu thành công, thử yêu cầu backend sync Firebase password
      // Backend có thể có endpoint này hoặc tự động sync
      try {
        // Gọi API để yêu cầu backend sync Firebase password (nếu có endpoint này)
        // Nếu không có endpoint, backend nên tự động sync khi đổi mật khẩu
        await apiClient.post("/auth/sync-firebase-password", {
          email: payload.email,
          newPassword: payload.newPassword
        }).catch(() => {
          // Nếu endpoint không tồn tại, không sao - backend có thể tự động sync
          console.log('Backend sync Firebase password endpoint không tồn tại hoặc đã được tự động sync');
        });
      } catch (syncError) {
        // Không throw error vì sync Firebase password là optional
        console.log('Không thể sync Firebase password - backend có thể tự động sync:', syncError);
      }

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể reset mật khẩu. OTP không hợp lệ hoặc đã hết hạn." };
      throw { message: "Lỗi không xác định khi reset mật khẩu" };
    }
  },
};


