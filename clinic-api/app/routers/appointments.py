from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentStatusUpdate,
    AppointmentResponse, AppointmentListResponse
)
from app.services.appointment import calculate_end_datetime, check_conflict
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


# ── Helper: load appointment with relationships or 404 ───────
async def get_appointment_or_404(appt_id: uuid.UUID, db: AsyncSession) -> Appointment:
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
        .where(Appointment.id == appt_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


# ── Helper: get current user's patient record ────────────────
async def get_patient_for_user(user_id: uuid.UUID, db: AsyncSession) -> Patient:
    result = await db.execute(
        select(Patient).where(
            Patient.user_id   == user_id,
            Patient.deleted_at.is_(None)
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found. Please create your patient profile first."
        )
    return patient


# ── GET /api/appointments — admin full list ──────────────────
@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    page:      int                        = Query(1, ge=1),
    per_page:  int                        = Query(10, ge=1, le=100),
    doctor_id: Optional[uuid.UUID]        = Query(None),
    patient_id: Optional[uuid.UUID]       = Query(None),
    status:    Optional[AppointmentStatus]= Query(None),
    date_from: Optional[datetime]         = Query(None),
    date_to:   Optional[datetime]         = Query(None),
    db:        AsyncSession               = Depends(get_db),
    _:         dict                       = Depends(require_role("admin")),
):
    base = (
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
    )

    if doctor_id:
        base = base.where(Appointment.doctor_id  == doctor_id)
    if patient_id:
        base = base.where(Appointment.patient_id == patient_id)
    if status:
        base = base.where(Appointment.status     == status)
    if date_from:
        base = base.where(Appointment.appointment_datetime >= date_from)
    if date_to:
        base = base.where(Appointment.appointment_datetime <= date_to)

    total = (await db.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar_one()

    rows = (await db.execute(
        base
        .order_by(Appointment.appointment_datetime.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )).scalars().all()

    return AppointmentListResponse(
        total=total, page=page, per_page=per_page,
        appointments=[AppointmentResponse.model_validate(a) for a in rows]
    )


# ── GET /api/appointments/today — doctor's today schedule ───
@router.get("/today", response_model=list[AppointmentResponse])
async def todays_appointments(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0,  minute=0,  second=0,  microsecond=0)
    today_end   = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=0)

    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
        .where(
            Appointment.appointment_datetime >= today_start,
            Appointment.appointment_datetime <= today_end,
            Appointment.status.not_in([AppointmentStatus.cancelled, AppointmentStatus.no_show])
        )
    )

    # Doctors see only their own schedule
    if current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        query = query.where(Appointment.doctor_id == doctor.id)

    rows = (await db.execute(
        query.order_by(Appointment.appointment_datetime)
    )).scalars().all()

    return [AppointmentResponse.model_validate(a) for a in rows]


# ── GET /api/appointments/upcoming — next 7 days ────────────
@router.get("/upcoming", response_model=list[AppointmentResponse])
async def upcoming_appointments(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    from datetime import timedelta
    now      = datetime.now(timezone.utc)
    in7days  = now + timedelta(days=7)

    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
        .where(
            Appointment.appointment_datetime >= now,
            Appointment.appointment_datetime <= in7days,
            Appointment.status.not_in([AppointmentStatus.cancelled, AppointmentStatus.no_show])
        )
    )

    if current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if doctor:
            query = query.where(Appointment.doctor_id == doctor.id)

    elif current_user["role"] == "patient":
        patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)
        query = query.where(Appointment.patient_id == patient.id)

    rows = (await db.execute(
        query.order_by(Appointment.appointment_datetime)
    )).scalars().all()

    return [AppointmentResponse.model_validate(a) for a in rows]


# ── GET /api/appointments/:id ────────────────────────────────
@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: uuid.UUID,
    db:             AsyncSession = Depends(get_db),
    current_user:   dict         = Depends(get_current_user),
):
    appt = await get_appointment_or_404(appointment_id, db)

    # Patients can only view their own; doctors their own; admins all
    if current_user["role"] == "patient":
        patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)
        if appt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    elif current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor or appt.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return AppointmentResponse.model_validate(appt)


