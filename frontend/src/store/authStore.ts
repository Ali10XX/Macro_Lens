import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          
          // Get user profile
          const userResponse = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            set({
              token: data.access_token,
              user: userData,
              isAuthenticated: true,
            });
          } else {
            throw new Error('Failed to get user profile');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (userData: any) => {
        try {
          // Mock registration for now - replace with real API call when backend is ready
          console.log('Mock registration:', userData);
          
          // Simulate successful registration
          const mockUser = {
            id: '1',
            email: userData.email,
            username: userData.username || userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isPremium: false
          };
          
          const mockToken = 'mock-jwt-token';
          
          set({
            token: mockToken,
            user: mockUser,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);