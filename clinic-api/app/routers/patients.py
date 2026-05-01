from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.schemas.appointment import AppointmentResponse, AppointmentListResponse
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/patients", tags=["patients"])


# ── Helper: fetch active patient or 404 ─────────────────────
async def get_active_patient(patient_id: uuid.UUID, db: AsyncSession) -> Patient:
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.deleted_at.is_(None)
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# ── GET /api/patients — admin only, paginated + searchable ──
@router.get("", response_model=PatientListResponse)
async def list_patients(
    page:     int            = Query(1, ge=1),
    per_page: int            = Query(10, ge=1, le=100),
    search:   Optional[str] = Query(None, description="Search by name or email"),
    db:       AsyncSession   = Depends(get_db),
    _:        dict           = Depends(require_role("admin")),
):
    base_query = (
        select(Patient)
        .join(User, Patient.user_id == User.id)
        .where(Patient.deleted_at.is_(None))
    )

    if search:
        term = f"%{search}%"
        base_query = base_query.where(
            or_(
                Patient.full_name.ilike(term),
                User.email.ilike(term),
            )
        )

    # Total count
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    # Paginated rows
    rows_result = await db.execute(
        base_query
        .order_by(Patient.full_name)
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    patients = rows_result.scalars().all()

    return PatientListResponse(
        total=total,
        page=page,
        per_page=per_page,
        patients=[PatientResponse.model_validate(p) for p in patients],
    )


# GET /api/patients/me — returns the logged-in patient's own profile
@router.get("/me", response_model=PatientResponse)
async def get_my_profile(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(
            Patient.user_id   == uuid.UUID(current_user["sub"]),
            Patient.deleted_at.is_(None)
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return PatientResponse.model_validate(patient)


# ── GET /api/patients/:id ────────────────────────────────────
@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id:   uuid.UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    patient = await get_active_patient(patient_id, db)

    # Patients can only view their own profile; admins can view any
    if current_user["role"] == "patient":
        result = await db.execute(
            select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
        )
        own = result.scalar_one_or_none()
        if not own or own.id != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return PatientResponse.model_validate(patient)


# ── POST /api/patients — create patient profile ──────────────
@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body:         PatientCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    user_id = uuid.UUID(current_user["sub"])

    # Check a profile doesn't already exist for this user
    existing = await db.execute(
        select(Patient).where(Patient.user_id == user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Patient profile already exists for this user")

    patient = Patient(user_id=user_id, **body.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


# ── PUT /api/patients/:id — update profile ───────────────────
@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id:   uuid.UUID,
    body:         PatientUpdate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    patient = await get_active_patient(patient_id, db)

    # Patients can only edit their own profile
    if current_user["role"] == "patient":
        result = await db.execute(
            select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
        )
        own = result.scalar_one_or_none()
        if not own or own.id != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Only update fields that were actually sent
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


# ── DELETE /api/patients/:id — soft delete ───────────────────
@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
async def delete_patient(
    patient_id: uuid.UUID,
    db:         AsyncSession = Depends(get_db),
    _:          dict         = Depends(require_role("admin")),
):
    patient = await get_active_patient(patient_id, db)
    patient.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Patient deleted successfully", "patient_id": str(patient_id)}


# ── GET /api/patients/:id/appointments ──────────────────────
@router.get("/{patient_id}/appointments", response_model=AppointmentListResponse)
async def get_patient_appointments(
    patient_id:   uuid.UUID,
    page:         int                         = Query(1, ge=1),
    per_page:     int                         = Query(10, ge=1, le=100),
    status:       Optional[AppointmentStatus] = Query(None),
    date_from:    Optional[datetime]          = Query(None),
    date_to:      Optional[datetime]          = Query(None),
    db:           AsyncSession                = Depends(get_db),
    current_user: dict                        = Depends(get_current_user),
):
    # Verify patient exists
    await get_active_patient(patient_id, db)

    # Patients can only view their own appointments
    if current_user["role"] == "patient":
        result = await db.execute(
            select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
        )
        own = result.scalar_one_or_none()
        if not own or own.id != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")

    base = (
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
        .where(Appointment.patient_id == patient_id)
    )

    if status:
        base = base.where(Appointment.status == status)
    if date_from:
        base = base.where(Appointment.appointment_datetime >= date_from)
    if date_to:
        base = base.where(Appointment.appointment_datetime <= date_to)

    total = (await db.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar_one()

    rows = (await db.execute(
        base.order_by(Appointment.appointment_datetime.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )).scalars().all()

    return AppointmentListResponse(
        total=total,
        page=page,
        per_page=per_page,
        appointments=[AppointmentResponse.model_validate(a) for a in rows]
    )


