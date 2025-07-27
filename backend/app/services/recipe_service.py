"""
Recipe Service
Comprehensive CRUD operations for recipe management
"""

import asyncio
import logging
from typing import Dict, List, Optional, Union
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.exc import IntegrityError

from app.models.recipe import (
    Recipe, Ingredient, RecipeIngredient, NutritionData, 
    RecipeRating, RecipeTag, RecipeImportJob, FileUpload
)
from app.core.database import get_db
from app.services.nutrition_engine import nutrition_engine
from app.services.recipe_extraction import recipe_extractor

logger = logging.getLogger(__name__)

class RecipeService:
    """
    Service for managing recipes with full CRUD operations
    """
    
    def __init__(self):
        self.nutrition_engine = nutrition_engine
        self.recipe_extractor = recipe_extractor
    
    async def create_recipe(self, user_id: UUID, recipe_data: Dict, db: AsyncSession) -> Recipe:
        """
        Create a new recipe with ingredients and nutrition calculation
        """
        try:
            # Create recipe
            recipe = Recipe(
                user_id=user_id,
                title=recipe_data.get("title", ""),
                description=recipe_data.get("description", ""),
                instructions=recipe_data.get("instructions", ""),
                prep_time_minutes=recipe_data.get("prep_time_minutes"),
                cook_time_minutes=recipe_data.get("cook_time_minutes"),
                servings=recipe_data.get("servings", 1),
                difficulty_level=recipe_data.get("difficulty_level", "medium"),
                cuisine_type=recipe_data.get("cuisine_type"),
                meal_type=recipe_data.get("meal_type"),
                source_url=recipe_data.get("source_url"),
                source_type=recipe_data.get("source_type", "manual"),
                extraction_confidence=recipe_data.get("extraction_confidence"),
                is_public=recipe_data.get("is_public", False),
                auto_imported=recipe_data.get("auto_imported", False)
            )
            
            # Calculate total time
            if recipe.prep_time_minutes and recipe.cook_time_minutes:
                recipe.total_time_minutes = recipe.prep_time_minutes + recipe.cook_time_minutes
            elif recipe.prep_time_minutes:
                recipe.total_time_minutes = recipe.prep_time_minutes
            elif recipe.cook_time_minutes:
                recipe.total_time_minutes = recipe.cook_time_minutes
            
            db.add(recipe)
            await db.flush()  # Get the recipe ID
            
            # Add ingredients
            if recipe_data.get("ingredients"):
                await self._add_ingredients_to_recipe(
                    recipe.id, recipe_data["ingredients"], db
                )
            
            # Add tags
            if recipe_data.get("tags"):
                await self._add_tags_to_recipe(
                    recipe.id, recipe_data["tags"], db
                )
            
            # Calculate and save nutrition data
            if recipe_data.get("ingredients"):
                await self._calculate_and_save_nutrition(
                    recipe.id, recipe_data["ingredients"], db
                )
            
            await db.commit()
            
            # Return recipe with relationships
            return await self.get_recipe_by_id(recipe.id, db)
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating recipe: {str(e)}")
            raise
    
    async def get_recipe_by_id(self, recipe_id: UUID, db: AsyncSession) -> Optional[Recipe]:
        """
        Get recipe by ID with all relationships
        """
        try:
            result = await db.execute(
                select(Recipe)
                .options(
                    selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                    selectinload(Recipe.ratings),
                    selectinload(Recipe.tags),
                    selectinload(Recipe.nutrition_data),
                    selectinload(Recipe.file_uploads)
                )
                .where(Recipe.id == recipe_id)
            )
            
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error fetching recipe {recipe_id}: {str(e)}")
            return None
    
    async def get_user_recipes(self, user_id: UUID, db: AsyncSession, 
                              skip: int = 0, limit: int = 100,
                              search: Optional[str] = None,
                              meal_type: Optional[str] = None,
                              difficulty_level: Optional[str] = None) -> List[Recipe]:
        """
        Get user's recipes with filtering and pagination
        """
        try:
            query = select(Recipe).where(Recipe.user_id == user_id)
            
            # Apply filters
            if search:
                query = query.where(
                    or_(
                        Recipe.title.ilike(f"%{search}%"),
                        Recipe.description.ilike(f"%{search}%")
                    )
                )
            
            if meal_type:
                query = query.where(Recipe.meal_type == meal_type)
            
            if difficulty_level:
                query = query.where(Recipe.difficulty_level == difficulty_level)
            
            # Apply pagination and ordering
            query = query.order_by(Recipe.created_at.desc()).offset(skip).limit(limit)
            
            # Load relationships
            query = query.options(
                selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                selectinload(Recipe.tags),
                selectinload(Recipe.nutrition_data)
            )
            
            result = await db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error fetching user recipes: {str(e)}")
            return []
    
    async def update_recipe(self, recipe_id: UUID, user_id: UUID, 
                           update_data: Dict, db: AsyncSession) -> Optional[Recipe]:
        """
        Update existing recipe
        """
        try:
            # Check if recipe exists and belongs to user
            recipe = await self.get_recipe_by_id(recipe_id, db)
            if not recipe or recipe.user_id != user_id:
                return None
            
            # Update basic recipe fields
            for field, value in update_data.items():
                if field not in ["ingredients", "tags"] and hasattr(recipe, field):
                    setattr(recipe, field, value)
            
            # Update total time
            if recipe.prep_time_minutes and recipe.cook_time_minutes:
                recipe.total_time_minutes = recipe.prep_time_minutes + recipe.cook_time_minutes
            
            # Update ingredients if provided
            if "ingredients" in update_data:
                await self._update_recipe_ingredients(
                    recipe_id, update_data["ingredients"], db
                )
            
            # Update tags if provided
            if "tags" in update_data:
                await self._update_recipe_tags(
                    recipe_id, update_data["tags"], db
                )
            
            # Recalculate nutrition if ingredients changed
            if "ingredients" in update_data:
                await self._calculate_and_save_nutrition(
                    recipe_id, update_data["ingredients"], db
                )
            
            recipe.updated_at = datetime.utcnow()
            await db.commit()
            
            return await self.get_recipe_by_id(recipe_id, db)
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating recipe {recipe_id}: {str(e)}")
            raise
    
    async def delete_recipe(self, recipe_id: UUID, user_id: UUID, db: AsyncSession) -> bool:
        """
        Delete recipe and all associated data
        """
        try:
            # Check if recipe exists and belongs to user
            recipe = await self.get_recipe_by_id(recipe_id, db)
            if not recipe or recipe.user_id != user_id:
                return False
            
            # Delete recipe (cascade will handle related data)
            await db.execute(
                delete(Recipe).where(Recipe.id == recipe_id)
            )
            
            await db.commit()
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting recipe {recipe_id}: {str(e)}")
            return False
    
    async def add_recipe_rating(self, recipe_id: UUID, user_id: UUID, 
                               rating: int, review_text: Optional[str], 
                               db: AsyncSession) -> Optional[RecipeRating]:
        """
        Add or update recipe rating
        """
        try:
            # Check if recipe exists
            recipe = await self.get_recipe_by_id(recipe_id, db)
            if not recipe:
                return None
            
            # Check if user already rated this recipe
            existing_rating = await db.execute(
                select(RecipeRating).where(
                    and_(
                        RecipeRating.recipe_id == recipe_id,
                        RecipeRating.user_id == user_id
                    )
                )
            )
            existing_rating = existing_rating.scalar_one_or_none()
            
            if existing_rating:
                # Update existing rating
                existing_rating.rating = rating
                existing_rating.review_text = review_text
                existing_rating.updated_at = datetime.utcnow()
                result = existing_rating
            else:
                # Create new rating
                new_rating = RecipeRating(
                    recipe_id=recipe_id,
                    user_id=user_id,
                    rating=rating,
                    review_text=review_text
                )
                db.add(new_rating)
                result = new_rating
            
            await db.commit()
            return result
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error adding rating to recipe {recipe_id}: {str(e)}")
            raise
    
    async def get_recipe_ratings(self, recipe_id: UUID, db: AsyncSession) -> List[RecipeRating]:
        """
        Get all ratings for a recipe
        """
        try:
            result = await db.execute(
                select(RecipeRating)
                .where(RecipeRating.recipe_id == recipe_id)
                .order_by(RecipeRating.created_at.desc())
            )
            
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error fetching ratings for recipe {recipe_id}: {str(e)}")
            return []
    
    async def search_recipes(self, search_term: str, db: AsyncSession, 
                           public_only: bool = True, limit: int = 50) -> List[Recipe]:
        """
        Search recipes by title, description, or ingredients
        """
        try:
            query = select(Recipe).distinct()
            
            if public_only:
                query = query.where(Recipe.is_public == True)
            
            # Search in title, description, and ingredients
            query = query.where(
                or_(
                    Recipe.title.ilike(f"%{search_term}%"),
                    Recipe.description.ilike(f"%{search_term}%"),
                    Recipe.ingredients.any(
                        RecipeIngredient.ingredient.has(
                            Ingredient.name.ilike(f"%{search_term}%")
                        )
                    )
                )
            )
            
            query = query.order_by(Recipe.created_at.desc()).limit(limit)
            
            # Load relationships
            query = query.options(
                selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                selectinload(Recipe.tags),
                selectinload(Recipe.nutrition_data)
            )
            
            result = await db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error searching recipes: {str(e)}")
            return []
    
    async def create_recipe_from_extraction(self, user_id: UUID, extraction_result, 
                                          db: AsyncSession) -> Recipe:
        """
        Create recipe from extraction result
        """
        recipe_data = extraction_result.recipe_data
        
        # Convert extraction result to recipe format
        formatted_data = {
            "title": recipe_data.get("title", ""),
            "description": recipe_data.get("description", ""),
            "instructions": recipe_data.get("instructions", ""),
            "prep_time_minutes": recipe_data.get("prep_time_minutes"),
            "cook_time_minutes": recipe_data.get("cook_time_minutes"),
            "servings": recipe_data.get("servings", 1),
            "difficulty_level": recipe_data.get("difficulty_level", "medium"),
            "cuisine_type": recipe_data.get("cuisine_type"),
            "source_type": "extraction",
            "extraction_confidence": extraction_result.confidence_score,
            "auto_imported": True,
            "ingredients": recipe_data.get("ingredients", []),
            "tags": recipe_data.get("tags", [])
        }
        
        return await self.create_recipe(user_id, formatted_data, db)
    
    async def _add_ingredients_to_recipe(self, recipe_id: UUID, ingredients: List[Dict], 
                                        db: AsyncSession):
        """
        Add ingredients to recipe
        """
        for i, ingredient_data in enumerate(ingredients):
            # Get or create ingredient
            ingredient = await self._get_or_create_ingredient(
                ingredient_data["name"], db
            )
            
            # Create recipe ingredient
            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe_id,
                ingredient_id=ingredient.id,
                quantity=ingredient_data.get("quantity", 1.0),
                unit=ingredient_data.get("unit", "cup"),
                preparation_notes=ingredient_data.get("preparation_notes"),
                order_index=i
            )
            
            db.add(recipe_ingredient)
    
    async def _add_tags_to_recipe(self, recipe_id: UUID, tags: List[str], db: AsyncSession):
        """
        Add tags to recipe
        """
        for tag_name in tags:
            if tag_name.strip():
                recipe_tag = RecipeTag(
                    recipe_id=recipe_id,
                    tag_name=tag_name.strip().lower()
                )
                db.add(recipe_tag)
    
    async def _get_or_create_ingredient(self, ingredient_name: str, db: AsyncSession) -> Ingredient:
        """
        Get existing ingredient or create new one
        """
        # Check if ingredient exists
        result = await db.execute(
            select(Ingredient).where(Ingredient.name == ingredient_name.lower())
        )
        ingredient = result.scalar_one_or_none()
        
        if not ingredient:
            ingredient = Ingredient(name=ingredient_name.lower())
            db.add(ingredient)
            await db.flush()
        
        return ingredient
    
    async def _calculate_and_save_nutrition(self, recipe_id: UUID, ingredients: List[Dict], 
                                          db: AsyncSession):
        """
        Calculate nutrition for recipe and save to database
        """
        try:
            # Calculate nutrition using nutrition engine
            nutrition_result = await self.nutrition_engine.calculate_recipe_nutrition(ingredients)
            
            # Delete existing nutrition data
            await db.execute(
                delete(NutritionData).where(NutritionData.recipe_id == recipe_id)
            )
            
            # Save new nutrition data
            total_nutrition = nutrition_result["total_nutrition"]
            
            nutrition_data = NutritionData(
                recipe_id=recipe_id,
                serving_size_g=100,  # Base serving size
                calories=total_nutrition.calories,
                protein_g=total_nutrition.protein,
                carbohydrates_g=total_nutrition.carbohydrates,
                fat_g=total_nutrition.fat,
                fiber_g=total_nutrition.fiber,
                sugar_g=total_nutrition.sugar,
                sodium_mg=total_nutrition.sodium,
                cholesterol_mg=total_nutrition.cholesterol,
                data_source=total_nutrition.source,
                confidence_score=total_nutrition.confidence
            )
            
            db.add(nutrition_data)
            
        except Exception as e:
            logger.error(f"Error calculating nutrition for recipe {recipe_id}: {str(e)}")
            # Don't fail the entire operation if nutrition calculation fails
            pass
    
    async def _update_recipe_ingredients(self, recipe_id: UUID, ingredients: List[Dict], 
                                        db: AsyncSession):
        """
        Update recipe ingredients
        """
        # Delete existing ingredients
        await db.execute(
            delete(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
        )
        
        # Add new ingredients
        await self._add_ingredients_to_recipe(recipe_id, ingredients, db)
    
    async def _update_recipe_tags(self, recipe_id: UUID, tags: List[str], db: AsyncSession):
        """
        Update recipe tags
        """
        # Delete existing tags
        await db.execute(
            delete(RecipeTag).where(RecipeTag.recipe_id == recipe_id)
        )
        
        # Add new tags
        await self._add_tags_to_recipe(recipe_id, tags, db)

# Global instance
recipe_service = RecipeService()