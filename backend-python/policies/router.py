"""
Policy management router for FreelanceShield API.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime

from auth.security import get_current_active_user
from database import get_db
from users.models import User
from policies.models import Policy, PolicyHistory, PolicyCreate, PolicyUpdate, PolicyResponse, PolicyDetailResponse
from claims.models import Claim

router = APIRouter(prefix="/policies", tags=["policies"])


@router.post("/", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_data: PolicyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Policy:
    """
    Create a new insurance policy
    """
    # Set default dates if not provided
    start_date = policy_data.start_date or datetime.utcnow()
    end_date = policy_data.end_date
    if not end_date and start_date:
        # Default policy period is 30 days
        from datetime import timedelta
        end_date = start_date + timedelta(days=30)
    
    # Find client if email provided
    client_id = None
    if policy_data.client_email:
        client = db.query(User).filter(User.email == policy_data.client_email).first()
        if client:
            client_id = client.id

    # Create new policy
    db_policy = Policy(
        freelancer_id=current_user.id,
        client_id=client_id,
        premium_amount=policy_data.premium_amount,
        coverage_amount=policy_data.coverage_amount,
        policy_type=policy_data.policy_type,
        project_name=policy_data.project_name,
        project_description=policy_data.project_description,
        start_date=start_date,
        end_date=end_date,
        metadata=policy_data.metadata,
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    # Create initial history record
    history = PolicyHistory(
        policy_id=db_policy.id,
        changed_by_id=current_user.id,
        new_status=db_policy.status,
        change_reason="Policy created",
    )
    db.add(history)
    db.commit()
    
    # Update risk pool metrics
    update_risk_pool_metrics(db)
    
    return db_policy


@router.get("/", response_model=List[PolicyResponse])
def list_policies(
    status: Optional[str] = Query(None, description="Filter by policy status"),
    policy_type: Optional[str] = Query(None, description="Filter by policy type"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[Policy]:
    """
    List policies for the current user
    """
    query = db.query(Policy).filter(
        (Policy.freelancer_id == current_user.id) | 
        (Policy.client_id == current_user.id)
    )
    
    # Apply filters if provided
    if status:
        query = query.filter(Policy.status == status)
    if policy_type:
        query = query.filter(Policy.policy_type == policy_type)
    
    # Apply pagination
    policies = query.offset(skip).limit(limit).all()
    return policies


@router.get("/{policy_id}", response_model=PolicyDetailResponse)
def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Policy:
    """
    Get a specific policy by ID
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    # Check permissions (must be the freelancer or client)
    if policy.freelancer_id != current_user.id and policy.client_id != current_user.id:
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to access this policy"
            )
    
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: int,
    policy_data: PolicyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Policy:
    """
    Update a policy
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    # Check permissions (only freelancer can update their policy)
    if policy.freelancer_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to update this policy"
        )
    
    previous_status = policy.status
    
    # Update fields if provided
    if policy_data.status is not None:
        policy.status = policy_data.status
    if policy_data.end_date is not None:
        policy.end_date = policy_data.end_date
    if policy_data.project_name is not None:
        policy.project_name = policy_data.project_name
    if policy_data.project_description is not None:
        policy.project_description = policy_data.project_description
    if policy_data.metadata is not None:
        if policy.metadata:
            # Merge metadata
            policy.metadata.update(policy_data.metadata)
        else:
            policy.metadata = policy_data.metadata
    
    policy.last_updated = datetime.utcnow()
    
    db.commit()
    db.refresh(policy)
    
    # Create history record if status changed
    if previous_status != policy.status:
        history = PolicyHistory(
            policy_id=policy.id,
            changed_by_id=current_user.id,
            previous_status=previous_status,
            new_status=policy.status,
            change_reason=f"Status updated from {previous_status} to {policy.status}",
        )
        db.add(history)
        db.commit()
        
        # Update risk pool metrics
        update_risk_pool_metrics(db)
    
    return policy


@router.get("/{policy_id}/history", response_model=List[dict])
def get_policy_history(
    policy_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[PolicyHistory]:
    """
    Get history of changes for a policy
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    # Check permissions
    if policy.freelancer_id != current_user.id and policy.client_id != current_user.id:
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to access this policy"
            )
    
    history = db.query(PolicyHistory).filter(
        PolicyHistory.policy_id == policy_id
    ).order_by(PolicyHistory.timestamp.desc()).all()
    
    result = []
    for item in history:
        user = db.query(User).filter(User.id == item.changed_by_id).first()
        user_email = user.email if user else "Unknown"
        
        result.append({
            "id": item.id,
            "previous_status": item.previous_status,
            "new_status": item.new_status,
            "change_reason": item.change_reason,
            "changed_by": user_email,
            "timestamp": item.timestamp,
            "details": item.change_details
        })
    
    return result


def update_risk_pool_metrics(db: Session) -> None:
    """
    Update risk pool metrics based on current policies and claims.
    This should be called whenever policy or claim status changes.
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
    active_policies = db.query(Policy).filter(
        Policy.status == "active"
    ).all()
    
    total_coverage = sum(p.coverage_amount for p in active_policies)
    metrics.total_coverage_liability = total_coverage
    metrics.active_policies_count = len(active_policies)
    
    # Calculate premium metrics
    metrics.total_premiums_collected = db.query(Policy).filter(
        Policy.status.in_(["active", "expired", "claimed"])
    ).with_entities(func.sum(Policy.premium_amount)).scalar() or 0.0
    
    # Calculate pending claims
    pending_claims = db.query(Claim).filter(
        Claim.status.in_(["pending", "under_review", "needs_info"])
    ).all()
    metrics.pending_claims_count = len(pending_claims)
    
    # Calculate paid claims
    metrics.total_claims_paid = db.query(Claim).filter(
        Claim.status == "paid"
    ).with_entities(func.sum(Claim.claim_amount)).scalar() or 0.0
    
    # Reserve ratio
    if metrics.total_coverage_liability > 0:
        metrics.reserve_ratio = metrics.total_capital / metrics.total_coverage_liability
    else:
        metrics.reserve_ratio = 1.0
        
    # Update timestamp
    metrics.last_update_time = datetime.utcnow()
    metrics.snapshot_date = datetime.utcnow()
    
    db.commit()
