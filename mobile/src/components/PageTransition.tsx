import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PageTransitionProps {
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale' | 'amenities';
  duration?: number;
  onTransitionComplete?: () => void;
}

interface AmenityItem {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const amenities: AmenityItem[] = [
  { id: '1', name: 'Dashboard', icon: 'dashboard', color: '#22c55e' },
  { id: '2', name: 'Recipes', icon: 'restaurant', color: '#3b82f6' },
  { id: '3', name: 'Camera', icon: 'camera-alt', color: '#f59e0b' },
  { id: '4', name: 'Profile', icon: 'person', color: '#8b5cf6' },
  { id: '5', name: 'Settings', icon: 'settings', color: '#ef4444' },
];

export function PageTransition({ 
  children, 
  animationType = 'fade', 
  duration = 600,
  onTransitionComplete 
}: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [currentAmenity, setCurrentAmenity] = useState(0);
  
  // Animation values - use useRef to prevent recreation on every render
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Start the page transition animation
    if (animationType === 'amenities') {
      // Show amenities briefly then fade in
      timer = setTimeout(() => {
        startTransition();
      }, 800);
    } else {
      startTransition();
    }

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      // Stop any running animations
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      slideAnim.stopAnimation();
    };
  }, [animationType, fadeAnim, scaleAnim, slideAnim]);

  const startTransition = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsTransitioning(false);
      onTransitionComplete?.();
    });
  };

  if (!isTransitioning) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.transitionOverlay,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.loadingContainer}>
          {animationType === 'amenities' && (
            <View style={styles.amenitiesContainer}>
              {amenities.slice(0, 3).map((amenity, index) => (
                <View
                  key={amenity.id}
                  style={[
                    styles.amenityCard,
                    { backgroundColor: amenity.color },
                  ]}
                >
                  <MaterialIcons 
                    name={amenity.icon} 
                    size={24} 
                    color="white" 
                  />
                  <Text style={styles.amenityText}>{amenity.name}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* MacroLens logo/title */}
          <View style={styles.logoContainer}>
            <MaterialIcons name="restaurant" size={48} color={theme.colors.primary} />
            <Text style={styles.logoText}>MacroLens</Text>
            <Text style={styles.subtitle}>Loading your nutrition journey...</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Content that will fade in */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  amenityCard: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  amenityText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default PageTransition; 