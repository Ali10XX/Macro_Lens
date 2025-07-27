import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigation = useNavigation();

  useEffect(() => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Dashboard mounted. Auth state:', { user, isAuthenticated });
    if (!isAuthenticated) {
      console.log('mobile/src/screens/app/DashboardScreen.tsx: Not authenticated, redirecting to login');
      navigation.navigate('Login' as never);
    }
  }, [isAuthenticated, navigation, user]);

  const handleLogout = () => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Logout clicked');
    logout();
    navigation.navigate('Login' as never);
  };

  const handleAddRecipe = () => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Add Recipe clicked');
    navigation.navigate('AddRecipe' as never);
  };

  const handleLogMeal = () => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Log Meal clicked');
    Alert.alert('Log Meal', 'Log Meal functionality coming soon!');
  };

  const handleCreateMealPlan = () => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Create Meal Plan clicked');
    Alert.alert('Meal Plan', 'Meal Plan functionality coming soon!');
  };

  const handleTestClick = () => {
    console.log('mobile/src/screens/app/DashboardScreen.tsx: Test button clicked');
    Alert.alert('Test', 'Test button works!');
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.welcomeText}>
            Welcome back, {user.first_name || user.username}!
          </Text>
          <Text style={styles.subtitleText}>
            Track your nutrition and reach your goals
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Button
            mode="outlined"
            onPress={handleTestClick}
            style={styles.testButton}
            compact
          >
            Test
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            compact
          >
            Logout
          </Button>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statTitle}>Today's Calories</Title>
            <Text style={styles.statValue}>0 / 2000</Text>
            <Paragraph style={styles.statDescription}>calories consumed</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statTitle}>Recipes</Title>
            <Text style={styles.statValue}>0</Text>
            <Paragraph style={styles.statDescription}>recipes saved</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statTitle}>Meal Plans</Title>
            <Text style={styles.statValue}>0</Text>
            <Paragraph style={styles.statDescription}>active meal plans</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Title style={styles.quickActionsTitle}>Quick Actions</Title>
          <View style={styles.quickActionsGrid}>
            <Button
              mode="contained"
              onPress={handleAddRecipe}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Add Recipe
            </Button>
            <Button
              mode="outlined"
              onPress={handleLogMeal}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Log Meal
            </Button>
            <Button
              mode="outlined"
              onPress={handleCreateMealPlan}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Create Meal Plan
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Transform any recipe into perfect macro data with AI
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
  },
  logoutButton: {
    flex: 1,
  },
  statsGrid: {
    padding: 20,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 0,
  },
  quickActionsCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 