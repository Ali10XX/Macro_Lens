export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
  },
  USERS: {
    ME: '/api/v1/users/me',
    PREFERENCES: '/api/v1/users/me/preferences',
  },
  RECIPES: {
    BASE: '/api/v1/recipes',
    BY_ID: (id: string) => `/api/v1/recipes/${id}`,
    SEARCH: '/api/v1/recipes/search',
    UPLOAD: '/api/v1/recipes/upload',
  },
  NUTRITION: {
    INGREDIENT: (id: string) => `/api/v1/nutrition/ingredients/${id}`,
    RECIPE: (id: string) => `/api/v1/nutrition/recipes/${id}`,
    CALCULATE: '/api/v1/nutrition/calculate',
  },
  MEAL_PLANS: {
    BASE: '/api/v1/meal-plans',
    BY_ID: (id: string) => `/api/v1/meal-plans/${id}`,
  },
  IMPORTS: {
    SOCIAL_MEDIA: '/api/v1/imports/social-media',
    URL: '/api/v1/imports/url',
    JOBS: '/api/v1/imports/jobs',
    JOB_BY_ID: (id: string) => `/api/v1/imports/jobs/${id}`,
  },
};

export const MEAL_TYPES = [
  'breakfast',
  'lunch', 
  'dinner',
  'snack'
] as const;

export const DIFFICULTY_LEVELS = [
  'easy',
  'medium',
  'hard'
] as const;

export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate', 
  'active',
  'very_active'
] as const;

export const SOURCE_TYPES = [
  'manual',
  'url',
  'video',
  'image',
  'social_media'
] as const;

export const UNITS = {
  METRIC: {
    WEIGHT: ['g', 'kg'],
    VOLUME: ['ml', 'l'],
    LENGTH: ['cm', 'm'],
  },
  IMPERIAL: {
    WEIGHT: ['oz', 'lb'],
    VOLUME: ['fl oz', 'cup', 'pint', 'quart', 'gallon'],
    LENGTH: ['in', 'ft'],
  },
  COMMON: [
    'piece',
    'slice',
    'cup',
    'tbsp',
    'tsp',
    'clove',
    'can',
    'package',
    'bunch',
  ],
} as const;

export const NUTRITION_GOALS = {
  CALORIES_PER_KG: {
    SEDENTARY: 25,
    LIGHT: 30,
    MODERATE: 35,
    ACTIVE: 40,
    VERY_ACTIVE: 45,
  },
  PROTEIN_PERCENTAGE: {
    MIN: 0.15,
    MAX: 0.35,
  },
  CARB_PERCENTAGE: {
    MIN: 0.45,
    MAX: 0.65,
  },
  FAT_PERCENTAGE: {
    MIN: 0.20,
    MAX: 0.35,
  },
} as const;

export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  DOCUMENTS: ['application/pdf', 'text/plain'],
} as const;

export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 5 * 1024 * 1024, // 5MB
} as const;

export const SUPPORTED_RECIPE_DOMAINS = [
  'allrecipes.com',
  'food.com',
  'epicurious.com',
  'foodnetwork.com',
  'cookinglight.com',
  'bonappetit.com',
  'seriouseats.com',
  'tasteofhome.com',
  'delish.com',
  'eatingwell.com',
  'myrecipes.com',
  'simplyrecipes.com',
  'thekitchn.com',
  'yummly.com',
  'genius.kitchen',
] as const;