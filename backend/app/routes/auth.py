from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from databases import Database
from app.core.database import database
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import UserCreate, UserLogin, UserResponse, Token
import uuid
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await database.fetch_one(
        "SELECT id FROM users WHERE email = :email OR username = :username",
        {"email": user_data.email, "username": user_data.username}
    )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    query = """
        INSERT INTO users (id, email, username, password_hash, first_name, last_name)
        VALUES (:id, :email, :username, :password_hash, :first_name, :last_name)
        RETURNING *
    """
    
    new_user = await database.fetch_one(query, {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name
    })
    
    return UserResponse(**new_user)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user by email or username
    user = await database.fetch_one(
        "SELECT * FROM users WHERE (email = :identifier OR username = :identifier) AND is_active = true",
        {"identifier": credentials.identifier}
    )
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    
    # Return token with user data for frontend
    return Token(
        access_token=access_token, 
        token_type="bearer",
        user=UserResponse(**user)
    )

@router.post("/logout")
async def logout():
    # For JWT, logout is handled client-side by removing the token
    return {"message": "Successfully logged out"}