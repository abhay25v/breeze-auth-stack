
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

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

  // Supabase API calls
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email!,
    };

    const token = data.session.access_token;
    authUtils.setToken(token);

    return { user, token };
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      name: credentials.name,
    };

    // For email confirmation flow, there might not be a session immediately
    const token = data.session?.access_token || '';
    if (token) {
      authUtils.setToken(token);
    }

    return { user, token };
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    authUtils.removeToken();
  },

  getCurrentUser: async (): Promise<User> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('User not authenticated');
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!,
    };
  },
};
