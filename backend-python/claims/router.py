"""
Claims management router for FreelanceShield API.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
import os
import hashlib
import shutil
from pathlib import Path

from auth.security import get_current_active_user, get_current_superuser
from database import get_db
from users.models import User
from claims.models import (
    Claim, ClaimEvidence, ClaimStatus,
    ClaimCreate, ClaimUpdate, ClaimResponse, ClaimDetailResponse, EvidenceCreate, EvidenceResponse
)
from policies.models import Policy, PolicyStatus

router = APIRouter(prefix="/claims", tags=["claims"])

# Configure file storage for evidence
EVIDENCE_UPLOAD_DIR = Path("./uploads/evidence")
os.makedirs(EVIDENCE_UPLOAD_DIR, exist_ok=True)


def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Claim:
    """
    File a new claim for a policy
    """
    # Verify that policy exists and user has permission
    policy = db.query(Policy).filter(Policy.id == claim_data.policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    # Check policy status
    if policy.status != PolicyStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Policy is not active, current status: {policy.status}"
        )
        
    # Check if user is policy holder or client
    if policy.freelancer_id != current_user.id and policy.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You don't have permission to file a claim for this policy"
        )
    
    # Check if amount is greater than coverage
    if claim_data.claim_amount > policy.coverage_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Claim amount ({claim_data.claim_amount}) exceeds policy coverage ({policy.coverage_amount})"
        )
    
    # Create new claim
    claim = Claim(
        policy_id=policy.id,
        claimant_id=current_user.id,
        claim_amount=claim_data.claim_amount,
        evidence_description=claim_data.evidence_description,
        metadata=claim_data.metadata,
    )
    
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    # Update policy status to reflect that a claim is in progress
    # but don't change it if it's already in a claimed state
    if policy.status == PolicyStatus.ACTIVE:
        policy.status = PolicyStatus.CLAIMED
        db.commit()
    
    # Update risk pool metrics
    update_risk_pool_metrics(db)
    
    return claim


@router.get("/", response_model=List[ClaimResponse])
def list_claims(
    status: Optional[str] = Query(None, description="Filter by claim status"),
    policy_id: Optional[int] = Query(None, description="Filter by policy ID"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[Claim]:
    """
    List claims for the current user
    """
    # Base query: get claims where user is claimant or a policy holder/client
    query = db.query(Claim).join(
        Policy, Claim.policy_id == Policy.id
    ).filter(
        # User is the claimant OR user is related to the policy
        (Claim.claimant_id == current_user.id) |
        (Policy.freelancer_id == current_user.id) | 
        (Policy.client_id == current_user.id)
    )
    
    # Apply filters if provided
    if status:
        query = query.filter(Claim.status == status)
    if policy_id:
        query = query.filter(Claim.policy_id == policy_id)
    
    # Apply pagination and return results
    claims = query.order_by(Claim.submission_time.desc()).offset(skip).limit(limit).all()
    return claims


@router.get("/admin", response_model=List[ClaimResponse])
def admin_list_claims(
    status: Optional[str] = Query(None, description="Filter by claim status"),
    policy_id: Optional[int] = Query(None, description="Filter by policy ID"),
    skip: int = 0,
    limit: int = 100,
    current_superuser: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
) -> List[Claim]:
    """
    List all claims (admin only)
    """
    query = db.query(Claim)
    
    # Apply filters if provided
    if status:
        query = query.filter(Claim.status == status)
    if policy_id:
        query = query.filter(Claim.policy_id == policy_id)
    
    # Apply pagination and return results
    claims = query.order_by(Claim.submission_time.desc()).offset(skip).limit(limit).all()
    return claims


@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Claim:
    """
    Get a specific claim by ID
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Check permissions
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    
    # Current user must be the claimant, policy holder, client, or admin
    if (claim.claimant_id != current_user.id and 
        policy.freelancer_id != current_user.id and 
        policy.client_id != current_user.id and
        not current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this claim"
        )
    
    return claim


