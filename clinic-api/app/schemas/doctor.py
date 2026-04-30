# from pydantic import BaseModel, UUID4
# from typing import Optional
# from datetime import datetime, time
# from decimal import Decimal
# from enum import Enum

# class DayOfWeekEnum(str, Enum):
#     monday    = "monday"
#     tuesday   = "tuesday"
#     wednesday = "wednesday"
#     thursday  = "thursday"
#     friday    = "friday"
#     saturday  = "saturday"
#     sunday    = "sunday"

# # ── Specialty ────────────────────────────────────────────────

# class SpecialtyResponse(BaseModel):
#     id:          int
#     name:        str
#     description: Optional[str] = None

#     model_config = {"from_attributes": True}

# # ── Availability slot ────────────────────────────────────────

# class SlotCreate(BaseModel):
#     day_of_week:           DayOfWeekEnum
#     start_time:            time
#     end_time:              time
#     slot_duration_minutes: Optional[int] = 30

# class SlotResponse(BaseModel):
#     id:                    UUID4
#     doctor_id:             UUID4
#     day_of_week:           DayOfWeekEnum
#     start_time:            time
#     end_time:              time
#     slot_duration_minutes: int
#     is_active:             bool

#     model_config = {"from_attributes": True}

# # ── Doctor ───────────────────────────────────────────────────

# class DoctorCreate(BaseModel):
#     user_id:          UUID4
#     specialty_id:     int
#     full_name:        str
#     bio:              Optional[str]     = None
#     qualification:    Optional[str]     = None
#     experience_years: Optional[int]     = 0
#     consultation_fee: Optional[Decimal] = Decimal("0.00")
#     clinic_address:   Optional[str]     = None
#     clinic_lat:       Optional[Decimal] = None
#     clinic_lng:       Optional[Decimal] = None
#     phone:            Optional[str]     = None
#     is_accepting:     Optional[bool]    = True

# class DoctorUpdate(BaseModel):
#     specialty_id:     Optional[int]     = None
#     full_name:        Optional[str]     = None
#     bio:              Optional[str]     = None
#     qualification:    Optional[str]     = None
#     experience_years: Optional[int]     = None
#     consultation_fee: Optional[Decimal] = None
#     clinic_address:   Optional[str]     = None
#     clinic_lat:       Optional[Decimal] = None
#     clinic_lng:       Optional[Decimal] = None
#     phone:            Optional[str]     = None
#     is_accepting:     Optional[bool]    = None

# class DoctorResponse(BaseModel):
#     id:               UUID4
#     user_id:          UUID4
#     full_name:        str
#     bio:              Optional[str]     = None
#     qualification:    Optional[str]     = None
#     experience_years: int
#     consultation_fee: Decimal
#     clinic_address:   Optional[str]     = None
#     clinic_lat:       Optional[Decimal] = None
#     clinic_lng:       Optional[Decimal] = None
#     phone:            Optional[str]     = None
#     is_accepting:     bool
#     rating:           Decimal
#     total_reviews:    int
#     specialty:        Optional[SpecialtyResponse] = None
#     slots:            list[SlotResponse]          = []

#     model_config = {"from_attributes": True}

# class DoctorListResponse(BaseModel):
#     total:   int
#     page:    int
#     per_page: int
#     doctors: list[DoctorResponse]


from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import time
from decimal import Decimal
from enum import Enum

class DayOfWeekEnum(str, Enum):
    monday    = "monday"
    tuesday   = "tuesday"
    wednesday = "wednesday"
    thursday  = "thursday"
    friday    = "friday"
    saturday  = "saturday"
    sunday    = "sunday"

class SpecialtyResponse(BaseModel):
    id:          int
    name:        str
    description: Optional[str] = None

    model_config = {"from_attributes": True}

class SlotCreate(BaseModel):
    day_of_week:           DayOfWeekEnum
    start_time:            time
    end_time:              time
    slot_duration_minutes: Optional[int] = 30

class SlotResponse(BaseModel):
    id:                    UUID
    doctor_id:             UUID
    day_of_week:           DayOfWeekEnum
    start_time:            time
    end_time:              time
    slot_duration_minutes: int
    is_active:             bool

    model_config = {"from_attributes": True}

class DoctorCreate(BaseModel):
    user_id:          UUID
    specialty_id:     int
    full_name:        str
    bio:              Optional[str]     = None
    qualification:    Optional[str]     = None
    experience_years: Optional[int]     = 0
    consultation_fee: Optional[Decimal] = Decimal("0.00")
    clinic_address:   Optional[str]     = None
    clinic_lat:       Optional[Decimal] = None
    clinic_lng:       Optional[Decimal] = None
    phone:            Optional[str]     = None
    is_accepting:     Optional[bool]    = True

class DoctorUpdate(BaseModel):
    specialty_id:     Optional[int]     = None
    full_name:        Optional[str]     = None
    bio:              Optional[str]     = None
    qualification:    Optional[str]     = None
    experience_years: Optional[int]     = None
    consultation_fee: Optional[Decimal] = None
    clinic_address:   Optional[str]     = None
    clinic_lat:       Optional[Decimal] = None
    clinic_lng:       Optional[Decimal] = None
    phone:            Optional[str]     = None
    is_accepting:     Optional[bool]    = None

class DoctorResponse(BaseModel):
    id:               UUID
    user_id:          UUID
    full_name:        str
    bio:              Optional[str]     = None
    qualification:    Optional[str]     = None
    experience_years: int
    consultation_fee: Decimal
    clinic_address:   Optional[str]     = None
    clinic_lat:       Optional[Decimal] = None
    clinic_lng:       Optional[Decimal] = None
    phone:            Optional[str]     = None
    is_accepting:     bool
    rating:           Decimal
    total_reviews:    int
    specialty:        Optional[SpecialtyResponse] = None
    slots:            list[SlotResponse]          = []

    model_config = {"from_attributes": True}

class DoctorListResponse(BaseModel):
    total:    int
    page:     int
    per_page: int
    doctors:  list[DoctorResponse]