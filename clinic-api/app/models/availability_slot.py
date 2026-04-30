import uuid
from sqlalchemy import Column, String, Integer, Boolean, Time, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.base import Base

class DayOfWeek(str, enum.Enum):
    monday    = "monday"
    tuesday   = "tuesday"
    wednesday = "wednesday"
    thursday  = "thursday"
    friday    = "friday"
    saturday  = "saturday"
    sunday    = "sunday"

class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id             = Column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    day_of_week           = Column(SAEnum(DayOfWeek, name="day_of_week_enum", create_type=False), nullable=False)
    start_time            = Column(Time, nullable=False)
    end_time              = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    is_active             = Column(Boolean, default=True, nullable=False)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="availability_slots")

    __table_args__ = (
        UniqueConstraint("doctor_id", "day_of_week", "start_time", name="uq_doctor_day_start"),
        CheckConstraint("slot_duration_minutes IN (15, 20, 30, 45, 60)", name="chk_slot_duration"),
    )