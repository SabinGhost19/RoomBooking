/**
 * Auth Context for managing authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { UserResponse, UserLogin, UserCreate } from '../lib/api';
import { getAccessToken, getRefreshToken, clearTokens, getStoredUser } from '../lib/apiConfig';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  signup: (data: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (token) {
        if (storedUser) {
          setUser(storedUser);
        }
        
        try {
          // Fetch fresh user data
          const userData = await api.users.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          clearTokens();
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: UserLogin) => {
    try {
      setLoading(true);
      await api.auth.login(credentials);
      
      // Fetch user data after successful login
      const userData = await api.users.getCurrentUser();
      setUser(userData);
      
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: UserCreate) => {
    try {
      setLoading(true);
      await api.auth.signup(data);
      
      // Auto login after signup
      await login({ email: data.email, password: data.password });
      
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Signup failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.auth.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.users.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      clearTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