# ── POST /api/appointments — book an appointment ─────────────
@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    body:         AppointmentCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    # Get patient record for the logged-in user
    patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)

    # Verify doctor exists
    result = await db.execute(
        select(Doctor).where(
            Doctor.id == body.doctor_id,
            Doctor.deleted_at.is_(None)
        )
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.is_accepting:
        raise HTTPException(status_code=400, detail="Doctor is not accepting appointments")

    # Appointment must be in the future
    if body.appointment_datetime <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Appointment must be scheduled in the future")

    # Calculate end time from slot duration
    end_datetime = await calculate_end_datetime(
        body.appointment_datetime, body.slot_id, body.doctor_id, db
    )

    # ── Conflict detection ───────────────────────────────────
    conflict = await check_conflict(
        doctor_id=body.doctor_id,
        start=body.appointment_datetime,
        end=end_datetime,
        db=db,
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="This time slot is already booked. Please choose a different time."
        )

    appointment = Appointment(
        patient_id           = patient.id,
        doctor_id            = body.doctor_id,
        slot_id              = body.slot_id,
        appointment_datetime = body.appointment_datetime,
        end_datetime         = end_datetime,
        reason               = body.reason,
        notes                = body.notes,
        is_first_visit       = body.is_first_visit,
        status               = AppointmentStatus.pending,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return AppointmentResponse.model_validate(
        await get_appointment_or_404(appointment.id, db)
    )


# ── PUT /api/appointments/:id — reschedule or update notes ──
@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    body:           AppointmentUpdate,
    db:             AsyncSession = Depends(get_db),
    current_user:   dict         = Depends(get_current_user),
):
    appt = await get_appointment_or_404(appointment_id, db)

    if appt.status in [AppointmentStatus.completed, AppointmentStatus.cancelled]:
        raise HTTPException(status_code=400, detail=f"Cannot update a {appt.status} appointment")

    # Patients can only update their own; doctors can add consultation notes
    if current_user["role"] == "patient":
        patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)
        if appt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    elif current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor or appt.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Access denied")

    update_data = body.model_dump(exclude_unset=True)

    # If rescheduling, re-run conflict detection
    if "appointment_datetime" in update_data:
        new_start = update_data["appointment_datetime"]
        if new_start <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="New time must be in the future")

        new_end = await calculate_end_datetime(
            new_start,
            update_data.get("slot_id", appt.slot_id),
            appt.doctor_id,
            db,
        )
        conflict = await check_conflict(
            doctor_id=appt.doctor_id,
            start=new_start,
            end=new_end,
            db=db,
            exclude_id=appointment_id,
        )
        if conflict:
            raise HTTPException(status_code=409, detail="New time slot is already booked")

        update_data["end_datetime"] = new_end

    for field, value in update_data.items():
        setattr(appt, field, value)

    await db.commit()
    await db.refresh(appt)
    return AppointmentResponse.model_validate(
        await get_appointment_or_404(appointment_id, db)
    )


# ── PATCH /api/appointments/:id/status — confirm/cancel/complete
@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: uuid.UUID,
    body:           AppointmentStatusUpdate,
    db:             AsyncSession = Depends(get_db),
    current_user:   dict         = Depends(get_current_user),
):
    appt = await get_appointment_or_404(appointment_id, db)

    role = current_user["role"]

    # Role-based status transition rules
    allowed_transitions = {
        "patient": [AppointmentStatus.cancelled],
        "doctor":  [AppointmentStatus.confirmed, AppointmentStatus.completed,
                    AppointmentStatus.no_show,   AppointmentStatus.cancelled],
        "admin":   list(AppointmentStatus),
    }

    if body.status not in allowed_transitions.get(role, []):
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' cannot set status to '{body.status}'"
        )

    # Patients can only cancel their own
    if role == "patient":
        patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)
        if appt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Doctors can only update their own appointments
    if role == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor or appt.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Access denied")

    appt.status = body.status
    if body.status == AppointmentStatus.cancelled:
        appt.cancelled_at        = datetime.now(timezone.utc)
        appt.cancelled_by        = uuid.UUID(current_user["sub"])
        appt.cancellation_reason = body.cancellation_reason

    await db.commit()
    await db.refresh(appt)
    return AppointmentResponse.model_validate(
        await get_appointment_or_404(appointment_id, db)
    )


# ── GET /api/patients/:id/appointments — wire up patient route
@router.get("/patient/{patient_id}", response_model=AppointmentListResponse)
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
    # Patients can only view their own; admins can view anyone
    if current_user["role"] == "patient":
        patient = await get_patient_for_user(uuid.UUID(current_user["sub"]), db)
        if patient.id != patient_id:
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
        base = base.where(Appointment.status    == status)
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
        total=total, page=page, per_page=per_page,
        appointments=[AppointmentResponse.model_validate(a) for a in rows]
    )