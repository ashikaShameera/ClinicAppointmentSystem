from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from sqlalchemy.sql import func

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.patient,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    })
    return TokenResponse(access_token=token, role=user.role.value, user_id=str(user.id))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    # Update last_login
    user.last_login = func.now()
    await db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    })
    return TokenResponse(access_token=token, role=user.role.value, user_id=str(user.id))


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    # JWT is stateless — client discards the token.
    # For production add a token blacklist (Redis recommended).
    return {"message": "Logged out successfully"}