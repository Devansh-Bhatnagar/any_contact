import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  skipAuth: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Bootstrap auth state on app launch
  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await AuthService.login({ email, password });
      setUser(loggedInUser);
      setIsGuest(false);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Login failed. Please check your credentials.',
      };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      try {
        const { user: registeredUser } = await AuthService.register({
          name,
          email,
          password,
          phone,
        });
        setUser(registeredUser);
        setIsGuest(false);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Registration failed. Please try again.',
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsGuest(false);
    } catch (err) {
      console.warn('Logout error:', err);
      setUser(null);
      setIsGuest(false);
    }
  }, []);

  const skipAuth = useCallback(async () => {
    setIsGuest(true);
    const guestProfile = await AuthService.getGuestProfile();
    if (guestProfile) {
      setUser(guestProfile);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>) => {
      const updated = await AuthService.updateUserProfile(user, updates);
      setUser(updated);
    },
    [user]
  );

  const value = {
    user,
    isAuthenticated: !!user && user.role !== 'GUEST',
    isLoading,
    isGuest,
    login,
    register,
    logout,
    skipAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

