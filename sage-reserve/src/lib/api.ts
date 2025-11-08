/**
 * API Service Layer
 * All API calls are centralized here
 */

import apiClient from './apiClient';
import { clearTokens, setTokens, setStoredUser } from './apiConfig';

// Types
export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

// Auth API
export const authAPI = {
  /**
   * Sign up a new user
   */
  signup: async (data: UserCreate): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: UserLogin): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    const { access_token, refresh_token } = response.data;
    setTokens(access_token, refresh_token);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token } = response.data;
    setTokens(access_token, refresh_token);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (refreshToken: string): Promise<MessageResponse> => {
    try {
      const response = await apiClient.post<MessageResponse>('/auth/logout', {
        refresh_token: refreshToken,
      });
      return response.data;
    } finally {
      clearTokens();
    }
  },
};

// User API
export const userAPI = {
  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/me');
    setStoredUser(response.data);
    return response.data;
  },

  /**
   * Update current user
   */
  updateCurrentUser: async (data: UserUpdate): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>('/users/me', data);
    setStoredUser(response.data);
    return response.data;
  },

  /**
   * Delete current user account
   */
  deleteCurrentUser: async (): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>('/users/me');
    clearTokens();
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Delete user by ID (superuser only)
   */
  deleteUserById: async (userId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/users/${userId}`);
    return response.data;
  },
};

// Export combined API
const api = {
  auth: authAPI,
  users: userAPI,
};

export default api;
