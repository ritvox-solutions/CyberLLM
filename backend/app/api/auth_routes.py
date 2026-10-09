from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserLogin, Token
from app.services.auth_service import verify_user, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = verify_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return Token(
        access_token=token,
        token_type="bearer",
        username=user["username"],
        role=user["role"]
    )
