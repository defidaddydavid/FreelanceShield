from enum import Enum
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SQLAEnum, JSON
from sqlalchemy.orm import relationship
from database import Base

# Enums
class PolicyStatus(str, Enum):
    CREATED = "created"
    ACTIVE = "active"
    EXPIRED = "expired"
    CLAIMED = "claimed"
    CANCELED = "canceled"

class PolicyType(str, Enum):
    BASIC = "basic"  # Basic coverage
    PREMIUM = "premium"  # Premium coverage with additional benefits
    ENTERPRISE = "enterprise"  # Enterprise level for large projects

# SQLAlchemy models
class Policy(Base):
    """Policy database model"""
    __tablename__ = 'policies'
    
    id = Column(Integer, primary_key=True, index=True)
    freelancer_id = Column(Integer, ForeignKey('users.id'), index=True)
    client_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    premium_amount = Column(Float, nullable=False)
    coverage_amount = Column(Float, nullable=False)
    status = Column(SQLAEnum(PolicyStatus), default=PolicyStatus.CREATED)
    policy_type = Column(SQLAEnum(PolicyType), default=PolicyType.BASIC)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    creation_time = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional policy details
    project_name = Column(String(255), nullable=True)
    project_description = Column(Text, nullable=True)
    terms_hash = Column(String(255), nullable=True)  # Hash of policy terms
    meta_data = Column(JSON, nullable=True)  # Additional flexible metadata as JSON
    
    # Relationships
    freelancer = relationship('User', back_populates='policies', foreign_keys=[freelancer_id])
    client = relationship('User', back_populates='client_policies', foreign_keys=[client_id])
    claims = relationship('Claim', back_populates='policy')
    history = relationship('PolicyHistory', back_populates='policy')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set end date if not provided (default 30 days)
        if self.end_date is None and self.start_date is not None:
            self.end_date = self.start_date + timedelta(days=30)

class PolicyHistory(Base):
    """Policy history database model for tracking changes"""
    __tablename__ = 'policy_history'
    
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey('policies.id', ondelete='CASCADE'), index=True)
    changed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    previous_status = Column(SQLAEnum(PolicyStatus), nullable=True)
    new_status = Column(SQLAEnum(PolicyStatus), nullable=True)
    change_reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    change_details = Column(JSON, nullable=True)  # Details about the change
    
    # Relationships
    policy = relationship('Policy', back_populates='history')
    changed_by = relationship('User')

# Configuration model (Remains as Pydantic model as it's not stored in database)
class PoliciesConfig(BaseModel):
    """Configuration for policy service"""
    authority: str  # Authority identifier
    next_policy_id: int = 1
    fee_basis_points: int = 200  # Fee in basis points (2%)

# Pydantic models for API requests/responses
class PolicyBase(BaseModel):
    """Base schema for policy data"""
    premium_amount: float
    coverage_amount: float
    policy_type: PolicyType = PolicyType.BASIC
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('premium_amount', 'coverage_amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class PolicyCreate(PolicyBase):
    """Schema for creating a new policy"""
    client_email: Optional[str] = None  # Optional client email for linking

class PolicyUpdate(BaseModel):
    """Schema for updating a policy"""
    status: Optional[PolicyStatus] = None
    end_date: Optional[datetime] = None
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PolicyResponse(PolicyBase):
    """Schema for policy response"""
    id: int
    freelancer_id: int
    client_id: Optional[int] = None
    status: PolicyStatus
    creation_time: datetime
    last_updated: datetime
    
    class Config:
        orm_mode = True

class PolicyDetailResponse(PolicyResponse):
    """Schema for detailed policy response including related data"""
    freelancer: Dict[str, Any]  # Simplified user info
    client: Optional[Dict[str, Any]] = None  # Simplified client info if available
    claims_count: int = 0
    active_claims_count: int = 0
    
    class Config:
        orm_mode = True
