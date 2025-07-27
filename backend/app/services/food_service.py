"""
Community Food Database Service
Handles food submission, voting, search, and verification
"""

from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, and_, or_, text, desc
from uuid import UUID
import json
import hashlib
from datetime import datetime, timedelta

from app.models.food import (
    CommunityFood, FoodVote, FoodUsageLog, 
    FoodSearchCache, FoodCategory
)
from app.models.user import User


class FoodService:
    
    @staticmethod
    async def search_foods(
        query: str,
        db: AsyncSession,
        category_filter: Optional[str] = None,
        min_accuracy: float = 0.6,
        limit: int = 20,
        include_unverified: bool = False
    ) -> List[Dict]:
        """
        Search for foods with relevance ranking and accuracy filtering
        """
        # Normalize query for caching
        normalized_query = query.lower().strip()
        search_hash = hashlib.md5(f"{normalized_query}_{category_filter}_{min_accuracy}_{limit}".encode()).hexdigest()
        
        # Check cache first
        cache_result = await db.execute(
            select(FoodSearchCache).where(
                and_(
                    FoodSearchCache.search_hash == search_hash,
                    FoodSearchCache.expires_at > datetime.utcnow()
                )
            )
        )
        cached = cache_result.scalar_one_or_none()
        
        if cached:
            # Return cached results
            food_ids = json.loads(cached.results)
            foods = await db.execute(
                select(CommunityFood)
                .where(CommunityFood.id.in_([f["id"] for f in food_ids]))
                .options(selectinload(CommunityFood.submitter))
            )
            return [FoodService._format_food_result(food) for food in foods.scalars()]
        
        # Build search query
        base_query = select(CommunityFood).where(
            and_(
                CommunityFood.is_approved == True,
                CommunityFood.is_flagged == False
            )
        )
        
        # Add accuracy filter
        if not include_unverified:
            base_query = base_query.where(
                or_(
                    CommunityFood.verification_score >= min_accuracy,
                    CommunityFood.is_verified == True
                )
            )
        
        # Add category filter
        if category_filter:
            base_query = base_query.where(CommunityFood.category == category_filter)
        
        # Add text search with ranking
        search_terms = normalized_query.split()
        search_conditions = []
        
        for term in search_terms:
            search_conditions.append(
                or_(
                    CommunityFood.name.ilike(f"%{term}%"),
                    CommunityFood.brand.ilike(f"%{term}%"),
                    CommunityFood.description.ilike(f"%{term}%")
                )
            )
        
        if search_conditions:
            base_query = base_query.where(and_(*search_conditions))
        
        # Order by relevance (exact matches first, then by verification score)
        base_query = base_query.order_by(
            # Exact name match gets highest priority
            CommunityFood.name.ilike(normalized_query).desc(),
            # Then by verification score
            CommunityFood.verification_score.desc(),
            # Then by total votes (popularity)
            CommunityFood.total_votes.desc(),
            # Finally by name alphabetically
            CommunityFood.name
        ).limit(limit)
        
        # Execute search
        result = await db.execute(base_query.options(selectinload(CommunityFood.submitter)))
        foods = result.scalars().all()
        
        # Cache results for 1 hour
        cache_data = [{"id": str(food.id), "relevance": 1.0} for food in foods]
        cache_entry = FoodSearchCache(
            search_query=query,
            search_hash=search_hash,
            results=json.dumps(cache_data),
            result_count=len(foods),
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(cache_entry)
        
        return [FoodService._format_food_result(food) for food in foods]
    
    @staticmethod
    async def submit_food(
        user_id: UUID,
        food_data: Dict,
        db: AsyncSession
    ) -> CommunityFood:
        """
        Submit a new food to the community database
        """
        # Parse alternative servings if provided
        alt_servings = None
        if food_data.get("alternative_servings"):
            alt_servings = json.dumps(food_data["alternative_servings"])
        
        food = CommunityFood(
            name=food_data["name"],
            brand=food_data.get("brand"),
            category=food_data.get("category"),
            description=food_data.get("description"),
            base_serving_size=food_data["base_serving_size"],
            base_serving_unit=food_data["base_serving_unit"],
            calories_per_serving=food_data["calories_per_serving"],
            protein_g=food_data.get("protein_g", 0.0),
            carbohydrates_g=food_data.get("carbohydrates_g", 0.0),
            fat_g=food_data.get("fat_g", 0.0),
            fiber_g=food_data.get("fiber_g", 0.0),
            sugar_g=food_data.get("sugar_g", 0.0),
            sodium_mg=food_data.get("sodium_mg", 0.0),
            alternative_servings=alt_servings,
            submitted_by=user_id,
            data_source=food_data.get("data_source", "user"),
            source_id=food_data.get("source_id"),
            is_approved=True  # Auto-approve for now, can add moderation later
        )
        
        db.add(food)
        await db.commit()
        await db.refresh(food)
        
        return food
    
    @staticmethod
    async def vote_on_food(
        user_id: UUID,
        food_id: UUID,
        is_accurate: bool,
        vote_type: str,
        comment: Optional[str] = None,
        suggested_correction: Optional[Dict] = None,
        db: AsyncSession
    ) -> Dict:
        """
        Submit a vote on food accuracy
        """
        # Check if user already voted
        existing_vote = await db.execute(
            select(FoodVote).where(
                and_(
                    FoodVote.food_id == food_id,
                    FoodVote.user_id == user_id
                )
            )
        )
        
        vote = existing_vote.scalar_one_or_none()
        
        if vote:
            # Update existing vote
            vote.is_accurate = is_accurate
            vote.vote_type = vote_type
            vote.comment = comment
            vote.suggested_correction = json.dumps(suggested_correction) if suggested_correction else None
        else:
            # Create new vote
            vote = FoodVote(
                food_id=food_id,
                user_id=user_id,
                is_accurate=is_accurate,
                vote_type=vote_type,
                comment=comment,
                suggested_correction=json.dumps(suggested_correction) if suggested_correction else None
            )
            db.add(vote)
        
        # Update food verification score
        await FoodService._update_food_verification_score(food_id, db)
        
        await db.commit()
        
        return {"success": True, "vote_id": str(vote.id)}
    
    @staticmethod
    async def _update_food_verification_score(food_id: UUID, db: AsyncSession):
        """
        Recalculate verification score based on all votes
        """
        # Get vote stats
        vote_stats = await db.execute(
            select(
                func.count(FoodVote.id).label("total"),
                func.sum(func.cast(FoodVote.is_accurate, Integer)).label("positive")
            ).where(FoodVote.food_id == food_id)
        )
        
        stats = vote_stats.first()
        total_votes = stats.total or 0
        positive_votes = stats.positive or 0
        
        # Calculate verification score using Wilson score interval
        # This gives a confidence-adjusted accuracy rating
        if total_votes == 0:
            verification_score = 0.5  # Neutral for new items
        else:
            n = total_votes
            p = positive_votes / total_votes
            z = 1.96  # 95% confidence interval
            
            # Wilson score interval lower bound
            verification_score = (p + z*z/(2*n) - z * ((p*(1-p)+z*z/(4*n))/n)**0.5) / (1 + z*z/n)
            verification_score = max(0, min(1, verification_score))  # Clamp to [0,1]
        
        # Update food record
        await db.execute(
            update(CommunityFood)
            .where(CommunityFood.id == food_id)
            .values(
                verification_score=verification_score,
                total_votes=total_votes,
                positive_votes=positive_votes,
                is_verified=verification_score >= 0.8 and total_votes >= 5
            )
        )
    
    @staticmethod
    async def log_food_usage(
        user_id: UUID,
        food_id: UUID,
        used_in: str,
        serving_size: float,
        serving_unit: str,
        db: AsyncSession
    ):
        """
        Log food usage for analytics and ranking
        """
        usage_log = FoodUsageLog(
            food_id=food_id,
            user_id=user_id,
            used_in=used_in,
            serving_size=serving_size,
            serving_unit=serving_unit
        )
        
        db.add(usage_log)
        await db.commit()
    
    @staticmethod
    async def get_food_details(food_id: UUID, db: AsyncSession) -> Optional[Dict]:
        """
        Get detailed information about a food including votes and usage stats
        """
        food_result = await db.execute(
            select(CommunityFood)
            .where(CommunityFood.id == food_id)
            .options(
                selectinload(CommunityFood.submitter),
                selectinload(CommunityFood.votes).selectinload(FoodVote.voter)
            )
        )
        
        food = food_result.scalar_one_or_none()
        if not food:
            return None
        
        # Get usage stats
        usage_stats = await db.execute(
            select(
                func.count(FoodUsageLog.id).label("total_uses"),
                func.count(func.distinct(FoodUsageLog.user_id)).label("unique_users")
            ).where(FoodUsageLog.food_id == food_id)
        )
        
        stats = usage_stats.first()
        
        return {
            **FoodService._format_food_result(food),
            "usage_stats": {
                "total_uses": stats.total_uses or 0,
                "unique_users": stats.unique_users or 0
            },
            "votes": [
                {
                    "id": str(vote.id),
                    "is_accurate": vote.is_accurate,
                    "vote_type": vote.vote_type,
                    "comment": vote.comment,
                    "voter_name": vote.voter.first_name if vote.voter else "Anonymous",
                    "created_at": vote.created_at.isoformat()
                }
                for vote in food.votes
            ]
        }
    
    @staticmethod
    async def get_categories(db: AsyncSession) -> List[Dict]:
        """
        Get all food categories for filtering
        """
        result = await db.execute(
            select(FoodCategory)
            .where(FoodCategory.parent_category_id.is_(None))  # Top level only
            .order_by(FoodCategory.sort_order, FoodCategory.name)
        )
        
        return [
            {
                "id": str(cat.id),
                "name": cat.name,
                "display_name": cat.display_name,
                "icon": cat.icon,
                "color": cat.color
            }
            for cat in result.scalars()
        ]
    
    @staticmethod
    def _format_food_result(food: CommunityFood) -> Dict:
        """
        Format food object for API response
        """
        alternative_servings = []
        if food.alternative_servings:
            try:
                alternative_servings = json.loads(food.alternative_servings)
            except:
                pass
        
        return {
            "id": str(food.id),
            "name": food.name,
            "brand": food.brand,
            "category": food.category,
            "description": food.description,
            "base_serving": {
                "size": food.base_serving_size,
                "unit": food.base_serving_unit
            },
            "nutrition": {
                "calories": food.calories_per_serving,
                "protein": food.protein_g,
                "carbohydrates": food.carbohydrates_g,
                "fat": food.fat_g,
                "fiber": food.fiber_g,
                "sugar": food.sugar_g,
                "sodium": food.sodium_mg
            },
            "alternative_servings": alternative_servings,
            "verification": {
                "score": food.verification_score,
                "accuracy_percentage": food.accuracy_percentage,
                "trust_level": food.trust_level,
                "total_votes": food.total_votes,
                "is_verified": food.is_verified
            },
            "submitted_by": {
                "name": f"{food.submitter.first_name} {food.submitter.last_name}" if food.submitter else "Unknown",
                "created_at": food.created_at.isoformat()
            },
            "data_source": food.data_source
        }


# Export service instance
food_service = FoodService()