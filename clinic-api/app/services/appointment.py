from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

from app.models.appointment import Appointment, AppointmentStatus
from app.models.availability_slot import AvailabilitySlot
import uuid

async def calculate_end_datetime(
    appointment_datetime: datetime,
    slot_id: uuid.UUID | None,
    doctor_id: uuid.UUID,
    db: AsyncSession,
) -> datetime:
    """Calculate end time based on slot duration, default 30 mins."""
    duration = 30
    if slot_id:
        result = await db.execute(
            select(AvailabilitySlot).where(AvailabilitySlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()
        if slot:
            duration = slot.slot_duration_minutes
    return appointment_datetime + timedelta(minutes=duration)


async def check_conflict(
    doctor_id:   uuid.UUID,
    start:       datetime,
    end:         datetime,
    db:          AsyncSession,
    exclude_id:  uuid.UUID | None = None,
) -> bool:
    """
    Returns True if the doctor already has a booking that overlaps
    the given [start, end) range.
    Excludes the appointment being rescheduled (exclude_id).
    """
    query = select(Appointment).where(
        and_(
            Appointment.doctor_id == doctor_id,
            Appointment.status.not_in([
                AppointmentStatus.cancelled,
                AppointmentStatus.no_show
            ]),
            Appointment.appointment_datetime < end,
            Appointment.end_datetime         > start,
        )
    )
    if exclude_id:
        query = query.where(Appointment.id != exclude_id)

    result = await db.execute(query)
    return result.scalar_one_or_none() is not None