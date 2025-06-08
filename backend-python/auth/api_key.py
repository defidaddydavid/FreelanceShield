from fastapi import Request, HTTPException, Depends, status
from fastapi.security import APIKeyHeader
from typing import Dict, Optional, List
import secrets
from datetime import datetime, timedelta
from pydantic import BaseModel

# API Key database (in-memory for now, would be in a real database later)
api_keys_db: Dict[str, Dict] = {}

# API Key header
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

class ApiKey(BaseModel):
    key: str
    client_name: str
    client_email: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    rate_limit: int = 100  # requests per minute
    tier: str = "basic"  # basic, business, enterprise
    is_active: bool = True

class ApiKeyCreate(BaseModel):
    client_name: str
    client_email: str
    tier: str = "basic"
    rate_limit: int = 100
    expires_days: Optional[int] = None

def generate_api_key() -> str:
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def create_api_key(client_data: ApiKeyCreate) -> ApiKey:
    """Create a new API key"""
    api_key = generate_api_key()
    
    expires_at = None
    if client_data.expires_days:
        expires_at = datetime.now() + timedelta(days=client_data.expires_days)
    
    new_key = ApiKey(
        key=api_key,
        client_name=client_data.client_name,
        client_email=client_data.client_email,
        created_at=datetime.now(),
        expires_at=expires_at,
        rate_limit=client_data.rate_limit,
        tier=client_data.tier,
        is_active=True
    )
    
    # Store in our in-memory database
    api_keys_db[api_key] = new_key.dict()
    
    return new_key

def get_api_key(api_key_header: str = Depends(API_KEY_HEADER)) -> Optional[Dict]:
    """Validate API key and return client info"""
    if not api_key_header:
        return None
        
    client_info = api_keys_db.get(api_key_header)
    if not client_info:
        return None
        
    # Check if key is active
    if not client_info.get("is_active", False):
        return None
        
    # Check if key has expired
    expires_at = client_info.get("expires_at")
    if expires_at and datetime.now() > expires_at:
        return None
    
    return client_info

def verify_api_key(api_key_header: str = Depends(API_KEY_HEADER)) -> Dict:
    """Verify API key and return client info or raise exception"""
    client_info = get_api_key(api_key_header)
    if not client_info:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key"
        )
    return client_info

def verify_api_key_optional(api_key_header: str = Depends(API_KEY_HEADER)) -> Optional[Dict]:
    """Optional API key verification - won't raise an exception"""
    return get_api_key(api_key_header)

# Demo keys for development
DEMO_API_KEY = "demo_api_key_for_freelanceshield_frontend"

# Initialize with demo key
api_keys_db[DEMO_API_KEY] = {
    "key": DEMO_API_KEY,
    "client_name": "FreelanceShield Frontend Demo",
    "client_email": "demo@freelanceshield.xyz",
    "created_at": datetime.now(),
    "expires_at": None,
    "rate_limit": 1000,
    "tier": "demo",
    "is_active": True
}
