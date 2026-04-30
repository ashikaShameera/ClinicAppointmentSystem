# from pydantic import BaseModel, UUID4
# from typing import Optional
# from datetime import date, datetime
# from enum import Enum

# class GenderEnum(str, Enum):
#     male              = "male"
#     female            = "female"
#     other             = "other"
#     prefer_not_to_say = "prefer_not_to_say"

# # ── Request schemas ──────────────────────────────────────────

# class PatientCreate(BaseModel):
#     full_name:               str
#     date_of_birth:           Optional[date]    = None
#     gender:                  Optional[GenderEnum] = None
#     phone:                   Optional[str]     = None
#     address:                 Optional[str]     = None
#     emergency_contact_name:  Optional[str]     = None
#     emergency_contact_phone: Optional[str]     = None
#     blood_type:              Optional[str]     = None
#     allergies:               Optional[str]     = None

# class PatientUpdate(BaseModel):
#     full_name:               Optional[str]     = None
#     date_of_birth:           Optional[date]    = None
#     gender:                  Optional[GenderEnum] = None
#     phone:                   Optional[str]     = None
#     address:                 Optional[str]     = None
#     emergency_contact_name:  Optional[str]     = None
#     emergency_contact_phone: Optional[str]     = None
#     blood_type:              Optional[str]     = None
#     allergies:               Optional[str]     = None

# # ── Response schemas ─────────────────────────────────────────

# class PatientResponse(BaseModel):
#     id:                      UUID4
#     user_id:                 UUID4
#     full_name:               str
#     date_of_birth:           Optional[date]       = None
#     gender:                  Optional[GenderEnum] = None
#     phone:                   Optional[str]        = None
#     address:                 Optional[str]        = None
#     emergency_contact_name:  Optional[str]        = None
#     emergency_contact_phone: Optional[str]        = None
#     blood_type:              Optional[str]        = None
#     allergies:               Optional[str]        = None
#     deleted_at:              Optional[datetime]   = None

#     model_config = {"from_attributes": True}

# class PatientListResponse(BaseModel):
#     total:    int
#     page:     int
#     per_page: int
#     patients: list[PatientResponse]


from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import date, datetime
from enum import Enum

class GenderEnum(str, Enum):
    male              = "male"
    female            = "female"
    other             = "other"
    prefer_not_to_say = "prefer_not_to_say"

class PatientCreate(BaseModel):
    full_name:               str
    date_of_birth:           Optional[date]       = None
    gender:                  Optional[GenderEnum] = None
    phone:                   Optional[str]        = None
    address:                 Optional[str]        = None
    emergency_contact_name:  Optional[str]        = None
    emergency_contact_phone: Optional[str]        = None
    blood_type:              Optional[str]        = None
    allergies:               Optional[str]        = None

class PatientUpdate(BaseModel):
    full_name:               Optional[str]        = None
    date_of_birth:           Optional[date]       = None
    gender:                  Optional[GenderEnum] = None
    phone:                   Optional[str]        = None
    address:                 Optional[str]        = None
    emergency_contact_name:  Optional[str]        = None
    emergency_contact_phone: Optional[str]        = None
    blood_type:              Optional[str]        = None
    allergies:               Optional[str]        = None

class PatientResponse(BaseModel):
    id:                      UUID
    user_id:                 UUID
    full_name:               str
    date_of_birth:           Optional[date]       = None
    gender:                  Optional[GenderEnum] = None
    phone:                   Optional[str]        = None
    address:                 Optional[str]        = None
    emergency_contact_name:  Optional[str]        = None
    emergency_contact_phone: Optional[str]        = None
    blood_type:              Optional[str]        = None
    allergies:               Optional[str]        = None
    deleted_at:              Optional[datetime]   = None

    model_config = {"from_attributes": True}

class PatientListResponse(BaseModel):
    total:    int
    page:     int
    per_page: int
    patients: list[PatientResponse]