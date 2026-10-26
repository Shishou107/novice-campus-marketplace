import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentSession, initDatabase, loginUser, logoutUser, registerUser } from '@/services/db';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (studentId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    studentId: string;
    password: string;
    phone?: string;
    avatar?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const session = await getCurrentSession();
      setUser(session.user);
    } catch (error) {
      console.error('Lỗi khi tải lại phiên đăng nhập:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await initDatabase();
        const session = await getCurrentSession();
        if (isMounted) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo database hoặc lấy session:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (studentId: string, password: string) => {
    const res = await loginUser(studentId, password);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (data: {
    name: string;
    studentId: string;
    password: string;
    phone?: string;
    avatar?: string;
  }) => {
    const res = await registerUser(data);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
