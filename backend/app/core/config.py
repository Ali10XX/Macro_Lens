from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql://macrolens:macrolens_dev@localhost:5432/macrolens")
    
    # Redis settings
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379")
    
    # JWT settings
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI/ML API keys
    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    
    # External API keys
    API_NINJAS_KEY: str = os.environ.get("API_NINJAS_KEY", "")
    SPOONACULAR_API_KEY: str = os.environ.get("SPOONACULAR_API_KEY", "")
    USDA_API_KEY: str = os.environ.get("USDA_API_KEY", "")
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:8000", "http://localhost:8001"]
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_PATH: str = "/tmp/uploads"
    
    # Video processing settings
    MAX_VIDEO_SIZE: int = 100 * 1024 * 1024  # 100MB
    SUPPORTED_VIDEO_FORMATS: List[str] = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    
    # Social Media Recipe Import settings
    CRAWLER_CONCURRENT_REQUESTS: int = 5
    CRAWLER_DELAY: float = 1.0
    CRAWLER_TIMEOUT: int = 30
    
    class Config:
        env_file = "../config/.env"
        case_sensitive = True

settings = Settings()