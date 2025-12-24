import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/Auth';
import { auth, onAuthStateChanged } from '../config/firebase';
import { getUser, getAccessToken, clearAuthData } from '../utils/storage';

type Role =
  | 'Staff TA'
  | 'Staff Accountant'
  | 'Staff Sales'
  | 'Developer'
  | 'Manager'
  | 'Admin'
  | 'Partner';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  sessionWarning: boolean;
  resetSession: () => void;
}

const STORAGE_KEY = 'devpool_user';

// Session timeout settings
const SESSION_TIMEOUT = 60 * 60 * 1000; // 120 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function roleDisplayName(role: Role, email: string) {
  switch (role) {
    case 'Staff TA':
      return 'Nhân viên Nhân sự';
    case 'Staff Accountant':
      return 'Nhân viên Kế toán';
    case 'Staff Sales':
      return 'Nhân viên Kinh doanh';
    case 'Developer':
      return 'Lập trình viên';
    case 'Manager':
      return 'Quản lý';
    case 'Admin':
      return 'Admin';
    case 'Partner':
      return 'Đối tác';
    default:
      return email;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const userRef = useRef<User | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Cập nhật ref khi user thay đổi
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Restore user từ storage (kiểm tra cả localStorage và sessionStorage)
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      userRef.current = storedUser;
    }

    // Kiểm tra Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user authenticated (silent)
      } else {
        console.warn('Firebase auth state: No user authenticated');
      }
      setIsLoading(false);
    });

    // Lắng nghe thay đổi localStorage từ các tab khác
    const handleStorageChange = (e: StorageEvent) => {
      // Nếu token hoặc user data thay đổi từ tab khác
      if (e.key === 'accessToken' || e.key === 'devpool_user') {
        const newToken = localStorage.getItem('accessToken');
        const newUser = getUser();
        const currentUser = userRef.current;
        
        // Nếu token bị xóa (logout từ tab khác)
        if (!newToken && currentUser) {
          console.log('Token removed from another tab, logging out...');
          setUser(null);
          userRef.current = null;
          return;
        }
        
        // Nếu token thay đổi (đăng nhập tài khoản khác từ tab khác)
        if (newToken && newUser) {
          const currentUserId = currentUser?.id;
          const newUserId = newUser.id;
          
          // Nếu user ID khác nhau, đây là đăng nhập tài khoản mới
          if (currentUserId && newUserId && currentUserId !== newUserId) {
            console.log('Different user logged in from another tab, updating user...');
            setUser(newUser);
            userRef.current = newUser;
            // Reload page để đảm bảo tất cả state được cập nhật
            window.location.reload();
          } else if (!currentUserId && newUserId) {
            // Nếu chưa có user nhưng có user mới, cập nhật
            setUser(newUser);
            userRef.current = newUser;
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Không có dependency để chỉ chạy 1 lần khi mount

  const login: AuthContextType['login'] = async (email, _password, role) => {
    setIsLoading(true);
    
    // Lấy thông tin user từ storage (đã được lưu trong LoginForm)
    const storedUser = getUser();
    
    if (storedUser) {
      setUser(storedUser);
      setIsLoading(false);
      return;
    }

    // Nếu không có stored user, tạo user từ thông tin login
    const accessToken = getAccessToken();
    const user: User = {
      id: accessToken || '1', // Có thể lấy từ token hoặc API
      email,
      name: roleDisplayName(role, email),
      role,
      avatar:
        'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    };

    setUser(user);
    // User đã được lưu trong LoginForm, không cần lưu lại ở đây
    setIsLoading(false);
  };

  const register: AuthContextType['register'] = async (email, _password, role) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const mockUser: User = {
      id: '1',
      email,
      name: roleDisplayName(role, email),
      role,
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
  };

  // Reset session activity timer
  const resetSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionWarning(false);

    // Clear existing timers
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Setup new timers if user is logged in
    if (user) {
      warningTimeoutRef.current = setTimeout(() => {
        setSessionWarning(true);
      }, SESSION_TIMEOUT - WARNING_TIME);

      sessionTimeoutRef.current = setTimeout(async () => {
        console.log('Session timeout - auto logout');
        await logout();
      }, SESSION_TIMEOUT);
    }
  }, [user]);

  // Setup session timeout when user logs in
  useEffect(() => {
    if (user) {
      resetSession();
    } else {
      // Clear timers when user logs out
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      setSessionWarning(false);
    }

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, resetSession]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      if (user) {
        resetSession();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, resetSession]);

  const logout = async () => {
    try {
      // Clear user state TRƯỚC để UI cập nhật ngay lập tức
      setUser(null);
      userRef.current = null;
      
      // Gọi API logout backend để xóa refresh token (không block nếu fail)
      // Note: 401 errors are expected and not logged (handled in authService.logout())
      authService.logout().catch(() => {
        // Silent fail - logout local vẫn hoạt động bình thường
      });
      
      // Logout Firebase (không block nếu fail)
      authService.logoutFirebase().catch((error) => {
        console.warn('Firebase logout error (continuing):', error);
      });
      
      // Clear storage (cả localStorage và sessionStorage) - phải clear sau khi gọi API
      clearAuthData();
    } catch (error) {
      // Đảm bảo storage vẫn được clear ngay cả khi có lỗi
      console.error('Error during logout:', error);
      clearAuthData();
      setUser(null);
      userRef.current = null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, sessionWarning, resetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

