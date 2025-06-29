from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.sql import func
from pydantic import BaseModel
from enum import Enum
from typing import Optional

from .database import Base

class AssetType(str, Enum):
    TYPE_3D_MODEL = "3D_MODEL"
    AUDIO = "AUDIO"
    IMAGE = "IMAGE" # Added for future use
    VIDEO = "VIDEO" # Added for future use
    TEXT = "TEXT"   # Added for future use

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    asset_type = Column(SQLAlchemyEnum(AssetType))
    file_path = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Fields for Holodeck context - nullable as not all assets might be in a Holodeck scene
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    z = Column(Float, nullable=True)
    rotation_x = Column(Float, nullable=True)
    rotation_y = Column(Float, nullable=True)
    rotation_z = Column(Float, nullable=True)
    scale_x = Column(Float, nullable=True, default=1.0)
    scale_y = Column(Float, nullable=True, default=1.0)
    scale_z = Column(Float, nullable=True, default=1.0)

class AssetCreate(BaseModel):
    name: str
    asset_type: AssetType
    # file_path will be set by the server after upload

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None
    rotation_x: Optional[float] = None
    rotation_y: Optional[float] = None
    rotation_z: Optional[float] = None
    scale_x: Optional[float] = None
    scale_y: Optional[float] = None
    scale_z: Optional[float] = None

class AssetResponse(BaseModel):
    id: int
    name: str
    asset_type: AssetType
    file_path: str
    created_at: datetime
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None
    rotation_x: Optional[float] = None
    rotation_y: Optional[float] = None
    rotation_z: Optional[float] = None
    scale_x: Optional[float] = None
    scale_y: Optional[float] = None
    scale_z: Optional[float] = None

    class Config:
        orm_mode = True # Changed from from_attributes = True for Pydantic v1 compatibility
        # For Pydantic v2, it would be from_attributes = True
        # Assuming environment might be on Pydantic v1 for wider SQLAlchemy compatibility initially.
        # If using Pydantic v2, ensure 'from_attributes = True' is used.

# Note: Need to import `datetime` for AssetResponse. Will add to main.py or resolve if it causes issues.
# For now, defining it here. Let's assume it's `from datetime import datetime`.
from datetime import datetime # Added import
