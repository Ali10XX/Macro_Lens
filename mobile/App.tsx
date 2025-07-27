import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from './src/store/authStore';
import AppStack from './src/navigation/AppStack';
import AuthStack from './src/navigation/AuthStack';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import { logInfo, logError } from './src/utils/logger';
import { runFullNetworkDiagnostic } from './src/utils/networkCheck';

const paperTheme = {
  colors: {
    primary: '#22c55e',
    accent: '#22c55e',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    onSurface: '#64748b',
    placeholder: '#9ca3af',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export default function App() {
  const { isAuthenticated, hasCompletedOnboarding, shouldSkipLogin, incrementLoginCount, checkAuth, checkOnboardingStatus } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) return;

    const initializeApp = async () => {
      try {
        await logInfo('APP', 'Initializing app');
        
        // Run network diagnostic in development
        // if (__DEV__) {
        //   await runFullNetworkDiagnostic();
        // }
        
        await logInfo('APP', 'Checking auth status');
        await checkAuth();
        await logInfo('APP', 'Auth check completed');
        
        setHasInitialized(true);
      } catch (error) {
        await logError('APP', 'App initialization failed', error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []); // Remove dependencies to prevent re-runs

  // Separate effect for checking onboarding status after auth is determined
  useEffect(() => {
    if (hasInitialized && isAuthenticated && !hasCompletedOnboarding) {
      const checkOnboarding = async () => {
        try {
          await logInfo('APP', 'User is authenticated, checking onboarding status');
          await checkOnboardingStatus();
        } catch (error) {
          await logError('APP', 'Onboarding check failed', error as Error);
        }
      };
      
      checkOnboarding();
    }
  }, [hasInitialized, isAuthenticated, hasCompletedOnboarding, checkOnboardingStatus]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
      </View>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }
    
    if (isAuthenticated && !hasCompletedOnboarding) {
      return <OnboardingScreen />;
    }
    
    return <AppStack />;
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {renderContent()}
          <Toast />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});