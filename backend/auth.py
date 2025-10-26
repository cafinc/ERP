"""
JWT Token Validation and Authentication Utilities
"""
import jwt
import os
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE-THIS-SECRET-KEY-IN-PRODUCTION-USE-LONG-RANDOM-STRING")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary containing user data to encode in token
        expires_delta: Optional custom expiration time
    
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()})
    to_encode.update({"iat": datetime.now(timezone.utc).timestamp()})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def validate_token(token: str) -> dict:
    """
    Validate JWT token and return user data
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing decoded token data
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check expiration
        if payload.get('exp') < datetime.now(timezone.utc).timestamp():
            raise HTTPException(status_code=401, detail="Token expired")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

def decode_token_no_verify(token: str) -> dict:
    """
    Decode token without verification (for debugging only)
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing decoded token data
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        return {"error": str(e)}

def get_token_expiry(token: str) -> datetime:
    """
    Get token expiration datetime
    
    Args:
        token: JWT token string
    
    Returns:
        datetime object representing token expiration
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get('exp', 0)
        return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)
