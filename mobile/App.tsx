import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { AuthStackNavigator } from '@/navigation/AuthStack';
import { AppStackNavigator } from '@/navigation/AppStack';
import { useAuthStore } from '@/store/authStore';

const Stack = createStackNavigator();

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}