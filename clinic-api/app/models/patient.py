import uuid
from sqlalchemy import Column, String, Date, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.base import Base

class GenderType(str, enum.Enum):
    male              = "male"
    female            = "female"
    other             = "other"
    prefer_not_to_say = "prefer_not_to_say"

class Patient(Base):
    __tablename__ = "patients"

    id                      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                 = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name               = Column(String(150), nullable=False)
    date_of_birth           = Column(Date, nullable=True)
    gender                  = Column(SAEnum(GenderType, name="gender_type", create_type=False), nullable=True)
    phone                   = Column(String(20), nullable=True)
    address                 = Column(Text, nullable=True)
    emergency_contact_name  = Column(String(150), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    blood_type              = Column(String(5), nullable=True)
    allergies               = Column(Text, nullable=True)
    deleted_at              = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="patient_profile")