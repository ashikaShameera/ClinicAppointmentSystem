from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, EmailStr
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.utils.hashing import hash_password
from app.utils.dependencies import require_role
from app.schemas.patient import PatientResponse
from app.schemas.doctor import DoctorResponse
import uuid

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    email:     EmailStr
    password:  str
    role:      str   # doctor | admin


# ── POST /api/admin/create-user
# Admin creates a doctor or admin account
@router.post("/create-user", status_code=status.HTTP_201_CREATED)
async def create_user(
    body: CreateUserRequest,
    db:   AsyncSession = Depends(get_db),
    _:    dict         = Depends(require_role("admin")),
):
    if body.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be 'doctor' or 'admin'")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email         = body.email,
        password_hash = hash_password(body.password),
        role          = UserRole(body.role),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"id": str(user.id), "email": user.email, "role": user.role}


# ── GET /api/admin/users — list all users with role filter
@router.get("/users")
async def list_users(
    role: str | None = None,
    db:   AsyncSession = Depends(get_db),
    _:    dict         = Depends(require_role("admin")),
):
    query = select(User)
    if role:
        query = query.where(User.role == UserRole(role))
    result = await db.execute(query.order_by(User.created_at.desc()))
    users  = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "role": u.role, "is_active": u.is_active, "created_at": u.created_at} for u in users]


# ── PATCH /api/admin/users/:id/toggle — activate or deactivate
@router.patch("/users/{user_id}/toggle")
async def toggle_user(
    user_id: uuid.UUID,
    db:      AsyncSession = Depends(get_db),
    _:       dict         = Depends(require_role("admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"id": str(user.id), "email": user.email, "is_active": user.is_active}