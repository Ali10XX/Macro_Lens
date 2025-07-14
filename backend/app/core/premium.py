from functools import wraps
from fastapi import HTTPException, status, Depends
from app.core.database import database
from app.core.deps import get_current_user_id

class PremiumFeatures:
    """Define premium feature limits and checks"""
    
    # Free tier limits
    FREE_RECIPES_LIMIT = 10
    FREE_MEAL_PLANS_LIMIT = 1
    FREE_DAILY_IMPORTS = 3
    FREE_VIDEO_UPLOADS_PER_MONTH = 5
    
    # Premium tier limits (much higher)
    PREMIUM_RECIPES_LIMIT = 1000
    PREMIUM_MEAL_PLANS_LIMIT = 50
    PREMIUM_DAILY_IMPORTS = 100
    PREMIUM_VIDEO_UPLOADS_PER_MONTH = 500

async def check_user_premium_status(user_id: str) -> bool:
    """Check if user has premium subscription"""
    user = await database.fetch_one(
        "SELECT is_premium FROM users WHERE id = :user_id",
        {"user_id": user_id}
    )
    return user.is_premium if user else False

async def get_user_recipe_count(user_id: str) -> int:
    """Get current recipe count for user"""
    result = await database.fetch_one(
        "SELECT COUNT(*) as count FROM recipes WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    return result.count if result else 0

async def get_user_meal_plan_count(user_id: str) -> int:
    """Get current meal plan count for user"""
    result = await database.fetch_one(
        "SELECT COUNT(*) as count FROM meal_plans WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    return result.count if result else 0

async def get_user_daily_imports(user_id: str) -> int:
    """Get today's import count for user"""
    result = await database.fetch_one(
        """
        SELECT COUNT(*) as count 
        FROM recipe_import_jobs 
        WHERE user_id = :user_id 
        AND DATE(created_at) = CURRENT_DATE
        """,
        {"user_id": user_id}
    )
    return result.count if result else 0

async def get_user_monthly_video_uploads(user_id: str) -> int:
    """Get current month's video upload count"""
    result = await database.fetch_one(
        """
        SELECT COUNT(*) as count 
        FROM file_uploads 
        WHERE user_id = :user_id 
        AND file_type LIKE 'video/%'
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        """,
        {"user_id": user_id}
    )
    return result.count if result else 0

def require_premium(feature_name: str = "premium feature"):
    """Decorator to require premium subscription for endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id from dependencies
            current_user_id = None
            for key, value in kwargs.items():
                if key == 'current_user_id':
                    current_user_id = value
                    break
            
            if not current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User authentication required"
                )
            
            is_premium = await check_user_premium_status(current_user_id)
            if not is_premium:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"Premium subscription required for {feature_name}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

async def check_recipe_limit(user_id: str) -> bool:
    """Check if user can create more recipes"""
    is_premium = await check_user_premium_status(user_id)
    current_count = await get_user_recipe_count(user_id)
    
    limit = PremiumFeatures.PREMIUM_RECIPES_LIMIT if is_premium else PremiumFeatures.FREE_RECIPES_LIMIT
    return current_count < limit

async def check_meal_plan_limit(user_id: str) -> bool:
    """Check if user can create more meal plans"""
    is_premium = await check_user_premium_status(user_id)
    current_count = await get_user_meal_plan_count(user_id)
    
    limit = PremiumFeatures.PREMIUM_MEAL_PLANS_LIMIT if is_premium else PremiumFeatures.FREE_MEAL_PLANS_LIMIT
    return current_count < limit

async def check_daily_import_limit(user_id: str) -> bool:
    """Check if user can import more recipes today"""
    is_premium = await check_user_premium_status(user_id)
    current_count = await get_user_daily_imports(user_id)
    
    limit = PremiumFeatures.PREMIUM_DAILY_IMPORTS if is_premium else PremiumFeatures.FREE_DAILY_IMPORTS
    return current_count < limit

async def check_video_upload_limit(user_id: str) -> bool:
    """Check if user can upload more videos this month"""
    is_premium = await check_user_premium_status(user_id)
    current_count = await get_user_monthly_video_uploads(user_id)
    
    limit = PremiumFeatures.PREMIUM_VIDEO_UPLOADS_PER_MONTH if is_premium else PremiumFeatures.FREE_VIDEO_UPLOADS_PER_MONTH
    return current_count < limit

async def get_user_limits(user_id: str) -> dict:
    """Get all current limits and usage for user"""
    is_premium = await check_user_premium_status(user_id)
    
    recipe_count = await get_user_recipe_count(user_id)
    meal_plan_count = await get_user_meal_plan_count(user_id)
    daily_imports = await get_user_daily_imports(user_id)
    monthly_videos = await get_user_monthly_video_uploads(user_id)
    
    if is_premium:
        limits = {
            "is_premium": True,
            "recipes": {"current": recipe_count, "limit": PremiumFeatures.PREMIUM_RECIPES_LIMIT},
            "meal_plans": {"current": meal_plan_count, "limit": PremiumFeatures.PREMIUM_MEAL_PLANS_LIMIT},
            "daily_imports": {"current": daily_imports, "limit": PremiumFeatures.PREMIUM_DAILY_IMPORTS},
            "monthly_videos": {"current": monthly_videos, "limit": PremiumFeatures.PREMIUM_VIDEO_UPLOADS_PER_MONTH}
        }
    else:
        limits = {
            "is_premium": False,
            "recipes": {"current": recipe_count, "limit": PremiumFeatures.FREE_RECIPES_LIMIT},
            "meal_plans": {"current": meal_plan_count, "limit": PremiumFeatures.FREE_MEAL_PLANS_LIMIT},
            "daily_imports": {"current": daily_imports, "limit": PremiumFeatures.FREE_DAILY_IMPORTS},
            "monthly_videos": {"current": monthly_videos, "limit": PremiumFeatures.FREE_VIDEO_UPLOADS_PER_MONTH}
        }
    
    return limits