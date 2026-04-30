import uuid
import enum
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Enum as SAEnum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class AppointmentStatus(str, enum.Enum):
    pending   = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show   = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id           = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id            = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    slot_id              = Column(UUID(as_uuid=True), ForeignKey("availability_slots.id"), nullable=True)
    appointment_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime         = Column(DateTime(timezone=True), nullable=False)
    status               = Column(SAEnum(AppointmentStatus, name="appointment_status", create_type=False), nullable=False, default=AppointmentStatus.pending)
    reason               = Column(Text, nullable=True)
    notes                = Column(Text, nullable=True)
    consultation_notes   = Column(Text, nullable=True)
    is_first_visit       = Column(Boolean, default=False)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    cancelled_at         = Column(DateTime(timezone=True), nullable=True)
    cancelled_by         = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    cancellation_reason  = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("end_datetime > appointment_datetime", name="chk_appt_times"),
    )

    patient      = relationship("Patient", backref="appointments")
    doctor       = relationship("Doctor",  backref="appointments")
    slot         = relationship("AvailabilitySlot", backref="appointments")
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])