from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from .api_key import ApiKey, ApiKeyCreate, create_api_key, verify_api_key, api_keys_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    dependencies=[Depends(verify_api_key)]
)

@router.post("/api-keys", response_model=ApiKey)
async def create_new_api_key(api_key_data: ApiKeyCreate):
    """Create a new API key (Admin only)"""
    return create_api_key(api_key_data)

@router.get("/api-keys", response_model=List[ApiKey])
async def get_all_api_keys():
    """Get all API keys (Admin only)"""
    return [ApiKey(**key_data) for key_data in api_keys_db.values()]

@router.get("/api-keys/{api_key}", response_model=ApiKey)
async def get_api_key_info(api_key: str):
    """Get information about a specific API key"""
    key_data = api_keys_db.get(api_key)
    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    return ApiKey(**key_data)

@router.delete("/api-keys/{api_key}", response_model=Dict)
async def revoke_api_key(api_key: str):
    """Revoke an API key"""
    if api_key not in api_keys_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Set key to inactive instead of deleting
    api_keys_db[api_key]["is_active"] = False
    
    return {"status": "success", "message": "API key revoked successfully"}

@router.post("/verify-key", response_model=Dict)
async def verify_api_key_endpoint(client_info: Dict = Depends(verify_api_key)):
    """Verify an API key and return client information"""
    return {
        "status": "valid",
        "client": client_info.get("client_name"),
        "tier": client_info.get("tier"),
    }
