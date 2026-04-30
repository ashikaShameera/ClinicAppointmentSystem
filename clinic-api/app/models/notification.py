import uuid
import enum
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class NotificationType(str, enum.Enum):
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    reminder          = "reminder"
    rescheduled       = "rescheduled"

class Notification(Base):
    __tablename__ = "notifications"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type           = Column(SAEnum(NotificationType, name="notification_type", create_type=False), nullable=False)
    title          = Column(String(255), nullable=False)
    message        = Column(Text, nullable=False)
    is_read        = Column(Boolean, default=False, nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    read_at        = Column(DateTime(timezone=True), nullable=True)

    user        = relationship("User",        backref="notifications")
    appointment = relationship("Appointment", backref="notifications")