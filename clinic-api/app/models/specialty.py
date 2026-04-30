from sqlalchemy import Column, Integer, String, Text
from app.database.base import Base

class Specialty(Base):
    __tablename__ = "specialties"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)