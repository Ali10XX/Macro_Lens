from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import database
from app.core.deps import get_current_user_id
from app.core.premium import get_user_limits
from app.models.user import UserResponse
from app.models.preferences import UserPreferencesCreate, UserPreferencesResponse
import uuid

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    user = await database.fetch_one(
        "SELECT * FROM users WHERE id = :id",
        {"id": current_user_id}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: dict,
    current_user_id: str = Depends(get_current_user_id)
):
    # Build dynamic update query
    update_fields = []
    values = {"id": current_user_id}
    
    allowed_fields = ["first_name", "last_name", "username"]
    for field, value in user_update.items():
        if field in allowed_fields and value is not None:
            update_fields.append(f"{field} = :{field}")
            values[field] = value
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    query = f"""
        UPDATE users 
        SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        RETURNING *
    """
    
    updated_user = await database.fetch_one(query, values)
    return UserResponse(**updated_user)

@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(current_user_id: str = Depends(get_current_user_id)):
    preferences = await database.fetch_one(
        "SELECT * FROM user_preferences WHERE user_id = :user_id",
        {"user_id": current_user_id}
    )
    
    if not preferences:
        # Create default preferences
        default_prefs = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "activity_level": "moderate",
            "dietary_restrictions": [],
            "auto_import_enabled": False,
            "preferred_units": "metric"
        }
        
        query = """
            INSERT INTO user_preferences (id, user_id, activity_level, dietary_restrictions, auto_import_enabled, preferred_units)
            VALUES (:id, :user_id, :activity_level, :dietary_restrictions, :auto_import_enabled, :preferred_units)
            RETURNING *
        """
        
        preferences = await database.fetch_one(query, default_prefs)
    
    return UserPreferencesResponse(**preferences)

@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    # Check if preferences exist
    existing = await database.fetch_one(
        "SELECT id FROM user_preferences WHERE user_id = :user_id",
        {"user_id": current_user_id}
    )
    
    values = preferences_update.dict(exclude_unset=True)
    values["user_id"] = current_user_id
    
    if existing:
        # Update existing preferences
        update_fields = []
        for field, value in values.items():
            if field != "user_id":
                update_fields.append(f"{field} = :{field}")
        
        query = f"""
            UPDATE user_preferences 
            SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
            RETURNING *
        """
    else:
        # Create new preferences
        values["id"] = str(uuid.uuid4())
        query = """
            INSERT INTO user_preferences (id, user_id, daily_calorie_goal, daily_protein_goal, 
                daily_carb_goal, daily_fat_goal, activity_level, dietary_restrictions, 
                auto_import_enabled, preferred_units)
            VALUES (:id, :user_id, :daily_calorie_goal, :daily_protein_goal, 
                :daily_carb_goal, :daily_fat_goal, :activity_level, :dietary_restrictions, 
                :auto_import_enabled, :preferred_units)
            RETURNING *
        """
    
    updated_preferences = await database.fetch_one(query, values)
    return UserPreferencesResponse(**updated_preferences)

@router.get("/me/limits")
async def get_current_user_limits(current_user_id: str = Depends(get_current_user_id)):
    """Get user's current usage and limits"""
    limits = await get_user_limits(current_user_id)
    return limits