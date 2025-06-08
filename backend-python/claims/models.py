from enum import Enum
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SQLAEnum, JSON
from sqlalchemy.orm import relationship
from database import Base

# Enums
class ClaimStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    NEEDS_INFO = "needs_info"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    DISPUTED = "disputed"

# SQLAlchemy models
class Claim(Base):
    """Claim database model"""
    __tablename__ = 'claims'
    
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey('policies.id'), index=True)
    claimant_id = Column(Integer, ForeignKey('users.id'), index=True)
    claim_amount = Column(Float, nullable=False)
    submission_time = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLAEnum(ClaimStatus), default=ClaimStatus.PENDING)
    evidence_description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    resolution_time = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    meta_data = Column(JSON, nullable=True)  # Additional claim metadata
    
    # Relationships
    policy = relationship('Policy', back_populates='claims')
    claimant = relationship('User', back_populates='claims', foreign_keys=[claimant_id])
    reviewer = relationship('User', foreign_keys=[reviewer_id])
    evidence = relationship('ClaimEvidence', back_populates='claim')

class ClaimEvidence(Base):
    """Evidence for claims"""
    __tablename__ = 'claim_evidence'
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey('claims.id', ondelete='CASCADE'), index=True)
    evidence_type = Column(String(50), nullable=False)  # e.g., 'contract', 'communication', 'invoice'
    file_path = Column(String(255), nullable=True)  # Path to stored file if applicable
    file_hash = Column(String(255), nullable=True)  # Hash of the file for verification
    content_text = Column(Text, nullable=True)  # Text content if applicable
    upload_time = Column(DateTime, default=datetime.utcnow)
    meta_data = Column(JSON, nullable=True)  # Additional evidence metadata
    
    # Relationships
    claim = relationship('Claim', back_populates='evidence')

# Configuration model (Remains as Pydantic model as it's not stored in database)
class ClaimsConfig(BaseModel):
    """Configuration for claims service"""
    authority: str  # Authority identifier
    next_claim_id: int = 1
    reviewer_threshold: float = 1000  # Claims above this amount require manual review

# Pydantic models for API requests/responses
class ClaimBase(BaseModel):
    """Base schema for claim data"""
    policy_id: int
    claim_amount: float
    evidence_description: str
    
    @validator('claim_amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Claim amount must be positive')
        return v

class ClaimCreate(ClaimBase):
    """Schema for creating a new claim"""
    metadata: Optional[Dict[str, Any]] = None

class EvidenceCreate(BaseModel):
    """Schema for creating new evidence"""
    evidence_type: str
    content_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ClaimUpdate(BaseModel):
    """Schema for updating a claim"""
    status: Optional[ClaimStatus] = None
    resolution_notes: Optional[str] = None
    reviewer_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class ClaimResponse(ClaimBase):
    """Schema for claim response"""
    id: int
    claimant_id: int
    status: ClaimStatus
    submission_time: datetime
    resolution_notes: Optional[str] = None
    resolution_time: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ClaimDetailResponse(ClaimResponse):
    """Schema for detailed claim response including related data"""
    policy: Dict[str, Any]  # Simplified policy info
    claimant: Dict[str, Any]  # Simplified claimant info
    reviewer: Optional[Dict[str, Any]] = None  # Simplified reviewer info if available
    evidence: List[Dict[str, Any]] = []  # List of evidence items
    
    class Config:
        orm_mode = True

class EvidenceResponse(BaseModel):
    """Schema for evidence response"""
    id: int
    claim_id: int
    evidence_type: str
    file_path: Optional[str] = None
    content_text: Optional[str] = None
    upload_time: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True
