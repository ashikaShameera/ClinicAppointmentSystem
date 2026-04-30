import uuid
from sqlalchemy import Column, Text, Date, DateTime, ForeignKey, ARRAY, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id     = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id      = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    diagnosis      = Column(Text, nullable=True)
    prescription   = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    attachments    = Column(ARRAY(String), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    appointment = relationship("Appointment", backref="medical_record")
    patient     = relationship("Patient",     backref="medical_records")
    doctor      = relationship("Doctor",      backref="medical_records")