"""
Nutrition Engine Service
USDA API integration + ML estimation + calculation engine
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import re
from functools import lru_cache
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

from app.core.config import settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

@dataclass
class NutritionData:
    """Structured nutrition information"""
    calories: float
    protein: float  # grams
    carbohydrates: float  # grams
    fat: float  # grams
    fiber: float  # grams
    sugar: float  # grams
    sodium: float  # mg
    cholesterol: float  # mg
    saturated_fat: float  # grams
    source: str  # "usda", "estimated", "calculated"
    confidence: float  # 0-1

@dataclass
class IngredientNutrition:
    """Nutrition data for a single ingredient"""
    name: str
    quantity: float
    unit: str
    nutrition_per_100g: NutritionData
    total_nutrition: NutritionData

class NutritionEngine:
    """
    Comprehensive nutrition calculation engine with USDA API and ML estimation
    """
    
    def __init__(self):
        self.usda_api_key = settings.USDA_API_KEY
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"
        
        self.api_ninjas_key = settings.API_NINJAS_KEY
        self.api_ninjas_base_url = "https://api.api-ninjas.com/v1/nutrition"
        
        self.spoonacular_api_key = settings.SPOONACULAR_API_KEY
        self.spoonacular_base_url = "https://api.spoonacular.com/food"
        
        self.cache_ttl = 3600 * 24  # 24 hours
        self.confidence_threshold = 0.7
        
        # Initialize ML model for nutrition estimation
        self.ml_model = None
        self.vectorizer = None
        self._load_ml_model()
    
    async def calculate_recipe_nutrition(self, ingredients: List[Dict]) -> Dict:
        """
        Calculate complete nutrition for a recipe
        ingredients: [{"name": str, "quantity": float, "unit": str}]
        """
        ingredient_nutritions = []
        total_nutrition = NutritionData(
            calories=0, protein=0, carbohydrates=0, fat=0, fiber=0,
            sugar=0, sodium=0, cholesterol=0, saturated_fat=0,
            source="calculated", confidence=0
        )
        
        confidence_scores = []
        
        for ingredient in ingredients:
            try:
                # Get nutrition for individual ingredient
                ingredient_nutrition = await self.get_ingredient_nutrition(
                    ingredient["name"], 
                    ingredient.get("quantity", 1),
                    ingredient.get("unit", "cup")
                )
                
                ingredient_nutritions.append(ingredient_nutrition)
                
                # Add to total
                total_nutrition.calories += ingredient_nutrition.total_nutrition.calories
                total_nutrition.protein += ingredient_nutrition.total_nutrition.protein
                total_nutrition.carbohydrates += ingredient_nutrition.total_nutrition.carbohydrates
                total_nutrition.fat += ingredient_nutrition.total_nutrition.fat
                total_nutrition.fiber += ingredient_nutrition.total_nutrition.fiber
                total_nutrition.sugar += ingredient_nutrition.total_nutrition.sugar
                total_nutrition.sodium += ingredient_nutrition.total_nutrition.sodium
                total_nutrition.cholesterol += ingredient_nutrition.total_nutrition.cholesterol
                total_nutrition.saturated_fat += ingredient_nutrition.total_nutrition.saturated_fat
                
                confidence_scores.append(ingredient_nutrition.total_nutrition.confidence)
                
            except Exception as e:
                logger.error(f"Error calculating nutrition for {ingredient['name']}: {str(e)}")
                # Use fallback estimation
                fallback_nutrition = self._estimate_nutrition_fallback(ingredient["name"])
                confidence_scores.append(0.3)  # Low confidence for fallback
        
        # Calculate overall confidence
        total_nutrition.confidence = np.mean(confidence_scores) if confidence_scores else 0.0
        
        return {
            "total_nutrition": total_nutrition,
            "ingredient_nutritions": ingredient_nutritions,
            "calculation_method": "usda_api_ml_hybrid",
            "confidence_score": total_nutrition.confidence,
            "calculated_at": datetime.now().isoformat()
        }
    
    async def get_ingredient_nutrition(self, ingredient_name: str, quantity: float, unit: str) -> IngredientNutrition:
        """
        Get nutrition data for a single ingredient with quantity conversion
        """
        # Check cache first
        cache_key = f"nutrition:{ingredient_name}:{quantity}:{unit}"
        cached_data = await self._get_from_cache(cache_key)
        
        if cached_data:
            return IngredientNutrition(**cached_data)
        
        # Try multiple APIs in order of preference
        nutrition_data = None
        
        # 1. Try API Ninjas first (fastest response)
        if self.api_ninjas_key:
            nutrition_data = await self._get_api_ninjas_nutrition(ingredient_name)
        
        # 2. Try Spoonacular if API Ninjas fails
        if not nutrition_data and self.spoonacular_api_key:
            nutrition_data = await self._get_spoonacular_nutrition(ingredient_name)
        
        # 3. Try USDA as backup
        if not nutrition_data and self.usda_api_key:
            nutrition_data = await self._get_usda_nutrition(ingredient_name)
        
        # 4. Use ML estimation as final fallback
        if not nutrition_data or nutrition_data.confidence < self.confidence_threshold:
            nutrition_data = await self._estimate_nutrition_ml(ingredient_name)
        
        # Convert to requested quantity/unit
        total_nutrition = self._convert_nutrition_to_quantity(
            nutrition_data, quantity, unit, ingredient_name
        )
        
        result = IngredientNutrition(
            name=ingredient_name,
            quantity=quantity,
            unit=unit,
            nutrition_per_100g=nutrition_data,
            total_nutrition=total_nutrition
        )
        
        # Cache result
        await self._save_to_cache(cache_key, result.__dict__)
        
        return result
    
    async def _get_usda_nutrition(self, ingredient_name: str) -> Optional[NutritionData]:
        """
        Get nutrition data from USDA FoodData Central API
        """
        try:
            # Search for food item
            search_url = f"{self.usda_base_url}/foods/search"
            search_params = {
                "api_key": self.usda_api_key,
                "query": ingredient_name,
                "pageSize": 5,
                "dataType": ["Foundation", "SR Legacy"]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, params=search_params) as response:
                    if response.status != 200:
                        logger.warning(f"USDA search failed for {ingredient_name}")
                        return None
                    
                    search_data = await response.json()
                    
                    if not search_data.get("foods"):
                        logger.info(f"No USDA data found for {ingredient_name}")
                        return None
                    
                    # Get the most relevant food item
                    best_match = self._find_best_usda_match(search_data["foods"], ingredient_name)
                    
                    if not best_match:
                        return None
                    
                    # Get detailed nutrition data
                    food_id = best_match["fdcId"]
                    detail_url = f"{self.usda_base_url}/food/{food_id}"
                    detail_params = {"api_key": self.usda_api_key}
                    
                    async with session.get(detail_url, params=detail_params) as detail_response:
                        if detail_response.status != 200:
                            return None
                        
                        food_data = await detail_response.json()
                        
                        # Extract nutrition data
                        nutrition = self._extract_usda_nutrition(food_data)
                        nutrition.source = "usda"
                        nutrition.confidence = 0.9  # High confidence for USDA data
                        
                        return nutrition
        
        except Exception as e:
            logger.error(f"USDA API error for {ingredient_name}: {str(e)}")
            return None
    
    async def _get_api_ninjas_nutrition(self, ingredient_name: str) -> Optional[NutritionData]:
        """
        Get nutrition data from API Ninjas
        """
        try:
            headers = {
                'X-Api-Key': self.api_ninjas_key
            }
            
            params = {
                'query': ingredient_name
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.api_ninjas_base_url, headers=headers, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"API Ninjas request failed for {ingredient_name}")
                        return None
                    
                    data = await response.json()
                    
                    if not data or not isinstance(data, list) or len(data) == 0:
                        logger.info(f"No API Ninjas data found for {ingredient_name}")
                        return None
                    
                    # Use first result
                    food_data = data[0]
                    
                    return NutritionData(
                        calories=food_data.get('calories', 0),
                        protein=food_data.get('protein_g', 0),
                        carbohydrates=food_data.get('carbohydrates_total_g', 0),
                        fat=food_data.get('fat_total_g', 0),
                        fiber=food_data.get('fiber_g', 0),
                        sugar=food_data.get('sugar_g', 0),
                        sodium=food_data.get('sodium_mg', 0),
                        cholesterol=food_data.get('cholesterol_mg', 0),
                        saturated_fat=food_data.get('fat_saturated_g', 0),
                        source="api_ninjas",
                        confidence=0.85
                    )
                    
        except Exception as e:
            logger.error(f"API Ninjas error for {ingredient_name}: {str(e)}")
            return None
    
    async def _get_spoonacular_nutrition(self, ingredient_name: str) -> Optional[NutritionData]:
        """
        Get nutrition data from Spoonacular API
        """
        try:
            # Search for ingredient first
            search_url = f"{self.spoonacular_base_url}/ingredients/search"
            search_params = {
                'apiKey': self.spoonacular_api_key,
                'query': ingredient_name,
                'number': 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, params=search_params) as search_response:
                    if search_response.status != 200:
                        logger.warning(f"Spoonacular search failed for {ingredient_name}")
                        return None
                    
                    search_data = await search_response.json()
                    
                    if not search_data.get('results'):
                        logger.info(f"No Spoonacular data found for {ingredient_name}")
                        return None
                    
                    ingredient_id = search_data['results'][0]['id']
                    
                    # Get nutrition data
                    nutrition_url = f"{self.spoonacular_base_url}/ingredients/{ingredient_id}/information"
                    nutrition_params = {
                        'apiKey': self.spoonacular_api_key,
                        'amount': 100,
                        'unit': 'grams'
                    }
                    
                    async with session.get(nutrition_url, params=nutrition_params) as nutrition_response:
                        if nutrition_response.status != 200:
                            return None
                        
                        nutrition_data = await nutrition_response.json()
                        nutrition_info = nutrition_data.get('nutrition', {})
                        
                        # Extract nutrients
                        nutrients = {n['name'].lower(): n['amount'] for n in nutrition_info.get('nutrients', [])}
                        
                        return NutritionData(
                            calories=nutrients.get('calories', 0),
                            protein=nutrients.get('protein', 0),
                            carbohydrates=nutrients.get('carbohydrates', 0),
                            fat=nutrients.get('fat', 0),
                            fiber=nutrients.get('fiber', 0),
                            sugar=nutrients.get('sugar', 0),
                            sodium=nutrients.get('sodium', 0) / 1000,  # Convert mg to g
                            cholesterol=nutrients.get('cholesterol', 0),
                            saturated_fat=nutrients.get('saturated fat', 0),
                            source="spoonacular",
                            confidence=0.8
                        )
                        
        except Exception as e:
            logger.error(f"Spoonacular API error for {ingredient_name}: {str(e)}")
            return None
    
    def _find_best_usda_match(self, foods: List[Dict], ingredient_name: str) -> Optional[Dict]:
        """
        Find the best matching food item from USDA search results
        """
        ingredient_lower = ingredient_name.lower()
        
        # Score each food item
        best_match = None
        best_score = 0
        
        for food in foods:
            description = food.get("description", "").lower()
            
            # Simple scoring based on word matching
            score = 0
            ingredient_words = ingredient_lower.split()
            
            for word in ingredient_words:
                if word in description:
                    score += 1
            
            # Prefer exact matches
            if ingredient_lower in description:
                score += 5
            
            # Prefer Foundation Foods over SR Legacy
            if food.get("dataType") == "Foundation":
                score += 1
            
            if score > best_score:
                best_score = score
                best_match = food
        
        return best_match if best_score > 0 else None
    
    def _extract_usda_nutrition(self, food_data: Dict) -> NutritionData:
        """
        Extract nutrition data from USDA food detail response
        """
        nutrients = food_data.get("foodNutrients", [])
        
        # Map USDA nutrient IDs to our nutrition data
        nutrient_mapping = {
            1008: "calories",      # Energy
            1003: "protein",       # Protein
            1005: "carbohydrates", # Carbohydrate, by difference
            1004: "fat",           # Total lipid (fat)
            1079: "fiber",         # Fiber, total dietary
            2000: "sugar",         # Total Sugars
            1093: "sodium",        # Sodium, Na
            1253: "cholesterol",   # Cholesterol
            1258: "saturated_fat"  # Fatty acids, total saturated
        }
        
        nutrition_values = {}
        
        for nutrient in nutrients:
            nutrient_id = nutrient.get("nutrient", {}).get("id")
            if nutrient_id in nutrient_mapping:
                field_name = nutrient_mapping[nutrient_id]
                amount = nutrient.get("amount", 0)
                nutrition_values[field_name] = amount
        
        return NutritionData(
            calories=nutrition_values.get("calories", 0),
            protein=nutrition_values.get("protein", 0),
            carbohydrates=nutrition_values.get("carbohydrates", 0),
            fat=nutrition_values.get("fat", 0),
            fiber=nutrition_values.get("fiber", 0),
            sugar=nutrition_values.get("sugar", 0),
            sodium=nutrition_values.get("sodium", 0),
            cholesterol=nutrition_values.get("cholesterol", 0),
            saturated_fat=nutrition_values.get("saturated_fat", 0),
            source="usda",
            confidence=0.9
        )
    
    async def _estimate_nutrition_ml(self, ingredient_name: str) -> NutritionData:
        """
        Estimate nutrition using ML model when USDA data is not available
        """
        if not self.ml_model:
            # Use simple heuristic estimation
            return self._estimate_nutrition_heuristic(ingredient_name)
        
        try:
            # Vectorize ingredient name
            ingredient_vector = self.vectorizer.transform([ingredient_name])
            
            # Predict nutrition values
            predictions = self.ml_model.predict(ingredient_vector)
            
            return NutritionData(
                calories=max(0, predictions[0][0]),
                protein=max(0, predictions[0][1]),
                carbohydrates=max(0, predictions[0][2]),
                fat=max(0, predictions[0][3]),
                fiber=max(0, predictions[0][4]),
                sugar=max(0, predictions[0][5]),
                sodium=max(0, predictions[0][6]),
                cholesterol=max(0, predictions[0][7]),
                saturated_fat=max(0, predictions[0][8]),
                source="estimated",
                confidence=0.6
            )
            
        except Exception as e:
            logger.error(f"ML estimation failed for {ingredient_name}: {str(e)}")
            return self._estimate_nutrition_heuristic(ingredient_name)
    
    def _estimate_nutrition_heuristic(self, ingredient_name: str) -> NutritionData:
        """
        Heuristic-based nutrition estimation using food categories
        """
        ingredient_lower = ingredient_name.lower()
        
        # Food category patterns and their typical nutrition per 100g
        food_categories = {
            "protein": {
                "patterns": ["chicken", "beef", "pork", "fish", "turkey", "lamb", "meat"],
                "nutrition": NutritionData(165, 25, 0, 7, 0, 0, 70, 55, 2.5, "estimated", 0.5)
            },
            "dairy": {
                "patterns": ["milk", "cheese", "yogurt", "butter", "cream"],
                "nutrition": NutritionData(150, 8, 12, 8, 0, 12, 100, 25, 5, "estimated", 0.5)
            },
            "grains": {
                "patterns": ["rice", "pasta", "bread", "flour", "oats", "quinoa"],
                "nutrition": NutritionData(130, 4, 25, 1, 2, 1, 5, 0, 0.2, "estimated", 0.5)
            },
            "vegetables": {
                "patterns": ["carrot", "broccoli", "spinach", "tomato", "pepper", "onion"],
                "nutrition": NutritionData(25, 2, 5, 0.2, 3, 3, 10, 0, 0.1, "estimated", 0.5)
            },
            "fruits": {
                "patterns": ["apple", "banana", "orange", "berry", "grape", "peach"],
                "nutrition": NutritionData(50, 1, 13, 0.2, 2, 10, 2, 0, 0.1, "estimated", 0.5)
            },
            "oils": {
                "patterns": ["oil", "olive oil", "vegetable oil", "coconut oil"],
                "nutrition": NutritionData(884, 0, 0, 100, 0, 0, 0, 0, 15, "estimated", 0.5)
            }
        }
        
        # Find matching category
        for category, data in food_categories.items():
            if any(pattern in ingredient_lower for pattern in data["patterns"]):
                return data["nutrition"]
        
        # Default fallback
        return NutritionData(100, 3, 15, 2, 1, 5, 50, 5, 0.5, "estimated", 0.3)
    
    def _convert_nutrition_to_quantity(self, nutrition_per_100g: NutritionData, 
                                     quantity: float, unit: str, ingredient_name: str) -> NutritionData:
        """
        Convert nutrition data from per 100g to specified quantity/unit
        """
        # Unit conversion factors to grams
        unit_conversions = {
            "g": 1,
            "gram": 1,
            "grams": 1,
            "kg": 1000,
            "kilogram": 1000,
            "oz": 28.35,
            "ounce": 28.35,
            "lb": 453.59,
            "pound": 453.59,
            "cup": 240,  # approximate for liquids
            "tbsp": 15,
            "tablespoon": 15,
            "tsp": 5,
            "teaspoon": 5,
            "ml": 1,     # approximate for liquids
            "liter": 1000,
            "l": 1000
        }
        
        # Get conversion factor
        unit_lower = unit.lower()
        grams_per_unit = unit_conversions.get(unit_lower, 100)  # Default to 100g
        
        # Special handling for cups (varies by ingredient)
        if unit_lower in ["cup", "cups"]:
            grams_per_unit = self._estimate_cup_weight(ingredient_name)
        
        # Calculate total grams
        total_grams = quantity * grams_per_unit
        
        # Convert nutrition values
        multiplier = total_grams / 100.0
        
        return NutritionData(
            calories=nutrition_per_100g.calories * multiplier,
            protein=nutrition_per_100g.protein * multiplier,
            carbohydrates=nutrition_per_100g.carbohydrates * multiplier,
            fat=nutrition_per_100g.fat * multiplier,
            fiber=nutrition_per_100g.fiber * multiplier,
            sugar=nutrition_per_100g.sugar * multiplier,
            sodium=nutrition_per_100g.sodium * multiplier,
            cholesterol=nutrition_per_100g.cholesterol * multiplier,
            saturated_fat=nutrition_per_100g.saturated_fat * multiplier,
            source=nutrition_per_100g.source,
            confidence=nutrition_per_100g.confidence
        )
    
    def _estimate_cup_weight(self, ingredient_name: str) -> float:
        """
        Estimate weight of one cup for different ingredients
        """
        ingredient_lower = ingredient_name.lower()
        
        # Common cup weights in grams
        cup_weights = {
            "flour": 120,
            "sugar": 200,
            "brown sugar": 213,
            "butter": 227,
            "milk": 240,
            "water": 240,
            "rice": 185,
            "pasta": 100,
            "breadcrumbs": 108,
            "oats": 80,
            "coconut": 80,
            "nuts": 140,
            "chocolate": 175
        }
        
        for ingredient, weight in cup_weights.items():
            if ingredient in ingredient_lower:
                return weight
        
        return 240  # Default liquid measurement
    
    def _estimate_nutrition_fallback(self, ingredient_name: str) -> NutritionData:
        """
        Fallback nutrition estimation for failed lookups
        """
        return NutritionData(
            calories=50, protein=2, carbohydrates=8, fat=1,
            fiber=1, sugar=3, sodium=20, cholesterol=0,
            saturated_fat=0.3, source="fallback", confidence=0.2
        )
    
    def _load_ml_model(self):
        """
        Load pre-trained ML model for nutrition estimation
        """
        try:
            model_path = "models/nutrition_model.pkl"
            vectorizer_path = "models/nutrition_vectorizer.pkl"
            
            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                with open(model_path, 'rb') as f:
                    self.ml_model = pickle.load(f)
                with open(vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                logger.info("ML nutrition model loaded successfully")
            else:
                logger.info("ML nutrition model not found, using heuristic estimation")
                
        except Exception as e:
            logger.error(f"Failed to load ML model: {str(e)}")
            self.ml_model = None
            self.vectorizer = None
    
    async def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Get data from Redis cache"""
        try:
            cached_data = await redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
        return None
    
    async def _save_to_cache(self, key: str, data: Dict):
        """Save data to Redis cache"""
        try:
            await redis_client.setex(key, self.cache_ttl, json.dumps(data, default=str))
        except Exception as e:
            logger.error(f"Cache save error: {str(e)}")

# Global instance
nutrition_engine = NutritionEngine()