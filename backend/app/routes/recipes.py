from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
import tempfile
import os
from uuid import UUID
from app.services.recipe_extraction import recipe_extractor
from app.services.recipe_service import recipe_service
from app.core.security import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class IngredientCreate(BaseModel):
    name: str
    quantity: float = 1.0
    unit: str = "cup"
    preparation_notes: Optional[str] = None

class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: str
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: int = 1
    difficulty_level: str = "medium"
    cuisine_type: Optional[str] = None
    meal_type: Optional[str] = None
    source_url: Optional[str] = None
    is_public: bool = False
    ingredients: List[IngredientCreate] = []
    tags: List[str] = []

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    difficulty_level: Optional[str] = None
    cuisine_type: Optional[str] = None
    meal_type: Optional[str] = None
    source_url: Optional[str] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[IngredientCreate]] = None
    tags: Optional[List[str]] = None

class RecipeRatingCreate(BaseModel):
    rating: int
    review_text: Optional[str] = None

class NutritionInfo(BaseModel):
    calories: int
    protein: float
    carbohydrates: float
    fat: float
    fiber: float
    sugar: float

class RecipeResponse(BaseModel):
    id: str
    title: str
    ingredients: List[str]
    instructions: List[str]
    servings: int
    nutrition: NutritionInfo

class RecipeExtractionResponse(BaseModel):
    recipe_data: Dict[str, Any]
    confidence_score: float
    source_breakdown: Dict[str, float]
    extraction_time: float
    metadata: Dict[str, Any]
    
class TextExtractionRequest(BaseModel):
    text: str

