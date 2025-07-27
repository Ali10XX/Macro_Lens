from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.nutrition_engine import nutrition_engine
from app.core.security import get_current_user

router = APIRouter()

class IngredientRequest(BaseModel):
    name: str
    quantity: float = 1.0
    unit: str = "cup"

class NutritionCalculationRequest(BaseModel):
    ingredients: List[IngredientRequest]
    servings: int = 1

class NutritionResponse(BaseModel):
    calories: float
    protein: float
    carbohydrates: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    cholesterol: float
    saturated_fat: float
    source: str
    confidence: float

@router.get("/ingredients/{ingredient_name}")
async def get_ingredient_nutrition(
    ingredient_name: str,
    quantity: float = 1.0,
    unit: str = "cup",
    current_user: dict = Depends(get_current_user)
):
    """
    Get nutrition information for a single ingredient
    """
    try:
        result = await nutrition_engine.get_ingredient_nutrition(
            ingredient_name, quantity, unit
        )
        
        return {
            "ingredient": {
                "name": result.name,
                "quantity": result.quantity,
                "unit": result.unit
            },
            "nutrition_per_100g": result.nutrition_per_100g.__dict__,
            "total_nutrition": result.total_nutrition.__dict__
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating nutrition: {str(e)}"
        )

@router.post("/calculate")
async def calculate_nutrition(
    request: NutritionCalculationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate nutrition for a recipe with multiple ingredients
    """
    try:
        # Convert request to ingredient list
        ingredients = [
            {
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit
            }
            for ing in request.ingredients
        ]
        
        # Calculate nutrition
        result = await nutrition_engine.calculate_recipe_nutrition(ingredients)
        
        # Adjust for servings
        if request.servings > 1:
            total_nutrition = result["total_nutrition"]
            for field in ["calories", "protein", "carbohydrates", "fat", "fiber", 
                         "sugar", "sodium", "cholesterol", "saturated_fat"]:
                setattr(total_nutrition, field, getattr(total_nutrition, field) / request.servings)
        
        return {
            "total_nutrition": result["total_nutrition"].__dict__,
            "per_serving": result["total_nutrition"].__dict__ if request.servings == 1 else {
                field: getattr(result["total_nutrition"], field) / request.servings
                for field in ["calories", "protein", "carbohydrates", "fat", "fiber", 
                             "sugar", "sodium", "cholesterol", "saturated_fat"]
            },
            "ingredient_breakdown": [
                {
                    "ingredient": ing.name,
                    "nutrition": ing.total_nutrition.__dict__
                }
                for ing in result["ingredient_nutritions"]
            ],
            "servings": request.servings,
            "calculation_method": result["calculation_method"],
            "confidence_score": result["confidence_score"],
            "calculated_at": result["calculated_at"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating nutrition: {str(e)}"
        )

@router.get("/recipes/{recipe_id}")
async def get_recipe_nutrition(
    recipe_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get nutrition information for a stored recipe
    """
    # TODO: Implement recipe storage and retrieval
    # This would integrate with the recipe database
    return {"message": f"Get nutrition for recipe {recipe_id}"}

@router.get("/search/usda/{query}")
async def search_usda_foods(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Search USDA database for food items
    """
    try:
        # This would use the USDA API search functionality
        # For now, return a placeholder
        return {
            "query": query,
            "results": [],
            "message": "USDA search functionality would be implemented here"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error searching USDA database: {str(e)}"
        )