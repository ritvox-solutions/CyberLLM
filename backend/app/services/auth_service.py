import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.config import settings

# Pre-configured demo users for SOC team
USERS_DB = {
    "analyst": {
        "username": "analyst",
        "password": "socpassword123",
        "role": "SOC Analyst (Level 2)",
        "full_name": "Alex Mercer"
    },
    "admin": {
        "username": "admin",
        "password": "adminpassword123",
        "role": "SOC Lead / Admin",
        "full_name": "Sarah Connor"
    }
}

def verify_user(username: str, password: str) -> Optional[Dict]:
    user = USERS_DB.get(username)
    if user and user["password"] == password:
        return user
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
