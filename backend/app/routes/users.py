from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import database
from app.core.deps import get_current_user_id
from app.core.premium import get_user_limits
from app.models.user import UserResponse, UserProfileCreate, UserProfileUpdate, UserProfileResponse
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
    # Build dynamic update query safely with whitelisted fields
    allowed_fields = ["first_name", "last_name", "username"]
    update_data = {"id": current_user_id}
    
    # Only process allowed fields
    fields_to_update = []
    for field, value in user_update.items():
        if field in allowed_fields and value is not None:
            fields_to_update.append(field)
            update_data[field] = value
    
    if not fields_to_update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    # Build query with explicit field mapping to prevent SQL injection
    set_clauses = []
    for field in fields_to_update:
        if field == "first_name":
            set_clauses.append("first_name = :first_name")
        elif field == "last_name":
            set_clauses.append("last_name = :last_name")
        elif field == "username":
            set_clauses.append("username = :username")
    
    query = f"UPDATE users SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING *"
    
    updated_user = await database.fetch_one(query, update_data)
    return UserResponse(**updated_user)

# User Profile Management
@router.get("/me/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user_id: str = Depends(get_current_user_id)):
    """Get user profile information"""
    profile = await database.fetch_one(
        "SELECT * FROM user_profiles WHERE user_id = :user_id",
        {"user_id": current_user_id}
    )
    
    if not profile:
        # Create default profile
        default_profile = {
            "id": str(uuid.uuid4()),
            "user_id": current_user_id,
            "preferred_units": "metric",
            "onboarding_completed": False,
            "dietary_restrictions": [],
            "food_allergies": []
        }
        
        query = """
            INSERT INTO user_profiles (id, user_id, preferred_units, onboarding_completed, dietary_restrictions, food_allergies)
            VALUES (:id, :user_id, :preferred_units, :onboarding_completed, :dietary_restrictions, :food_allergies)
            RETURNING *
        """
        
        profile = await database.fetch_one(query, default_profile)
    
    return UserProfileResponse(**profile)

@router.put("/me/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update user profile information"""
    # Check if profile exists
    existing = await database.fetch_one(
        "SELECT id FROM user_profiles WHERE user_id = :user_id",
        {"user_id": current_user_id}
    )
    
    values = profile_update.dict(exclude_unset=True)
    values["user_id"] = current_user_id
    
    if existing:
        # Update existing profile with safe field mapping
        allowed_profile_fields = ["full_name", "age", "gender", "height_cm", "weight_kg", 
                                "primary_goal", "target_weight_kg", "activity_level", 
                                "dietary_restrictions", "food_allergies", "preferred_units", 
                                "fitness_experience", "onboarding_completed"]
        
        set_clauses = []
        safe_values = {"user_id": current_user_id}
        
        for field, value in values.items():
            if field != "user_id" and field in allowed_profile_fields:
                set_clauses.append(f"{field} = :{field}")
                safe_values[field] = value
        
        if set_clauses:
            query = f"UPDATE user_profiles SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id RETURNING *"
            values = safe_values
        else:
            raise HTTPException(status_code=400, detail="No valid fields to update")
    else:
        # Create new profile
        values["id"] = str(uuid.uuid4())
        if "dietary_restrictions" not in values:
            values["dietary_restrictions"] = []
        if "food_allergies" not in values:
            values["food_allergies"] = []
        if "preferred_units" not in values:
            values["preferred_units"] = "metric"
        if "onboarding_completed" not in values:
            values["onboarding_completed"] = False
            
        query = """
            INSERT INTO user_profiles (id, user_id, full_name, age, gender, height_cm, weight_kg, 
                primary_goal, target_weight_kg, activity_level, dietary_restrictions, food_allergies, 
                preferred_units, fitness_experience, onboarding_completed)
            VALUES (:id, :user_id, :full_name, :age, :gender, :height_cm, :weight_kg, 
                :primary_goal, :target_weight_kg, :activity_level, :dietary_restrictions, 
                :food_allergies, :preferred_units, :fitness_experience, :onboarding_completed)
            RETURNING *
        """
    
    updated_profile = await database.fetch_one(query, values)
    return UserProfileResponse(**updated_profile)

@router.post("/me/profile/complete-onboarding", response_model=UserProfileResponse)
async def complete_onboarding(
    profile_data: UserProfileCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Complete user onboarding with profile data"""
    # Set onboarding as completed
    profile_data.onboarding_completed = True
    
    # Update or create profile
    values = profile_data.dict()
    values["user_id"] = current_user_id
    
    # Check if profile exists
    existing = await database.fetch_one(
        "SELECT id FROM user_profiles WHERE user_id = :user_id",
        {"user_id": current_user_id}
    )
    
    if existing:
        # Update existing profile with safe field mapping  
        allowed_profile_fields = ["full_name", "age", "gender", "height_cm", "weight_kg", 
                                "primary_goal", "target_weight_kg", "activity_level", 
                                "dietary_restrictions", "food_allergies", "preferred_units", 
                                "fitness_experience", "onboarding_completed"]
        
        set_clauses = []
        safe_values = {"user_id": current_user_id}
        
        for field, value in values.items():
            if field != "user_id" and field in allowed_profile_fields:
                set_clauses.append(f"{field} = :{field}")
                safe_values[field] = value
        
        if set_clauses:
            query = f"UPDATE user_profiles SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id RETURNING *"
            values = safe_values
        else:
            raise HTTPException(status_code=400, detail="No valid fields to update")
    else:
        # Create new profile
        values["id"] = str(uuid.uuid4())
        query = """
            INSERT INTO user_profiles (id, user_id, full_name, age, gender, height_cm, weight_kg, 
                primary_goal, target_weight_kg, activity_level, dietary_restrictions, food_allergies, 
                preferred_units, fitness_experience, onboarding_completed)
            VALUES (:id, :user_id, :full_name, :age, :gender, :height_cm, :weight_kg, 
                :primary_goal, :target_weight_kg, :activity_level, :dietary_restrictions, 
                :food_allergies, :preferred_units, :fitness_experience, :onboarding_completed)
            RETURNING *
        """
    
    updated_profile = await database.fetch_one(query, values)
    return UserProfileResponse(**updated_profile)

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
        # Update existing preferences with safe field mapping
        allowed_pref_fields = ["daily_calorie_goal", "daily_protein_goal", "daily_carb_goal", 
                             "daily_fat_goal", "activity_level", "dietary_restrictions", 
                             "auto_import_enabled", "preferred_units"]
        
        set_clauses = []
        safe_values = {"user_id": current_user_id}
        
        for field, value in values.items():
            if field != "user_id" and field in allowed_pref_fields:
                set_clauses.append(f"{field} = :{field}")
                safe_values[field] = value
        
        if set_clauses:
            query = f"UPDATE user_preferences SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id RETURNING *"
            values = safe_values
        else:
            raise HTTPException(status_code=400, detail="No valid fields to update")
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