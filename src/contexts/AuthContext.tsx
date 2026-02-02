import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, Bank } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo
const mockUsers: Record<string, User> = {
  'admin@banka.com': {
    id: 'admin-1',
    email: 'admin@banka.com',
    role: 'admin',
    bank: 'A',
    kycStatus: 'approved',
    balances: { USD: 0, DA: 0, DB: 0, CS: 0 },
    dailyDepositUsed: 0,
  },
  'user@banka.com': {
    id: 'user-1',
    email: 'user@banka.com',
    role: 'user',
    bank: 'A',
    kycStatus: 'approved',
    balances: { USD: 100000, DA: 0, DB: 0, CS: 0 },
    dailyDepositUsed: 0,
  },
  'user@bankb.com': {
    id: 'user-2',
    email: 'user@bankb.com',
    role: 'user',
    bank: 'B',
    kycStatus: 'pending',
    balances: { USD: 100000, DA: 0, DB: 0, CS: 0 },
    dailyDepositUsed: 0,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (token && storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        token,
        isAuthenticated: true,
      });
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    // TODO: integrate real API
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers[email];
    if (!user || user.role !== role) {
      throw new Error('Invalid credentials or role mismatch');
    }

    const token = `mock-jwt-token-${Date.now()}`;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    setAuthState({
      user,
      token,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
