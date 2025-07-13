import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#22c55e',
    secondary: '#16a34a',
    accent: '#059669',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    onSurface: '#64748b',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
};