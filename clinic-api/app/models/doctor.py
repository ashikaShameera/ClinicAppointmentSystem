import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id           = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty_id      = Column(Integer, ForeignKey("specialties.id"), nullable=False)
    full_name         = Column(String(150), nullable=False)
    bio               = Column(Text, nullable=True)
    qualification     = Column(String(255), nullable=True)
    experience_years  = Column(Integer, default=0)
    consultation_fee  = Column(Numeric(8, 2), default=0.00)
    clinic_address    = Column(Text, nullable=True)
    clinic_lat        = Column(Numeric(10, 7), nullable=True)
    clinic_lng        = Column(Numeric(10, 7), nullable=True)
    phone             = Column(String(20), nullable=True)
    is_accepting      = Column(Boolean, default=True, nullable=False)
    rating            = Column(Numeric(3, 2), default=0.00)
    total_reviews     = Column(Integer, default=0)
    deleted_at        = Column(DateTime(timezone=True), nullable=True)

    user              = relationship("User", backref="doctor_profile")
    specialty         = relationship("Specialty", backref="doctors")
    availability_slots = relationship("AvailabilitySlot", back_populates="doctor", cascade="all, delete-orphan")