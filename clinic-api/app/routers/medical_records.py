from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.database.session import get_db
from app.models.medical_record import MedicalRecord
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/medical-records", tags=["medical-records"])


async def get_record_or_404(record_id: uuid.UUID, db: AsyncSession) -> MedicalRecord:
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return record


# ── POST /api/medical-records — doctor creates after appointment
@router.post("", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    body:         MedicalRecordCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    # Verify appointment exists and is completed
    result = await db.execute(
        select(Appointment).where(Appointment.id == body.appointment_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.status != AppointmentStatus.completed:
        raise HTTPException(status_code=400, detail="Medical records can only be created for completed appointments")

    # Only the doctor for that appointment or admin can create
    if current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor or doctor.id != appt.doctor_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Check record doesn't already exist
    existing = await db.execute(
        select(MedicalRecord).where(MedicalRecord.appointment_id == body.appointment_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Medical record already exists for this appointment")

    record = MedicalRecord(
        appointment_id = body.appointment_id,
        patient_id     = appt.patient_id,
        doctor_id      = appt.doctor_id,
        diagnosis      = body.diagnosis,
        prescription   = body.prescription,
        follow_up_date = body.follow_up_date,
        attachments    = body.attachments,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return MedicalRecordResponse.model_validate(record)


# ── GET /api/medical-records/patient/:id — patient's full history
@router.get("/patient/{patient_id}", response_model=list[MedicalRecordResponse])
async def get_patient_records(
    patient_id:   uuid.UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    # Patients can only view their own records
    if current_user["role"] == "patient":
        result = await db.execute(
            select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
        )
        own = result.scalar_one_or_none()
        if not own or own.id != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(MedicalRecord)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.created_at.desc())
    )
    return [MedicalRecordResponse.model_validate(r) for r in result.scalars().all()]


# ── GET /api/medical-records/:id — single record
@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_record(
    record_id:    uuid.UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    record = await get_record_or_404(record_id, db)

    if current_user["role"] == "patient":
        result = await db.execute(
            select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
        )
        own = result.scalar_one_or_none()
        if not own or own.id != record.patient_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return MedicalRecordResponse.model_validate(record)


# ── PUT /api/medical-records/:id — doctor updates record
@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_record(
    record_id:    uuid.UUID,
    body:         MedicalRecordUpdate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    record = await get_record_or_404(record_id, db)

    if current_user["role"] == "doctor":
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == uuid.UUID(current_user["sub"]))
        )
        doctor = result.scalar_one_or_none()
        if not doctor or doctor.id != record.doctor_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot edit medical records")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    await db.commit()
    await db.refresh(record)
    return MedicalRecordResponse.model_validate(record)