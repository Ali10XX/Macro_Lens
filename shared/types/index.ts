export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isPremium: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  dailyCalorieGoal?: number;
  dailyProteinGoal?: number;
  dailyCarbGoal?: number;
  dailyFatGoal?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryRestrictions: string[];
  autoImportEnabled: boolean;
  preferredUnits: 'metric' | 'imperial';
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string;
  instructions: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  cuisineType?: string;
  mealType?: string;
  sourceUrl?: string;
  sourceType: 'manual' | 'url' | 'video' | 'image' | 'social_media';
  extractionConfidence?: number;
  isPublic: boolean;
  autoImported: boolean;
  importTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  nutrition?: NutritionData;
  ratings?: RecipeRating[];
  tags?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  usdaFoodCode?: string;
  category?: string;
  densityGPerMl?: number;
  commonUnit?: string;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredient: Ingredient;
  quantity: number;
  unit: string;
  preparationNotes?: string;
  orderIndex: number;
  createdAt: string;
}

export interface NutritionData {
  id: string;
  ingredientId?: string;
  recipeId?: string;
  servingSizeG?: number;
  calories?: number;
  proteinG?: number;
  carbohydratesG?: number;
  fatG?: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  cholesterolMg?: number;
  vitaminAMcg?: number;
  vitaminCMg?: number;
  calciumMg?: number;
  ironMg?: number;
  dataSource: 'usda' | 'manual' | 'estimated';
  confidenceScore?: number;
  createdAt: string;
}

export interface RecipeRating {
  id: string;
  recipeId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  entries: MealPlanEntry[];
}

export interface MealPlanEntry {
  id: string;
  mealPlanId: string;
  recipeId: string;
  recipe: Recipe;
  plannedDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  createdAt: string;
}

export interface RecipeImportJob {
  id: string;
  userId: string;
  sourceUrl: string;
  socialMediaPostText?: string;
  jobStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  extractedRecipeId?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  createdAt: string;
}

export interface FileUpload {
  id: string;
  userId: string;
  recipeId?: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSizeBytes: number;
  filePath: string;
  uploadStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}