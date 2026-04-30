from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.doctor import Doctor
from app.models.specialty import Specialty
from app.models.availability_slot import AvailabilitySlot
from app.models.user import User, UserRole
from app.schemas.doctor import (
    DoctorCreate, DoctorUpdate, DoctorResponse, DoctorListResponse,
    SlotCreate, SlotResponse, SpecialtyResponse
)
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


# ── Helper: fetch active doctor or 404 ──────────────────────
async def get_active_doctor(doctor_id: uuid.UUID, db: AsyncSession) -> Doctor:
    result = await db.execute(
        select(Doctor)
        .options(
            selectinload(Doctor.specialty),
            selectinload(Doctor.availability_slots)
        )
        .where(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        )
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


# ── GET /api/doctors — public list with search + filter ─────
@router.get("", response_model=DoctorListResponse)
async def list_doctors(
    page:         int           = Query(1, ge=1),
    per_page:     int           = Query(10, ge=1, le=100),
    search:       Optional[str] = Query(None, description="Search by name"),
    specialty_id: Optional[int] = Query(None, description="Filter by specialty"),
    is_accepting: Optional[bool]= Query(None, description="Filter by accepting patients"),
    db:           AsyncSession  = Depends(get_db),
):
    base_query = (
        select(Doctor)
        .options(
            selectinload(Doctor.specialty),
            selectinload(Doctor.availability_slots)
        )
        .where(Doctor.deleted_at.is_(None))
    )

    if search:
        base_query = base_query.where(Doctor.full_name.ilike(f"%{search}%"))

    if specialty_id is not None:
        base_query = base_query.where(Doctor.specialty_id == specialty_id)

    if is_accepting is not None:
        base_query = base_query.where(Doctor.is_accepting == is_accepting)

    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    rows_result = await db.execute(
        base_query
        .order_by(Doctor.full_name)
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    doctors = rows_result.scalars().all()

    return DoctorListResponse(
        total=total,
        page=page,
        per_page=per_page,
        doctors=[DoctorResponse.model_validate(d) for d in doctors],
    )


# ── GET /api/doctors/:id ─────────────────────────────────────
@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: uuid.UUID,
    db:        AsyncSession = Depends(get_db),
):
    return DoctorResponse.model_validate(await get_active_doctor(doctor_id, db))


# ── POST /api/doctors — admin creates doctor profile ────────
@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    body: DoctorCreate,
    db:   AsyncSession = Depends(get_db),
    _:    dict         = Depends(require_role("admin")),
):
    # Verify the user exists and has doctor role
    user_result = await db.execute(
        select(User).where(User.id == body.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != UserRole.doctor:
        raise HTTPException(status_code=400, detail="User must have role 'doctor'")

    # Verify specialty exists
    spec_result = await db.execute(
        select(Specialty).where(Specialty.id == body.specialty_id)
    )
    if not spec_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Specialty not found")

    # Check profile doesn't already exist
    existing = await db.execute(
        select(Doctor).where(Doctor.user_id == body.user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Doctor profile already exists for this user")

    doctor = Doctor(**body.model_dump())
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return DoctorResponse.model_validate(await get_active_doctor(doctor.id, db))


# ── PUT /api/doctors/:id — update profile ───────────────────
@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id:    uuid.UUID,
    body:         DoctorUpdate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    doctor = await get_active_doctor(doctor_id, db)

    # Doctors can only update their own profile; admins can update any
    if current_user["role"] == "doctor":
        own = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        own_doctor = own.scalar_one_or_none()
        if not own_doctor or own_doctor.id != doctor_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Verify specialty if being changed
    if body.specialty_id is not None:
        spec = await db.execute(
            select(Specialty).where(Specialty.id == body.specialty_id)
        )
        if not spec.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Specialty not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)

    await db.commit()
    await db.refresh(doctor)
    return DoctorResponse.model_validate(await get_active_doctor(doctor_id, db))


# ── DELETE /api/doctors/:id — soft delete, admin only ───────
@router.delete("/{doctor_id}", status_code=status.HTTP_200_OK)
async def delete_doctor(
    doctor_id: uuid.UUID,
    db:        AsyncSession = Depends(get_db),
    _:         dict         = Depends(require_role("admin")),
):
    doctor = await get_active_doctor(doctor_id, db)
    doctor.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Doctor deleted successfully", "doctor_id": str(doctor_id)}


# ── POST /api/doctors/:id/slots — doctor sets availability ──
@router.post("/{doctor_id}/slots", response_model=SlotResponse, status_code=status.HTTP_201_CREATED)
async def add_availability_slot(
    doctor_id:    uuid.UUID,
    body:         SlotCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    doctor = await get_active_doctor(doctor_id, db)

    # Only the doctor themselves or admin can set slots
    if current_user["role"] == "doctor":
        own = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        own_doctor = own.scalar_one_or_none()
        if not own_doctor or own_doctor.id != doctor_id:
            raise HTTPException(status_code=403, detail="Access denied")

    if body.end_time <= body.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    # Check for duplicate slot
    existing = await db.execute(
        select(AvailabilitySlot).where(
            AvailabilitySlot.doctor_id   == doctor_id,
            AvailabilitySlot.day_of_week == body.day_of_week,
            AvailabilitySlot.start_time  == body.start_time,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slot already exists for this day and time")

    slot = AvailabilitySlot(doctor_id=doctor_id, **body.model_dump())
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return SlotResponse.model_validate(slot)


# ── GET /api/doctors/:id/slots — get doctor's availability ──
@router.get("/{doctor_id}/slots", response_model=list[SlotResponse])
async def get_availability_slots(
    doctor_id:    uuid.UUID,
    db:           AsyncSession = Depends(get_db),
):
    await get_active_doctor(doctor_id, db)

    result = await db.execute(
        select(AvailabilitySlot)
        .where(
            AvailabilitySlot.doctor_id == doctor_id,
            AvailabilitySlot.is_active == True,
        )
        .order_by(AvailabilitySlot.day_of_week, AvailabilitySlot.start_time)
    )
    return [SlotResponse.model_validate(s) for s in result.scalars().all()]


# ── DELETE /api/doctors/:id/slots/:slot_id — remove a slot ──
@router.delete("/{doctor_id}/slots/{slot_id}", status_code=status.HTTP_200_OK)
async def delete_slot(
    doctor_id:    uuid.UUID,
    slot_id:      uuid.UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    result = await db.execute(
        select(AvailabilitySlot).where(
            AvailabilitySlot.id        == slot_id,
            AvailabilitySlot.doctor_id == doctor_id,
        )
    )
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if current_user["role"] == "doctor":
        own = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        own_doctor = own.scalar_one_or_none()
        if not own_doctor or own_doctor.id != doctor_id:
            raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(slot)
    await db.commit()
    return {"message": "Slot removed", "slot_id": str(slot_id)}


# ── GET /api/specialties — public lookup list ────────────────
@router.get("/specialties/all", response_model=list[SpecialtyResponse], tags=["specialties"])
async def list_specialties(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Specialty).order_by(Specialty.name))
    return [SpecialtyResponse.model_validate(s) for s in result.scalars().all()]