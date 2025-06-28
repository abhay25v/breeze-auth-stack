
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import { apiClient } from './api';

export const authUtils = {
  // Token management
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  // JWT token validation
  isTokenValid: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // API calls
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.token) {
      authUtils.setToken(response.token);
    }
    return response;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    if (response.token) {
      authUtils.setToken(response.token);
    }
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authUtils.removeToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },
};
