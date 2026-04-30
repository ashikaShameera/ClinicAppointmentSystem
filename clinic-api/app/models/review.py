import uuid
from sqlalchemy import Column, SmallInteger, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id     = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id      = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    rating         = Column(SmallInteger, nullable=False)
    comment        = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_rating"),
    )

    appointment = relationship("Appointment", backref="review")
    patient     = relationship("Patient",     backref="reviews")
    doctor      = relationship("Doctor",      backref="reviews")