@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: int,
    claim_data: ClaimUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Claim:
    """
    Update a claim (status changes, notes, etc.)
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Get policy for permission checks
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    
    # Only admin and reviewer can change status
    if claim_data.status is not None:
        if not current_user.is_superuser and claim.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and assigned reviewers can change claim status"
            )
            
        claim.status = claim_data.status
        
        # If claim is being marked as paid, set resolution time
        if claim.status == ClaimStatus.PAID and not claim.resolution_time:
            claim.resolution_time = datetime.utcnow()
    
    # Set reviewer if specified
    if claim_data.reviewer_id is not None:
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can assign reviewers"
            )
            
        # Check if reviewer exists
        reviewer = db.query(User).filter(User.id == claim_data.reviewer_id).first()
        if not reviewer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reviewer user not found"
            )
            
        claim.reviewer_id = claim_data.reviewer_id
    
    # Add resolution notes if provided
    if claim_data.resolution_notes is not None:
        claim.resolution_notes = claim_data.resolution_notes
    
    # Update metadata if provided
    if claim_data.metadata is not None:
        if claim.metadata:
            # Merge metadata
            claim.metadata.update(claim_data.metadata)
        else:
            claim.metadata = claim_data.metadata
    
    db.commit()
    db.refresh(claim)
    
    # Update risk pool metrics if relevant status change
    if claim_data.status in [ClaimStatus.PAID, ClaimStatus.REJECTED, ClaimStatus.APPROVED]:
        update_risk_pool_metrics(db)
    
    return claim


@router.post("/{claim_id}/evidence", response_model=EvidenceResponse)
async def add_evidence(
    claim_id: int,
    evidence_data: EvidenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ClaimEvidence:
    """
    Add textual evidence to a claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Only claimant can add evidence
    if claim.claimant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the claimant can add evidence"
        )
    
    # Create evidence record
    evidence = ClaimEvidence(
        claim_id=claim.id,
        evidence_type=evidence_data.evidence_type,
        content_text=evidence_data.content_text,
        metadata=evidence_data.metadata,
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return evidence


@router.post("/{claim_id}/file-evidence", response_model=EvidenceResponse)
async def upload_evidence_file(
    claim_id: int,
    evidence_type: str = Query(..., description="Type of evidence"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ClaimEvidence:
    """
    Upload a file as evidence for a claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Only claimant can add evidence
    if claim.claimant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the claimant can add evidence"
        )
    
    # Create directory for this claim if it doesn't exist
    claim_dir = EVIDENCE_UPLOAD_DIR / str(claim_id)
    os.makedirs(claim_dir, exist_ok=True)
    
    # Save the file with a timestamp and original name
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}".replace(" ", "_")
    file_path = claim_dir / safe_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Calculate file hash for verification
    file_hash = calculate_file_hash(file_path)
    
    # Create evidence record
    evidence = ClaimEvidence(
        claim_id=claim.id,
        evidence_type=evidence_type,
        file_path=str(file_path),
        file_hash=file_hash,
        metadata={
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": os.path.getsize(file_path)
        }
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return evidence


@router.get("/{claim_id}/evidence", response_model=List[EvidenceResponse])
def get_claim_evidence(
    claim_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[ClaimEvidence]:
    """
    Get all evidence for a claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Get policy for permission checks
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    
    # Check permissions
    if (claim.claimant_id != current_user.id and 
        policy.freelancer_id != current_user.id and 
        policy.client_id != current_user.id and
        claim.reviewer_id != current_user.id and
        not current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this claim's evidence"
        )
    
    # Get all evidence for the claim
    evidence_list = db.query(ClaimEvidence).filter(
        ClaimEvidence.claim_id == claim_id
    ).order_by(ClaimEvidence.upload_time.desc()).all()
    
    return evidence_list


def update_risk_pool_metrics(db: Session) -> None:
    """
    Update risk pool metrics based on current policies and claims.
    This should be called whenever claim status changes.
    """
    from riskpool.models import RiskPoolMetrics
    
    # Get latest metrics or create new one
    metrics = db.query(RiskPoolMetrics).order_by(
        RiskPoolMetrics.snapshot_date.desc()
    ).first()
    
    if not metrics:
        metrics = RiskPoolMetrics()
        db.add(metrics)
    
    # Calculate metrics
    # Calculate pending claims
    pending_claims = db.query(Claim).filter(
        Claim.status.in_(["pending", "under_review", "needs_info"])
    ).all()
    metrics.pending_claims_count = len(pending_claims)
    
    # Calculate paid claims
    metrics.total_claims_paid = db.query(Claim).filter(
        Claim.status == "paid"
    ).with_entities(func.sum(Claim.claim_amount)).scalar() or 0.0
    
    # Update timestamp
    metrics.last_update_time = datetime.utcnow()
    metrics.snapshot_date = datetime.utcnow()
    
    db.commit()
