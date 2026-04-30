# from pydantic import BaseModel, UUID4
# from typing import Optional
# from datetime import datetime
# from decimal import Decimal
# from enum import Enum

# class AppointmentStatusEnum(str, Enum):
#     pending   = "pending"
#     confirmed = "confirmed"
#     completed = "completed"
#     cancelled = "cancelled"
#     no_show   = "no_show"

# # ── Request schemas ──────────────────────────────────────────

# class AppointmentCreate(BaseModel):
#     doctor_id:            UUID4
#     appointment_datetime: datetime
#     reason:               Optional[str]  = None
#     notes:                Optional[str]  = None
#     is_first_visit:       Optional[bool] = False
#     slot_id:              Optional[UUID4] = None

# class AppointmentUpdate(BaseModel):
#     appointment_datetime: Optional[datetime] = None
#     reason:               Optional[str]      = None
#     notes:                Optional[str]      = None
#     consultation_notes:   Optional[str]      = None
#     slot_id:              Optional[UUID4]    = None

# class AppointmentStatusUpdate(BaseModel):
#     status:              AppointmentStatusEnum
#     cancellation_reason: Optional[str] = None

# # ── Nested response schemas ──────────────────────────────────

# class PatientSummary(BaseModel):
#     id:        UUID4
#     full_name: str
#     phone:     Optional[str] = None
#     blood_type: Optional[str] = None

#     model_config = {"from_attributes": True}

# class DoctorSummary(BaseModel):
#     id:               UUID4
#     full_name:        str
#     consultation_fee: Decimal
#     clinic_address:   Optional[str] = None
#     clinic_lat:       Optional[Decimal] = None
#     clinic_lng:       Optional[Decimal] = None

#     model_config = {"from_attributes": True}

# # ── Full appointment response ────────────────────────────────

# class AppointmentResponse(BaseModel):
#     id:                   UUID4
#     patient_id:           UUID4
#     doctor_id:            UUID4
#     slot_id:              Optional[UUID4]             = None
#     appointment_datetime: datetime
#     end_datetime:         datetime
#     status:               AppointmentStatusEnum
#     reason:               Optional[str]               = None
#     notes:                Optional[str]               = None
#     consultation_notes:   Optional[str]               = None
#     is_first_visit:       bool
#     created_at:           datetime
#     updated_at:           datetime
#     cancelled_at:         Optional[datetime]           = None
#     cancellation_reason:  Optional[str]               = None
#     patient:              Optional[PatientSummary]    = None
#     doctor:               Optional[DoctorSummary]     = None

#     model_config = {"from_attributes": True}

# class AppointmentListResponse(BaseModel):
#     total:        int
#     page:         int
#     per_page:     int
#     appointments: list[AppointmentResponse]


from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum

class AppointmentStatusEnum(str, Enum):
    pending   = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show   = "no_show"

class AppointmentCreate(BaseModel):
    doctor_id:            UUID
    appointment_datetime: datetime
    reason:               Optional[str]  = None
    notes:                Optional[str]  = None
    is_first_visit:       Optional[bool] = False
    slot_id:              Optional[UUID] = None

class AppointmentUpdate(BaseModel):
    appointment_datetime: Optional[datetime] = None
    reason:               Optional[str]      = None
    notes:                Optional[str]      = None
    consultation_notes:   Optional[str]      = None
    slot_id:              Optional[UUID]     = None

class AppointmentStatusUpdate(BaseModel):
    status:              AppointmentStatusEnum
    cancellation_reason: Optional[str] = None

class PatientSummary(BaseModel):
    id:         UUID
    full_name:  str
    phone:      Optional[str] = None
    blood_type: Optional[str] = None

    model_config = {"from_attributes": True}

class DoctorSummary(BaseModel):
    id:               UUID
    full_name:        str
    consultation_fee: Decimal
    clinic_address:   Optional[str]     = None
    clinic_lat:       Optional[Decimal] = None
    clinic_lng:       Optional[Decimal] = None

    model_config = {"from_attributes": True}

class AppointmentResponse(BaseModel):
    id:                   UUID
    patient_id:           UUID
    doctor_id:            UUID
    slot_id:              Optional[UUID]          = None
    appointment_datetime: datetime
    end_datetime:         datetime
    status:               AppointmentStatusEnum
    reason:               Optional[str]           = None
    notes:                Optional[str]           = None
    consultation_notes:   Optional[str]           = None
    is_first_visit:       bool
    created_at:           datetime
    updated_at:           datetime
    cancelled_at:         Optional[datetime]      = None
    cancellation_reason:  Optional[str]           = None
    patient:              Optional[PatientSummary] = None
    doctor:               Optional[DoctorSummary]  = None

    model_config = {"from_attributes": True}

class AppointmentListResponse(BaseModel):
    total:        int
    page:         int
    per_page:     int
    appointments: list[AppointmentResponse]