import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function AddRecipeScreen() {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [manualRecipe, setManualRecipe] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    servings: '1',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const { token } = useAuthStore();
  const navigation = useNavigation();

  // Import API config
  const { API_CONFIG } = require('../../config/api');
  const API_BASE_URL = API_CONFIG.BASE_URL;

  const handleBack = () => {
    console.log('mobile/src/screens/app/AddRecipeScreen.tsx: Back to dashboard');
    navigation.navigate('Dashboard' as never);
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('mobile/src/screens/app/AddRecipeScreen.tsx: Starting URL import');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/imports/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to import recipe from URL');
      }

      const data = await response.json();
      console.log('mobile/src/screens/app/AddRecipeScreen.tsx: URL import successful');
      setResult(data);
    } catch (err: any) {
      console.error('mobile/src/screens/app/AddRecipeScreen.tsx: URL import failed:', err.message);
      setError(err.message || 'Failed to import recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualRecipe.title.trim() || !manualRecipe.ingredients.trim()) {
      setError('Please fill in at least the title and ingredients');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('mobile/src/screens/app/AddRecipeScreen.tsx: Starting manual recipe creation');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: manualRecipe.title,
          ingredients: manualRecipe.ingredients.split('\n').filter(i => i.trim()),
          instructions: manualRecipe.instructions.split('\n').filter(i => i.trim()),
          servings: parseInt(manualRecipe.servings) || 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }

      const data = await response.json();
      console.log('mobile/src/screens/app/AddRecipeScreen.tsx: Manual recipe creation successful');
      setResult(data);
    } catch (err: any) {
      console.error('mobile/src/screens/app/AddRecipeScreen.tsx: Manual recipe creation failed:', err.message);
      setError(err.message || 'Failed to create recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndReturn = () => {
    console.log('mobile/src/screens/app/AddRecipeScreen.tsx: Save and return to dashboard');
    navigation.navigate('Dashboard' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Recipe</Text>
          <Text style={styles.subtitle}>Import from URL or enter manually</Text>
        </View>

        <View style={styles.content}>
          {/* Mode Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Choose Input Method</Title>
              <SegmentedButtons
                value={mode}
                onValueChange={(value) => setMode(value as 'url' | 'manual')}
                buttons={[
                  { value: 'url', label: 'Import from URL' },
                  { value: 'manual', label: 'Manual Entry' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {/* URL Import */}
          {mode === 'url' && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Import from URL</Title>
                <Paragraph style={styles.cardDescription}>
                  Paste a recipe URL and we'll extract the ingredients and nutrition info
                </Paragraph>
                
                <TextInput
                  label="Recipe URL"
                  mode="outlined"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="https://example.com/recipe"
                  style={styles.input}
                  multiline={false}
                />
                
                <Button
                  mode="contained"
                  onPress={handleUrlImport}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                >
                  {isLoading ? 'Importing...' : 'Import Recipe'}
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Manual Entry */}
          {mode === 'manual' && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Manual Recipe Entry</Title>
                <Paragraph style={styles.cardDescription}>
                  Enter your recipe details and we'll calculate the nutrition
                </Paragraph>
                
                <TextInput
                  label="Recipe Title"
                  mode="outlined"
                  value={manualRecipe.title}
                  onChangeText={(text) => setManualRecipe(prev => ({ ...prev, title: text }))}
                  placeholder="Delicious Pasta"
                  style={styles.input}
                />
                
                <TextInput
                  label="Servings"
                  mode="outlined"
                  value={manualRecipe.servings}
                  onChangeText={(text) => setManualRecipe(prev => ({ ...prev, servings: text }))}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                <TextInput
                  label="Ingredients (one per line)"
                  mode="outlined"
                  value={manualRecipe.ingredients}
                  onChangeText={(text) => setManualRecipe(prev => ({ ...prev, ingredients: text }))}
                  placeholder="2 cups pasta&#10;1 cup tomato sauce&#10;1/2 cup cheese"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                />
                
                <TextInput
                  label="Instructions (one per line)"
                  mode="outlined"
                  value={manualRecipe.instructions}
                  onChangeText={(text) => setManualRecipe(prev => ({ ...prev, instructions: text }))}
                  placeholder="Boil pasta according to package directions&#10;Heat sauce in pan&#10;Combine and add cheese"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                />
                
                <Button
                  mode="contained"
                  onPress={handleManualSubmit}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Recipe'}
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card style={[styles.card, styles.errorCard]}>
              <Card.Content>
                <Text style={styles.errorText}>{error}</Text>
              </Card.Content>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Recipe Analysis Results</Title>
                
                <View style={styles.nutritionGrid}>
                  <View style={[styles.nutritionCard, styles.caloriesCard]}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition?.calories || 'N/A'}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.proteinCard]}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition?.protein || 'N/A'}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.carbsCard]}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition?.carbohydrates || 'N/A'}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.fatCard]}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition?.fat || 'N/A'}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>

                {result.title && (
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeInfoTitle}>Recipe Title</Text>
                    <Text style={styles.recipeInfoText}>{result.title}</Text>
                  </View>
                )}

                {result.ingredients && (
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeInfoTitle}>Ingredients</Text>
                    {result.ingredients.map((ingredient: string, index: number) => (
                      <Text key={index} style={styles.ingredientText}>
                        • {ingredient}
                      </Text>
                    ))}
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={handleSaveAndReturn}
                  style={styles.saveButton}
                >
                  Save Recipe & Return to Dashboard
                </Button>
              </Card.Content>
            </Card>
          )}

          {!result && !error && (
            <Card style={[styles.card, styles.placeholderCard]}>
              <Card.Content>
                <View style={styles.placeholderContent}>
                  <Text style={styles.placeholderText}>
                    {mode === 'url' 
                      ? 'Enter a URL and click "Import Recipe" to see nutrition analysis'
                      : 'Fill in the recipe details and click "Analyze Recipe" to see nutrition breakdown'
                    }
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#22c55e',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#64748b',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    marginBottom: 16,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  submitButton: {
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  caloriesCard: {
    backgroundColor: '#dbeafe',
  },
  proteinCard: {
    backgroundColor: '#dcfce7',
  },
  carbsCard: {
    backgroundColor: '#fef3c7',
  },
  fatCard: {
    backgroundColor: '#fee2e2',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  recipeInfo: {
    marginBottom: 16,
  },
  recipeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recipeInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  ingredientText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 16,
  },
  placeholderCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
}); 