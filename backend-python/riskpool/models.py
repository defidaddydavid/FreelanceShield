from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base

# SQLAlchemy models
class Deposit(Base):
    """Deposit database model for tracking capital inflows into the risk pool"""
    __tablename__ = 'deposits'
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    transaction_reference = Column(String(255), nullable=True)  # Reference ID for the transaction
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    meta_data = Column(JSON, nullable=True)  # Additional deposit metadata
    is_active = Column(Boolean, default=True)  # Whether deposit is active or withdrawn/used
    
    # Relationships
    user = relationship('User', back_populates='deposits')

class RiskPoolMetrics(Base):
    """Risk pool metrics database model for tracking pool performance"""
    __tablename__ = 'risk_pool_metrics'
    
    id = Column(Integer, primary_key=True, index=True)
    total_capital = Column(Float, default=0.0)  # Total capital in the pool
    total_coverage_liability = Column(Float, default=0.0)  # Total coverage promised
    total_premiums_collected = Column(Float, default=0.0)  # Total premiums collected
    total_claims_paid = Column(Float, default=0.0)  # Total claims paid out
    reserve_ratio = Column(Float, default=1.0)  # Ratio of capital to coverage liability (1.0 = 100%)
    active_policies_count = Column(Integer, default=0)  # Number of active policies
    pending_claims_count = Column(Integer, default=0)  # Number of pending claims
    risk_score = Column(Float, default=0.0)  # Calculated risk score for the pool
    last_update_time = Column(DateTime, default=datetime.utcnow)
    snapshot_date = Column(DateTime, default=datetime.utcnow)  # Date this snapshot represents

class RiskPoolWithdrawal(Base):
    """Risk pool withdrawal database model for tracking capital outflows"""
    __tablename__ = 'risk_pool_withdrawals'
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    transaction_reference = Column(String(255), nullable=True)  # Reference ID for the transaction
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default='pending')  # Status: pending, completed, rejected
    processed_time = Column(DateTime, nullable=True)  # When the withdrawal was processed
    
    # Relationships
    user = relationship('User')

# Configuration models (Remain as Pydantic models as they're not stored in database)
class RiskPoolState(BaseModel):
    """Risk pool state configuration"""
    authority: str  # Authority identifier 
    token_mint: Optional[str] = None  # Token mint identifier if applicable
    claims_contract_authority: Optional[str] = None  # Authority for claims processing
    is_active: bool = True
    maintenance_mode: bool = False

class RiskPool(BaseModel):
    """Risk pool overall configuration and state"""
    state: RiskPoolState
    metrics: Dict[str, Any] = Field(default_factory=dict)

# Pydantic models for API requests/responses
class DepositCreate(BaseModel):
    """Schema for creating a new deposit"""
    amount: float
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Deposit amount must be positive')
        return v

class WithdrawalCreate(BaseModel):
    """Schema for creating a new withdrawal request"""
    amount: float
    notes: Optional[str] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Withdrawal amount must be positive')
        return v

class DepositResponse(BaseModel):
    """Schema for deposit response"""
    id: int
    amount: float
    user_id: int
    transaction_reference: Optional[str] = None
    timestamp: datetime
    is_active: bool
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

class WithdrawalResponse(BaseModel):
    """Schema for withdrawal response"""
    id: int
    amount: float
    user_id: int
    timestamp: datetime
    status: str
    processed_time: Optional[datetime] = None
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

class RiskPoolMetricsResponse(BaseModel):
    """Schema for risk pool metrics response"""
    total_capital: float
    total_coverage_liability: float
    total_premiums_collected: float
    total_claims_paid: float
    reserve_ratio: float
    active_policies_count: int
    pending_claims_count: int
    risk_score: float
    last_update_time: datetime
    snapshot_date: datetime
    
    class Config:
        orm_mode = True
