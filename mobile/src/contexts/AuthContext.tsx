import React, { createContext, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

interface AuthContextType {
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const { login } = useAuthStore();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          // Verify token with server instead of bypassing login
          const { checkAuth } = useAuthStore.getState();
          await checkAuth();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [login]);

  return (
    <AuthContext.Provider value={{ isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 