@router.get("/")
async def get_recipes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    meal_type: Optional[str] = Query(None),
    difficulty_level: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's recipes with filtering and pagination
    """
    try:
        recipes = await recipe_service.get_user_recipes(
            user_id=UUID(current_user["id"]),
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            meal_type=meal_type,
            difficulty_level=difficulty_level
        )
        
        return {
            "recipes": [
                {
                    "id": str(recipe.id),
                    "title": recipe.title,
                    "description": recipe.description,
                    "prep_time_minutes": recipe.prep_time_minutes,
                    "cook_time_minutes": recipe.cook_time_minutes,
                    "total_time_minutes": recipe.total_time_minutes,
                    "servings": recipe.servings,
                    "difficulty_level": recipe.difficulty_level,
                    "cuisine_type": recipe.cuisine_type,
                    "meal_type": recipe.meal_type,
                    "is_public": recipe.is_public,
                    "auto_imported": recipe.auto_imported,
                    "created_at": recipe.created_at.isoformat(),
                    "ingredients_count": len(recipe.ingredients),
                    "tags": [tag.tag_name for tag in recipe.tags],
                    "nutrition": {
                        "calories": recipe.nutrition_data[0].calories if recipe.nutrition_data else 0,
                        "protein": recipe.nutrition_data[0].protein_g if recipe.nutrition_data else 0,
                        "carbohydrates": recipe.nutrition_data[0].carbohydrates_g if recipe.nutrition_data else 0,
                        "fat": recipe.nutrition_data[0].fat_g if recipe.nutrition_data else 0
                    } if recipe.nutrition_data else None
                }
                for recipe in recipes
            ],
            "total": len(recipes),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipes: {str(e)}")

@router.post("/")
async def create_recipe(
    recipe: RecipeCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new recipe with ingredients and automatic nutrition calculation
    """
    try:
        # Convert ingredients to dict format
        ingredients_data = [
            {
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "preparation_notes": ing.preparation_notes
            }
            for ing in recipe.ingredients
        ]
        
        # Create recipe data
        recipe_data = {
            "title": recipe.title,
            "description": recipe.description,
            "instructions": recipe.instructions,
            "prep_time_minutes": recipe.prep_time_minutes,
            "cook_time_minutes": recipe.cook_time_minutes,
            "servings": recipe.servings,
            "difficulty_level": recipe.difficulty_level,
            "cuisine_type": recipe.cuisine_type,
            "meal_type": recipe.meal_type,
            "source_url": recipe.source_url,
            "is_public": recipe.is_public,
            "ingredients": ingredients_data,
            "tags": recipe.tags
        }
        
        # Create recipe
        created_recipe = await recipe_service.create_recipe(
            user_id=UUID(current_user["id"]),
            recipe_data=recipe_data,
            db=db
        )
        
        return {
            "id": str(created_recipe.id),
            "title": created_recipe.title,
            "description": created_recipe.description,
            "instructions": created_recipe.instructions,
            "prep_time_minutes": created_recipe.prep_time_minutes,
            "cook_time_minutes": created_recipe.cook_time_minutes,
            "total_time_minutes": created_recipe.total_time_minutes,
            "servings": created_recipe.servings,
            "difficulty_level": created_recipe.difficulty_level,
            "cuisine_type": created_recipe.cuisine_type,
            "meal_type": created_recipe.meal_type,
            "is_public": created_recipe.is_public,
            "created_at": created_recipe.created_at.isoformat(),
            "ingredients": [
                {
                    "name": ing.ingredient.name,
                    "quantity": float(ing.quantity),
                    "unit": ing.unit,
                    "preparation_notes": ing.preparation_notes
                }
                for ing in created_recipe.ingredients
            ],
            "tags": [tag.tag_name for tag in created_recipe.tags],
            "nutrition": {
                "calories": created_recipe.nutrition_data[0].calories if created_recipe.nutrition_data else 0,
                "protein": created_recipe.nutrition_data[0].protein_g if created_recipe.nutrition_data else 0,
                "carbohydrates": created_recipe.nutrition_data[0].carbohydrates_g if created_recipe.nutrition_data else 0,
                "fat": created_recipe.nutrition_data[0].fat_g if created_recipe.nutrition_data else 0,
                "fiber": created_recipe.nutrition_data[0].fiber_g if created_recipe.nutrition_data else 0,
                "sugar": created_recipe.nutrition_data[0].sugar_g if created_recipe.nutrition_data else 0
            } if created_recipe.nutrition_data else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating recipe: {str(e)}")

@router.get("/{recipe_id}")
async def get_recipe(
    recipe_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recipe by ID with full details
    """
    try:
        recipe = await recipe_service.get_recipe_by_id(recipe_id, db)
        
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Check if user can access this recipe
        if recipe.user_id != UUID(current_user["id"]) and not recipe.is_public:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "id": str(recipe.id),
            "title": recipe.title,
            "description": recipe.description,
            "instructions": recipe.instructions,
            "prep_time_minutes": recipe.prep_time_minutes,
            "cook_time_minutes": recipe.cook_time_minutes,
            "total_time_minutes": recipe.total_time_minutes,
            "servings": recipe.servings,
            "difficulty_level": recipe.difficulty_level,
            "cuisine_type": recipe.cuisine_type,
            "meal_type": recipe.meal_type,
            "source_url": recipe.source_url,
            "source_type": recipe.source_type,
            "extraction_confidence": float(recipe.extraction_confidence) if recipe.extraction_confidence else None,
            "is_public": recipe.is_public,
            "auto_imported": recipe.auto_imported,
            "created_at": recipe.created_at.isoformat(),
            "updated_at": recipe.updated_at.isoformat(),
            "ingredients": [
                {
                    "name": ing.ingredient.name,
                    "quantity": float(ing.quantity),
                    "unit": ing.unit,
                    "preparation_notes": ing.preparation_notes
                }
                for ing in recipe.ingredients
            ],
            "tags": [tag.tag_name for tag in recipe.tags],
            "nutrition": {
                "calories": recipe.nutrition_data[0].calories if recipe.nutrition_data else 0,
                "protein": recipe.nutrition_data[0].protein_g if recipe.nutrition_data else 0,
                "carbohydrates": recipe.nutrition_data[0].carbohydrates_g if recipe.nutrition_data else 0,
                "fat": recipe.nutrition_data[0].fat_g if recipe.nutrition_data else 0,
                "fiber": recipe.nutrition_data[0].fiber_g if recipe.nutrition_data else 0,
                "sugar": recipe.nutrition_data[0].sugar_g if recipe.nutrition_data else 0,
                "sodium": recipe.nutrition_data[0].sodium_mg if recipe.nutrition_data else 0,
                "cholesterol": recipe.nutrition_data[0].cholesterol_mg if recipe.nutrition_data else 0,
                "data_source": recipe.nutrition_data[0].data_source if recipe.nutrition_data else None,
                "confidence_score": float(recipe.nutrition_data[0].confidence_score) if recipe.nutrition_data and recipe.nutrition_data[0].confidence_score else None
            } if recipe.nutrition_data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipe: {str(e)}")

@router.put("/{recipe_id}")
async def update_recipe(
    recipe_id: UUID,
    recipe: RecipeUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update existing recipe
    """
    try:
        # Build update data
        update_data = {}
        
        for field, value in recipe.dict(exclude_unset=True).items():
            if field == "ingredients" and value is not None:
                update_data["ingredients"] = [
                    {
                        "name": ing.name,
                        "quantity": ing.quantity,
                        "unit": ing.unit,
                        "preparation_notes": ing.preparation_notes
                    }
                    for ing in value
                ]
            elif value is not None:
                update_data[field] = value
        
        # Update recipe
        updated_recipe = await recipe_service.update_recipe(
            recipe_id=recipe_id,
            user_id=UUID(current_user["id"]),
            update_data=update_data,
            db=db
        )
        
        if not updated_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found or access denied")
        
        return {
            "id": str(updated_recipe.id),
            "title": updated_recipe.title,
            "description": updated_recipe.description,
            "instructions": updated_recipe.instructions,
            "prep_time_minutes": updated_recipe.prep_time_minutes,
            "cook_time_minutes": updated_recipe.cook_time_minutes,
            "total_time_minutes": updated_recipe.total_time_minutes,
            "servings": updated_recipe.servings,
            "difficulty_level": updated_recipe.difficulty_level,
            "cuisine_type": updated_recipe.cuisine_type,
            "meal_type": updated_recipe.meal_type,
            "is_public": updated_recipe.is_public,
            "updated_at": updated_recipe.updated_at.isoformat(),
            "ingredients": [
                {
                    "name": ing.ingredient.name,
                    "quantity": float(ing.quantity),
                    "unit": ing.unit,
                    "preparation_notes": ing.preparation_notes
                }
                for ing in updated_recipe.ingredients
            ],
            "tags": [tag.tag_name for tag in updated_recipe.tags]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating recipe: {str(e)}")

@router.delete("/{recipe_id}")
async def delete_recipe(
    recipe_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete recipe
    """
    try:
        success = await recipe_service.delete_recipe(
            recipe_id=recipe_id,
            user_id=UUID(current_user["id"]),
            db=db
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Recipe not found or access denied")
        
        return {"message": "Recipe deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting recipe: {str(e)}")

@router.post("/extract/video", response_model=RecipeExtractionResponse)
async def extract_recipe_from_video(
    video_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Extract recipe from video file using multimodal AI processing
    Achieves >95% extraction accuracy with <5s response time targets
    """
    if not video_file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        temp_path = temp_file.name
        content = await video_file.read()
        temp_file.write(content)
    
    try:
        # Extract recipe using orchestrator
        result = await recipe_extractor.extract_recipe_from_video(
            temp_path, current_user["id"]
        )
        
        return RecipeExtractionResponse(
            recipe_data=result.recipe_data,
            confidence_score=result.confidence_score,
            source_breakdown=result.source_breakdown,
            extraction_time=result.extraction_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.post("/extract/text", response_model=RecipeExtractionResponse)
async def extract_recipe_from_text(
    request: TextExtractionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Extract recipe from text using Gemini AI processing
    """
    try:
        # Extract recipe using orchestrator
        result = await recipe_extractor.extract_recipe_from_text(request.text)
        
        return RecipeExtractionResponse(
            recipe_data=result.recipe_data,
            confidence_score=result.confidence_score,
            source_breakdown=result.source_breakdown,
            extraction_time=result.extraction_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/extract/url")
async def extract_recipe_from_url(
    url: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract recipe from URL by crawling and parsing content
    """
    # TODO: Implement URL extraction
    # This would integrate with the link_recipe_extraction module
    return {"message": "URL extraction not implemented yet", "url": url}

@router.post("/{recipe_id}/ratings")
async def add_recipe_rating(
    recipe_id: UUID,
    rating: RecipeRatingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add or update recipe rating
    """
    try:
        if not 1 <= rating.rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        recipe_rating = await recipe_service.add_recipe_rating(
            recipe_id=recipe_id,
            user_id=UUID(current_user["id"]),
            rating=rating.rating,
            review_text=rating.review_text,
            db=db
        )
        
        if not recipe_rating:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {
            "id": str(recipe_rating.id),
            "recipe_id": str(recipe_rating.recipe_id),
            "user_id": str(recipe_rating.user_id),
            "rating": recipe_rating.rating,
            "review_text": recipe_rating.review_text,
            "created_at": recipe_rating.created_at.isoformat(),
            "updated_at": recipe_rating.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding rating: {str(e)}")

@router.get("/{recipe_id}/ratings")
async def get_recipe_ratings(
    recipe_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all ratings for a recipe
    """
    try:
        ratings = await recipe_service.get_recipe_ratings(recipe_id, db)
        
        return {
            "ratings": [
                {
                    "id": str(rating.id),
                    "user_id": str(rating.user_id),
                    "rating": rating.rating,
                    "review_text": rating.review_text,
                    "created_at": rating.created_at.isoformat(),
                    "updated_at": rating.updated_at.isoformat()
                }
                for rating in ratings
            ],
            "total": len(ratings),
            "average_rating": sum(r.rating for r in ratings) / len(ratings) if ratings else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ratings: {str(e)}")

@router.get("/search")
async def search_recipes(
    q: str = Query(..., description="Search query"),
    public_only: bool = Query(True, description="Search only public recipes"),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search recipes by title, description, or ingredients
    """
    try:
        recipes = await recipe_service.search_recipes(
            search_term=q,
            db=db,
            public_only=public_only,
            limit=limit
        )
        
        return {
            "recipes": [
                {
                    "id": str(recipe.id),
                    "title": recipe.title,
                    "description": recipe.description,
                    "difficulty_level": recipe.difficulty_level,
                    "cuisine_type": recipe.cuisine_type,
                    "meal_type": recipe.meal_type,
                    "prep_time_minutes": recipe.prep_time_minutes,
                    "cook_time_minutes": recipe.cook_time_minutes,
                    "servings": recipe.servings,
                    "created_at": recipe.created_at.isoformat(),
                    "ingredients_count": len(recipe.ingredients),
                    "tags": [tag.tag_name for tag in recipe.tags],
                    "nutrition": {
                        "calories": recipe.nutrition_data[0].calories if recipe.nutrition_data else 0,
                        "protein": recipe.nutrition_data[0].protein_g if recipe.nutrition_data else 0,
                        "carbohydrates": recipe.nutrition_data[0].carbohydrates_g if recipe.nutrition_data else 0,
                        "fat": recipe.nutrition_data[0].fat_g if recipe.nutrition_data else 0
                    } if recipe.nutrition_data else None
                }
                for recipe in recipes
            ],
            "total": len(recipes),
            "query": q,
            "public_only": public_only
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching recipes: {str(e)}")

@router.post("/extract/save")
async def save_extracted_recipe(
    extraction_result: RecipeExtractionResponse,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save an extracted recipe to the database
    """
    try:
        # Create recipe from extraction result
        recipe = await recipe_service.create_recipe_from_extraction(
            user_id=UUID(current_user["id"]),
            extraction_result=extraction_result,
            db=db
        )
        
        return {
            "id": str(recipe.id),
            "title": recipe.title,
            "description": recipe.description,
            "created_at": recipe.created_at.isoformat(),
            "extraction_confidence": float(recipe.extraction_confidence) if recipe.extraction_confidence else None,
            "auto_imported": recipe.auto_imported,
            "ingredients_count": len(recipe.ingredients),
            "tags": [tag.tag_name for tag in recipe.tags]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving extracted recipe: {str(e)}")