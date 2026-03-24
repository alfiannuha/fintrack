'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User, Wallet, AuthTokens, LoginInput, RegisterInput, JoinInput } from '@/types';

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  join: (input: JoinInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'fintrack_access_token';
const USER_KEY = 'fintrack_user';
const WALLET_KEY = 'fintrack_wallet';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const storedUser = localStorage.getItem(USER_KEY);
    const storedWallet = localStorage.getItem(WALLET_KEY);
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (storedUser && storedWallet && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setWallet(JSON.parse(storedWallet));
        api.setAccessToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WALLET_KEY);
    api.setAccessToken(null);
    setUser(null);
    setWallet(null);
  }, []);

  const saveAuth = useCallback((tokens: AuthTokens, newUser: User, newWallet: Wallet) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(WALLET_KEY, JSON.stringify(newWallet));
    api.setAccessToken(tokens.access_token);
    setUser(newUser);
    setWallet(newWallet);
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const response = await api.refreshToken();
      if (response.success) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
        api.setAccessToken(response.data.access_token);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearAuth();
    }
  }, [clearAuth]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await api.login(input);
    console.log('Login response:', response);
    
    if (response.success) {
      // Backend returns: { success, data: { tokens }, user, wallet }
      const tokens = response.data;
      const user = (response as any).user;
      const wallet = (response as any).wallet;
      
      console.log('Extracted - User:', user, 'Wallet:', wallet);
      
      if (!user || !wallet) {
        console.error('Login response missing user or wallet:', response);
        throw new Error('Login response incomplete');
      }
      
      saveAuth(tokens, user, wallet);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }, [saveAuth]);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await api.register(input);
    console.log('Register response:', response);
    
    if (response.success) {
      const tokens = response.data;
      const user = (response as any).user;
      const wallet = (response as any).wallet;
      
      if (!user || !wallet) {
        console.error('Register response missing user or wallet:', response);
        throw new Error('Register response incomplete');
      }
      
      saveAuth(tokens, user, wallet);
    } else {
      throw new Error(response.message || 'Register failed');
    }
  }, [saveAuth]);

  const join = useCallback(async (input: JoinInput) => {
    const response = await api.join(input);
    console.log('Join response:', response);
    
    if (response.success) {
      const tokens = response.data;
      const user = (response as any).user;
      const wallet = (response as any).wallet;
      
      if (!user || !wallet) {
        console.error('Join response missing user or wallet:', response);
        throw new Error('Join response incomplete');
      }
      
      saveAuth(tokens, user, wallet);
    } else {
      throw new Error(response.message || 'Join failed');
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value: AuthContextType = {
    user,
    wallet,
    isLoading,
    isAuthenticated: !!user && !!wallet,
    login,
    register,
    join,
    logout,
    refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
