from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# Token
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str
    agency_id: Optional[int] = None

class User(UserBase):
    id: int
    role: str
    agency_id: Optional[int]
    class Config:
        from_attributes = True

# Agency
class AgencyBase(BaseModel):
    name: str
    location: Optional[str] = None
    contact_info: Optional[str] = None

class AgencyCreate(AgencyBase):
    admin_username: Optional[str] = None
    admin_password: Optional[str] = None

class Agency(AgencyBase):
    id: int
    class Config:
        from_attributes = True

# Dataset
class Dataset(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

# Training Log
class TrainingLog(BaseModel):
    id: int
    dataset_id: int
    status: str
    accuracy: Optional[float]
    feature_importance: Optional[str] # JSON string
    created_at: datetime
    class Config:
        from_attributes = True

# ML / Dashboard
class PredictionRequest(BaseModel):
    region: str
    country: str
    water_source: str
    treatment_method: str
    bacteria_count: float
    turbidity: float
    access_to_clean_water: float
    contaminant_level: float
    # Add other features as optional if strictly needed, but these are the main drivers in our logic

class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str

class DashboardSummary(BaseModel):
    total_regions: int
    total_countries: int
    avg_risk_score: float
    high_risk_percentage: float
    recent_training_accuracy: Optional[float]

class CountryInsight(BaseModel):
    country: str
    avg_risk_score: float
    avg_bacteria: float
    avg_access: float
    top_water_source: str
    total_disease_cases: int
    risk_level: str

# Admin Portal Schemas
class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None  # Populated from join
    action: str
    details: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class UserDetailResponse(BaseModel):
    id: int
    username: str
    role: str
    agency_id: Optional[int] = None
    agency_name: Optional[str] = None
    class Config:
        from_attributes = True

class AgencyDetailResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    contact_info: Optional[str] = None
    user_count: int = 0
    dataset_count: int = 0
    class Config:
        from_attributes = True
