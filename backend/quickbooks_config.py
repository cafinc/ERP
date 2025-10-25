from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional
import os

class QuickBooksSettings(BaseSettings):
    """QuickBooks Online configuration"""
    QUICKBOOKS_CLIENT_ID: Optional[str] = None
    QUICKBOOKS_CLIENT_SECRET: Optional[str] = None
    QUICKBOOKS_REDIRECT_URI: str = "https://client-hub-48.preview.emergentagent.com/api/quickbooks/auth/callback"
    QUICKBOOKS_ENVIRONMENT: str = "sandbox"  # or "production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_quickbooks_settings() -> QuickBooksSettings:
    return QuickBooksSettings()
