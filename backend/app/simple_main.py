from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

# Initialize FastAPI app
app = FastAPI(
    title="MacroLens API (Simplified)",
    description="Simplified version for development",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock settings
SECRET_KEY = "your-super-secret-jwt-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock user database (in-memory for testing)
mock_users = {
    "user@example.com": {
        "id": "1",
        "email": "user@example.com",
        "username": "testuser",
        "hashed_password": pwd_context.hash("password123"),
        "first_name": "Test",
        "last_name": "User",
        "isPremium": False
    }
}

# Pydantic models
class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: str
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    isPremium: bool = False

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(email: str):
    if email in mock_users:
        return mock_users[email]
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

# Routes
@app.get("/")
async def root():
    return {"message": "MacroLens API (Simplified)", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "mode": "simplified"}

@app.post("/api/v1/auth/register", response_model=User)
async def register_user(user_data: UserRegister):
    # Check if user already exists
    if user_data.email in mock_users:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create new user
    user_id = str(len(mock_users) + 1)
    hashed_password = get_password_hash(user_data.password)
    
    new_user = {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "hashed_password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "isPremium": False
    }
    
    mock_users[user_data.email] = new_user
    
    # Return user data (without password)
    return User(**{k: v for k, v in new_user.items() if k != "hashed_password"})

@app.post("/api/v1/auth/login", response_model=Token)
async def login_user(user_data: UserLogin):
    user = authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/users/me", response_model=User)
async def get_current_user():
    # For simplicity, return a mock user
    # In a real app, you'd decode the JWT token from the Authorization header
    return User(
        id="1",
        email="user@example.com",
        username="testuser",
        first_name="Test",
        last_name="User",
        isPremium=False
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 