import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the API URL based on environment and platform
const getApiUrl = (): string => {
  // Check for environment variable first
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Development URLs
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // For WSL, use the WSL IP address instead of 10.0.2.2
      return 'http://172.19.214.71:8000';
    } else if (Platform.OS === 'ios') {
      // For WSL, use the WSL IP address instead of localhost
      return 'http://172.19.214.71:8000';
    } else {
      // Web fallback - also use WSL IP
      return 'http://172.19.214.71:8000';
    }
  }

  // Production URL - should be set via environment variables
  return Constants.expoConfig?.extra?.apiUrl || 'https://your-production-api.com';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
} as const;

// Log the API URL for debugging (only in development)
if (__DEV__) {
  console.log(`📡 API Base URL: ${API_CONFIG.BASE_URL}`);
  console.log(`📱 Platform: ${Platform.OS}`);
}