"""
Database configuration and session management for FreelanceShield API.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from typing import Generator
import os

# Get database URL from environment variable or use SQLite as default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./freelanceshield.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False  # Set to True to enable SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get a database session.
    Creates a new session for each request and closes it after the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize the database by creating all tables.
    Should be called when starting the application.
    """
    # Import all models to ensure they are registered with Base
    from users.models import User, Profile
    from policies.models import Policy, PolicyHistory
    from claims.models import Claim, ClaimEvidence
    from riskpool.models import Deposit, RiskPoolMetrics
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
