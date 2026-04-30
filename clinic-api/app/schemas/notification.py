from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationTypeEnum(str, Enum):
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    reminder          = "reminder"
    rescheduled       = "rescheduled"

class NotificationResponse(BaseModel):
    id:             UUID
    user_id:        UUID
    type:           NotificationTypeEnum
    title:          str
    message:        str
    is_read:        bool
    appointment_id: Optional[UUID]     = None
    created_at:     datetime
    read_at:        Optional[datetime] = None

    model_config = {"from_attributes": True}