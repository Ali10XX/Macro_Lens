import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { logAuth, logApiCall, logError, logInfo, logDebug } from '../utils/logger';

// Storage adapter for Expo SecureStore
const secureStorage = {
  getItem: async (name: string) => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('mobile/src/store/authStore.ts: Error getting item from secure storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, JSON.stringify(value));
    } catch (error) {
      console.error('mobile/src/store/authStore.ts: Error setting item in secure storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('mobile/src/store/authStore.ts: Error removing item from secure storage:', error);
    }
  },
};

import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Add timeout configuration
axios.defaults.timeout = API_CONFIG.TIMEOUT;

// Development mode flag - force mock auth in development
const USE_MOCK_AUTH = __DEV__;
console.log('🔧 DEBUG: USE_MOCK_AUTH =', USE_MOCK_AUTH);
console.log('🔧 DEBUG: __DEV__ =', __DEV__);
console.log('🔧 DEBUG: EXPO_PUBLIC_USE_MOCK_AUTH =', process.env.EXPO_PUBLIC_USE_MOCK_AUTH);

// Types matching desktop version
interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_premium?: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  rememberMe: boolean;
  loginCount: number;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  shouldSkipLogin: () => boolean;
  incrementLoginCount: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      rememberMe: false,
      loginCount: 0,

      login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true });
        try {
          console.log('🔐 AUTH: Starting login process with mock auth:', USE_MOCK_AUTH);
          
          if (USE_MOCK_AUTH) {
            // Mock authentication for development
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const mockUser = {
              id: 'mock-user-123',
              email,
              username: email.split('@')[0],
              first_name: 'Demo',
              last_name: 'User',
              isPremium: false,
            };
            
            const currentCount = rememberMe ? get().loginCount + 1 : 0;
            
            set({
              user: mockUser,
              token: 'mock-token-123',
              isAuthenticated: true,
              isLoading: false,
              rememberMe,
              loginCount: currentCount,
            });
            
            console.log('✅ AUTH: Mock login successful');
            return;
          }
          
          console.log('🌐 Making API request to:', `${API_BASE_URL}/api/v1/auth/login`);
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
            email,
            password,
          });
          console.log('✅ Login API response status:', response.status);

          const { access_token } = response.data;
          
          // Get user data separately
          const userResponse = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          const user = userResponse.data;
          
          console.log('✅ AUTH: Login successful, setting user data');
          
          // Store token securely instead of setting global header
          await SecureStore.setItemAsync('authToken', access_token);
          
          const currentCount = rememberMe ? get().loginCount + 1 : 0;
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            rememberMe,
            loginCount: currentCount,
          });
          
          console.log('✅ AUTH: Login state updated successfully');
          
          // Check onboarding status after successful login
          await get().checkOnboardingStatus();
          
        } catch (error: any) {
          console.error('❌ AUTH: Login error details:');
          console.error('- Error type:', error.code || 'Unknown');
          console.error('- Error message:', error.message);
          console.error('- Network error:', error.request ? 'Network timeout/unreachable' : 'Other error');
          console.error('- Response status:', error.response?.status);
          console.error('- Response data:', error.response?.data);
          
          set({ isLoading: false });
          
          // Provide more specific error messages
          let errorMessage = 'Login failed';
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Connection timeout - check if backend is running';
          } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to server - check network connection';
          } else if (error.response?.status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          }
          
          throw new Error(errorMessage);
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          console.log('📝 AUTH: Starting registration process with mock auth:', USE_MOCK_AUTH);
          
          if (USE_MOCK_AUTH) {
            // Mock registration for development
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const mockUser = {
              id: 'mock-user-123',
              email: userData.email,
              username: userData.username,
              first_name: userData.first_name,
              last_name: userData.last_name,
              isPremium: false,
            };
            
            set({
              user: mockUser,
              token: 'mock-token-123',
              isAuthenticated: true,
              isLoading: false,
            });
            
            console.log('✅ AUTH: Mock registration successful');
            return;
          }
          
          console.log('🌐 Making registration API request to:', `${API_BASE_URL}/api/v1/auth/register`);
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, userData);
          console.log('✅ Registration API response status:', response.status);

          const user = response.data;
          
          console.log('✅ AUTH: Registration successful, auto-logging in');
          
          // Auto-login after registration (matching web behavior)
          await get().login(userData.email, userData.password);
          
        } catch (error: any) {
          console.error('❌ AUTH: Registration error details:');
          console.error('- Error type:', error.code || 'Unknown');
          console.error('- Error message:', error.message);
          console.error('- Network error:', error.request ? 'Network timeout/unreachable' : 'Other error');
          console.error('- Response status:', error.response?.status);
          console.error('- Response data:', error.response?.data);
          
          set({ isLoading: false });
          
          // Provide more specific error messages
          let errorMessage = 'Registration failed';
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Connection timeout - check if backend is running';
          } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to server - check network connection';
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.detail || 'Invalid registration data';
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          }
          
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        console.log('mobile/src/store/authStore.ts: Logging out user');
        
        // Clear stored token
        await SecureStore.deleteItemAsync('authToken');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          rememberMe: false,
          loginCount: 0,
        });
        
        console.log('mobile/src/store/authStore.ts: Logout completed');
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          console.log('mobile/src/store/authStore.ts: No token found, user not authenticated');
          return;
        }

        // Skip if using mock auth
        if (USE_MOCK_AUTH) {
          console.log('mobile/src/store/authStore.ts: Using mock auth, skipping server validation');
          return;
        }

        try {
          console.log('mobile/src/store/authStore.ts: Checking authentication with token');
          
          // Use per-request header instead of global
          const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('mobile/src/store/authStore.ts: Auth check successful, updating user data');
          
          set({
            user: response.data,
            isAuthenticated: true,
          });
        } catch (error: any) {
          console.error('mobile/src/store/authStore.ts: Auth check failed:', error.response?.data || error.message);
          
          // Clear invalid token
          await SecureStore.deleteItemAsync('authToken');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      checkOnboardingStatus: async () => {
        const { user, token } = get();
        if (!user || !token) {
          console.log('mobile/src/store/authStore.ts: User not logged in, cannot check onboarding status.');
          return;
        }

        // Skip if using mock auth
        if (USE_MOCK_AUTH) {
          console.log('mobile/src/store/authStore.ts: Using mock auth, setting default onboarding status');
          set({ hasCompletedOnboarding: false });
          return;
        }

        try {
          console.log('mobile/src/store/authStore.ts: Checking onboarding status for user');
          const response = await axios.get(`${API_BASE_URL}/api/v1/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({ hasCompletedOnboarding: response.data.onboarding_completed || false });
          console.log('mobile/src/store/authStore.ts: Onboarding status updated successfully.');
        } catch (error: any) {
          console.error('mobile/src/store/authStore.ts: Error checking onboarding status:', error.response?.data || error.message);
          set({ hasCompletedOnboarding: false }); // Default to false on error
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          console.log('mobile/src/store/authStore.ts: Updating user data');
          set({
            user: { ...user, ...userData },
          });
        }
      },

      setOnboardingCompleted: (completed: boolean) => {
        set({ hasCompletedOnboarding: completed });
        console.log('mobile/src/store/authStore.ts: Onboarding status set to:', completed);
      },

      shouldSkipLogin: () => {
        // Disable login skip functionality for security
        return false;
      },

      incrementLoginCount: () => {
        const currentCount = get().loginCount;
        if (currentCount < 8) {
          set({ loginCount: currentCount + 1 });
        } else {
          // Reset after 8 logins
          set({ rememberMe: false, loginCount: 0 });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: secureStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        rememberMe: state.rememberMe,
        loginCount: state.loginCount,
      }),
    }
  )
); 