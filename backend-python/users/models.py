from enum import Enum
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLAEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

# Enums
class AuthLevel(int, Enum):
    NONE = 0
    BASIC = 1
    VERIFIED = 2
    ADVANCED = 3

# SQLAlchemy models
class User(Base):
    """User database model for FreelanceShield platform"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = relationship('Profile', back_populates='user', uselist=False)
    policies = relationship('Policy', back_populates='freelancer')
    client_policies = relationship('Policy', 
                                  back_populates='client', 
                                  foreign_keys='Policy.client_id')
    claims = relationship('Claim', back_populates='claimant')
    deposits = relationship('Deposit', back_populates='user')

class Profile(Base):
    """User profile database model containing additional user information"""
    __tablename__ = 'profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    full_name = Column(String(255))
    bio = Column(Text, nullable=True)
    auth_level = Column(SQLAEnum(AuthLevel), default=AuthLevel.NONE)
    professional_title = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    profile_image = Column(String(255), nullable=True)
    registration_time = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='profile')

# Configuration model (Remains as Pydantic model as it's not stored in database)
class ProgramConfig(BaseModel):
    """Program state and configuration"""
    authority: str
    initialized: bool = False
    paused: bool = False
    token_mint: Optional[str] = None
    claims_contract_authority: Optional[str] = None

# Pydantic models for API requests/responses
class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    password: str
    full_name: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    professional_title: Optional[str] = None
    website: Optional[str] = None
    profile_image: Optional[str] = None

class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    full_name: str
    bio: Optional[str] = None
    auth_level: AuthLevel
    professional_title: Optional[str] = None
    website: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"
    
class TokenData(BaseModel):
    """Schema for token data"""
    user_id: int
    email: Optional[str] = None
    is_superuser: bool = False
