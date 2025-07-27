/**
 * API Service for MacroLens Mobile App
 * Handles all API communications with the backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { API_CONFIG } from '../config/api';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings: number;
  difficultyLevel: string;
  cuisineType?: string;
  mealType?: string;
  isPublic: boolean;
  autoImported: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients: Ingredient[];
  tags: string[];
  nutrition?: NutritionInfo;
  extractionConfidence?: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  preparationNotes?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  dataSource?: string;
  confidenceScore?: number;
}

export interface RecipeExtractionResult {
  recipeData: any;
  confidenceScore: number;
  sourceBreakdown: Record<string, number>;
  extractionTime: number;
  metadata: Record<string, any>;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

class APIService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.logout();
          Alert.alert('Session Expired', 'Please login again.');
        }
        return Promise.reject(error);
      }
    );
  }

  private async loadToken() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private async saveToken(token: string) {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      this.token = token;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private async removeToken() {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      this.token = null;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        '/auth/login',
        credentials
      );
      
      await this.saveToken(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        '/auth/register',
        credentials
      );
      
      await this.saveToken(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw new Error('Failed to get user information.');
    }
  }

  // Recipes
  async getRecipes(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    mealType?: string;
    difficultyLevel?: string;
  }): Promise<{ recipes: Recipe[]; total: number }> {
    try {
      const response = await this.axiosInstance.get('/recipes', { params });
      return response.data;
    } catch (error) {
      console.error('Get recipes error:', error);
      throw new Error('Failed to fetch recipes.');
    }
  }

  async getRecipe(id: string): Promise<Recipe> {
    try {
      const response: AxiosResponse<Recipe> = await this.axiosInstance.get(`/recipes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get recipe error:', error);
      throw new Error('Failed to fetch recipe.');
    }
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    try {
      const response: AxiosResponse<Recipe> = await this.axiosInstance.post('/recipes', recipe);
      return response.data;
    } catch (error) {
      console.error('Create recipe error:', error);
      throw new Error('Failed to create recipe.');
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
    try {
      const response: AxiosResponse<Recipe> = await this.axiosInstance.put(`/recipes/${id}`, recipe);
      return response.data;
    } catch (error) {
      console.error('Update recipe error:', error);
      throw new Error('Failed to update recipe.');
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/recipes/${id}`);
    } catch (error) {
      console.error('Delete recipe error:', error);
      throw new Error('Failed to delete recipe.');
    }
  }

  async searchRecipes(query: string, publicOnly: boolean = true): Promise<{ recipes: Recipe[] }> {
    try {
      const response = await this.axiosInstance.get('/recipes/search', {
        params: { q: query, public_only: publicOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Search recipes error:', error);
      throw new Error('Failed to search recipes.');
    }
  }

  // Recipe Extraction
  async extractRecipeFromVideo(videoUri: string): Promise<RecipeExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('video_file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'recipe_video.mp4',
      } as any);

      const response = await this.axiosInstance.post('/recipes/extract/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for video processing
      });

      return response.data;
    } catch (error) {
      console.error('Extract recipe from video error:', error);
      throw new Error('Failed to extract recipe from video.');
    }
  }

  async extractRecipeFromText(text: string): Promise<RecipeExtractionResult> {
    try {
      const response = await this.axiosInstance.post('/recipes/extract/text', { text });
      return response.data;
    } catch (error) {
      console.error('Extract recipe from text error:', error);
      throw new Error('Failed to extract recipe from text.');
    }
  }

  async saveExtractedRecipe(extractionResult: RecipeExtractionResult): Promise<Recipe> {
    try {
      const response: AxiosResponse<Recipe> = await this.axiosInstance.post(
        '/recipes/extract/save',
        extractionResult
      );
      return response.data;
    } catch (error) {
      console.error('Save extracted recipe error:', error);
      throw new Error('Failed to save extracted recipe.');
    }
  }

  // Nutrition
  async calculateNutrition(ingredients: Ingredient[], servings: number = 1): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/nutrition/calculate', {
        ingredients,
        servings
      });
      return response.data;
    } catch (error) {
      console.error('Calculate nutrition error:', error);
      throw new Error('Failed to calculate nutrition.');
    }
  }

  async getIngredientNutrition(name: string, quantity: number = 1, unit: string = 'cup'): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/nutrition/ingredients/${name}`, {
        params: { quantity, unit }
      });
      return response.data;
    } catch (error) {
      console.error('Get ingredient nutrition error:', error);
      throw new Error('Failed to get ingredient nutrition.');
    }
  }

  // Recipe Ratings
  async addRecipeRating(recipeId: string, rating: number, reviewText?: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/recipes/${recipeId}/ratings`, {
        rating,
        review_text: reviewText
      });
      return response.data;
    } catch (error) {
      console.error('Add recipe rating error:', error);
      throw new Error('Failed to add recipe rating.');
    }
  }

  async getRecipeRatings(recipeId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/recipes/${recipeId}/ratings`);
      return response.data;
    } catch (error) {
      console.error('Get recipe ratings error:', error);
      throw new Error('Failed to get recipe ratings.');
    }
  }

  // Utility
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;