from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import date, datetime

class MedicalRecordCreate(BaseModel):
    appointment_id: UUID
    diagnosis:      Optional[str]       = None
    prescription:   Optional[str]       = None
    follow_up_date: Optional[date]      = None
    attachments:    Optional[List[str]] = None

class MedicalRecordUpdate(BaseModel):
    diagnosis:      Optional[str]       = None
    prescription:   Optional[str]       = None
    follow_up_date: Optional[date]      = None
    attachments:    Optional[List[str]] = None

class MedicalRecordResponse(BaseModel):
    id:             UUID
    appointment_id: UUID
    patient_id:     UUID
    doctor_id:      UUID
    diagnosis:      Optional[str]       = None
    prescription:   Optional[str]       = None
    follow_up_date: Optional[date]      = None
    attachments:    Optional[List[str]] = None
    created_at:     datetime
    updated_at:     datetime

    model_config = {"from_attributes": True}