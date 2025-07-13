from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_current_user():
    return {"message": "Get current user profile"}

@router.put("/me")
async def update_current_user():
    return {"message": "Update current user profile"}

@router.get("/me/preferences")
async def get_user_preferences():
    return {"message": "Get user preferences"}

@router.put("/me/preferences")
async def update_user_preferences():
    return {"message": "Update user preferences"}