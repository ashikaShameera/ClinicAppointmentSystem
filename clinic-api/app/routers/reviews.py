from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database.session import get_db
from app.models.review import Review
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.schemas.review import ReviewCreate, ReviewResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


# ── POST /api/reviews — patient submits review after completed appt
@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    body:         ReviewCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    # Only patients can leave reviews
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can submit reviews")

    result = await db.execute(
        select(Patient).where(Patient.user_id == uuid.UUID(current_user["sub"]))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Verify appointment is completed and belongs to this patient
    result = await db.execute(
        select(Appointment).where(Appointment.id == body.appointment_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="This appointment does not belong to you")
    if appt.status != AppointmentStatus.completed:
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed appointments")

    # Check no duplicate review
    existing = await db.execute(
        select(Review).where(Review.appointment_id == body.appointment_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this appointment")

    review = Review(
        appointment_id = body.appointment_id,
        patient_id     = patient.id,
        doctor_id      = appt.doctor_id,
        rating         = body.rating,
        comment        = body.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewResponse.model_validate(review)


# ── GET /api/reviews/doctor/:id — all reviews for a doctor
@router.get("/doctor/{doctor_id}", response_model=list[ReviewResponse])
async def get_doctor_reviews(
    doctor_id: uuid.UUID,
    db:        AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.doctor_id == doctor_id)
        .order_by(Review.created_at.desc())
    )
    return [ReviewResponse.model_validate(r) for r in result.scalars().all()]