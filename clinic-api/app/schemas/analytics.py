from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class SummaryResponse(BaseModel):
    total_patients:       int
    total_doctors:        int
    total_appointments:   int
    this_month:           int
    cancellation_rate_pct: float
    completion_rate_pct:  float

class DoctorStatResponse(BaseModel):
    doctor_id:            UUID
    doctor_name:          str
    specialty:            str
    rating:               float
    total_reviews:        int
    total_appointments:   int
    completed:            int
    cancelled:            int
    no_shows:             int
    completion_rate_pct:  float
    unique_patients:      int

class SpecialtyStatResponse(BaseModel):
    specialty_id:              int
    specialty_name:            str
    doctor_count:              int
    total_appointments:        int
    appointments_last_30_days: int

class PeakHourResponse(BaseModel):
    day_of_week_num: int
    day_name:        str
    hour_of_day:     int
    booking_count:   int