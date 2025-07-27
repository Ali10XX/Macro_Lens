import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { PageTransition } from '@/components/PageTransition';
import { apiService, Recipe } from '@/services/api';

export function RecipesScreen({ navigation }: any) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [search, recipes]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const result = await apiService.getRecipes({ limit: 50 });
      setRecipes(result.recipes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes. Please try again.');
      console.error('Load recipes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  const filterRecipes = () => {
    if (!search.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(search.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(search.toLowerCase()) ||
      recipe.cuisineType?.toLowerCase().includes(search.toLowerCase()) ||
      recipe.mealType?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredRecipes(filtered);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteRecipe(recipeId);
              setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
              Alert.alert('Success', 'Recipe deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getRecipeIcon = (mealType?: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast':
        return 'free-breakfast';
      case 'lunch':
        return 'lunch-dining';
      case 'dinner':
        return 'dinner-dining';
      case 'dessert':
        return 'cake';
      case 'snack':
        return 'cookie';
      default:
        return 'restaurant';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <PageTransition animationType="scale" duration={600}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Recipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddRecipe')}>
            <MaterialIcons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.onSurface} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={theme.colors.onSurface}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant" size={64} color={theme.colors.onSurface} />
              <Text style={styles.emptyStateText}>
                {search.length > 0 ? 'No recipes found' : 'No recipes yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {search.length > 0 
                  ? 'Try a different search term' 
                  : 'Add your first recipe by tapping the + button'
                }
              </Text>
            </View>
          ) : (
            filteredRecipes.map((recipe) => (
              <TouchableOpacity 
                key={recipe.id} 
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
              >
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeIcon}>
                    <MaterialIcons 
                      name={getRecipeIcon(recipe.mealType) as any} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.title}</Text>
                    <View style={styles.recipeMetadata}>
                      <Text style={styles.recipeTime}>
                        {formatTime(recipe.totalTimeMinutes)}
                      </Text>
                      {recipe.cuisineType && (
                        <>
                          <Text style={styles.metadataDot}>•</Text>
                          <Text style={styles.recipeCuisine}>{recipe.cuisineType}</Text>
                        </>
                      )}
                      {recipe.difficultyLevel && (
                        <>
                          <Text style={styles.metadataDot}>•</Text>
                          <Text style={styles.recipeDifficulty}>{recipe.difficultyLevel}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRecipe(recipe.id)}
                  >
                    <MaterialIcons name="delete" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                
                {recipe.nutrition && (
                  <View style={styles.macros}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(recipe.nutrition.protein)}g</Text>
                      <Text style={styles.macroLabel}>Protein</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(recipe.nutrition.carbohydrates)}g</Text>
                      <Text style={styles.macroLabel}>Carbs</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(recipe.nutrition.fat)}g</Text>
                      <Text style={styles.macroLabel}>Fats</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{Math.round(recipe.nutrition.calories)}</Text>
                      <Text style={styles.macroLabel}>Calories</Text>
                    </View>
                  </View>
                )}

                {recipe.autoImported && (
                  <View style={styles.autoImportedBadge}>
                    <MaterialIcons name="auto-awesome" size={12} color={theme.colors.primary} />
                    <Text style={styles.autoImportedText}>Auto-imported</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  recipeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  recipeMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recipeTime: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  recipeCuisine: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  recipeDifficulty: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textTransform: 'capitalize',
  },
  metadataDot: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginHorizontal: 6,
  },
  deleteButton: {
    padding: 8,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  macroLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  autoImportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  autoImportedText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
}); 