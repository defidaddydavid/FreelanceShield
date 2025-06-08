"""
Risk pool management router for FreelanceShield API.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime

from auth.security import get_current_active_user, get_current_superuser
from database import get_db
from users.models import User
from riskpool.models import (
    Deposit, RiskPoolMetrics, RiskPoolWithdrawal, RiskPoolState, RiskPool,
    DepositCreate, WithdrawalCreate, DepositResponse, WithdrawalResponse, RiskPoolMetricsResponse
)

router = APIRouter(prefix="/riskpool", tags=["riskpool"])


@router.post("/deposits", response_model=DepositResponse, status_code=status.HTTP_201_CREATED)
def create_deposit(
    deposit_data: DepositCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Deposit:
    """
    Make a deposit to the risk pool
    """
    # Create new deposit record
    deposit = Deposit(
        user_id=current_user.id,
        amount=deposit_data.amount,
        notes=deposit_data.notes,
        metadata=deposit_data.metadata,
    )
    
    db.add(deposit)
    db.commit()
    db.refresh(deposit)
    
    # Update risk pool metrics
    update_risk_pool_metrics(db)
    
    return deposit


@router.post("/withdrawals", response_model=WithdrawalResponse, status_code=status.HTTP_201_CREATED)
def request_withdrawal(
    withdrawal_data: WithdrawalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> RiskPoolWithdrawal:
    """
    Request a withdrawal from the risk pool
    """
    # Check if user has enough balance
    user_deposits_total = db.query(func.sum(Deposit.amount)).filter(
        Deposit.user_id == current_user.id,
        Deposit.is_active == True
    ).scalar() or 0.0
    
    user_withdrawals_total = db.query(func.sum(RiskPoolWithdrawal.amount)).filter(
        RiskPoolWithdrawal.user_id == current_user.id,
        RiskPoolWithdrawal.status.in_(["pending", "completed"])
    ).scalar() or 0.0
    
    available_balance = user_deposits_total - user_withdrawals_total
    
    if withdrawal_data.amount > available_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: {available_balance}, Requested: {withdrawal_data.amount}"
        )
    
    # Create withdrawal request
    withdrawal = RiskPoolWithdrawal(
        user_id=current_user.id,
        amount=withdrawal_data.amount,
        notes=withdrawal_data.notes,
        status="pending"
    )
    
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    
    return withdrawal


@router.get("/deposits", response_model=List[DepositResponse])
def list_deposits(
    current_user: User = Depends(get_current_active_user),
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[Deposit]:
    """
    List user's deposits
    """
    deposits = db.query(Deposit).filter(
        Deposit.user_id == current_user.id
    ).order_by(Deposit.timestamp.desc()).offset(skip).limit(limit).all()
    
    return deposits


@router.get("/withdrawals", response_model=List[WithdrawalResponse])
def list_withdrawals(
    current_user: User = Depends(get_current_active_user),
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[RiskPoolWithdrawal]:
    """
    List user's withdrawal requests
    """
    withdrawals = db.query(RiskPoolWithdrawal).filter(
        RiskPoolWithdrawal.user_id == current_user.id
    ).order_by(RiskPoolWithdrawal.timestamp.desc()).offset(skip).limit(limit).all()
    
    return withdrawals


@router.get("/admin/deposits", response_model=List[DepositResponse])
def admin_list_deposits(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    skip: int = 0, 
    limit: int = 100,
    current_superuser: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
) -> List[Deposit]:
    """
    List all deposits (admin only)
    """
    query = db.query(Deposit)
    
    if user_id:
        query = query.filter(Deposit.user_id == user_id)
        
    deposits = query.order_by(Deposit.timestamp.desc()).offset(skip).limit(limit).all()
    return deposits


@router.get("/admin/withdrawals", response_model=List[WithdrawalResponse])
def admin_list_withdrawals(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = 0, 
    limit: int = 100,
    current_superuser: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
) -> List[RiskPoolWithdrawal]:
    """
    List all withdrawal requests (admin only)
    """
    query = db.query(RiskPoolWithdrawal)
    
    if user_id:
        query = query.filter(RiskPoolWithdrawal.user_id == user_id)
    if status:
        query = query.filter(RiskPoolWithdrawal.status == status)
        
    withdrawals = query.order_by(
        RiskPoolWithdrawal.status == "pending",  # Sort pending first
        RiskPoolWithdrawal.timestamp.desc()
    ).offset(skip).limit(limit).all()
    
    return withdrawals


@router.put("/admin/withdrawals/{withdrawal_id}", response_model=WithdrawalResponse)
def process_withdrawal(
    withdrawal_id: int,
    status: str = Query(..., description="New status: completed, rejected"),
    notes: Optional[str] = None,
    current_superuser: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
) -> RiskPoolWithdrawal:
    """
    Process a withdrawal request (admin only)
    """
    if status not in ["completed", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'completed' or 'rejected'"
        )
        
    withdrawal = db.query(RiskPoolWithdrawal).filter(
        RiskPoolWithdrawal.id == withdrawal_id
    ).first()
    
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Withdrawal request not found"
        )
        
    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Withdrawal request has already been processed. Current status: {withdrawal.status}"
        )
    
    withdrawal.status = status
    withdrawal.processed_time = datetime.utcnow()
    
    if notes:
        withdrawal.notes = notes if not withdrawal.notes else f"{withdrawal.notes}\n\n{notes}"
    
    db.commit()
    db.refresh(withdrawal)
    
    # If withdrawal is completed, update risk pool metrics
    if status == "completed":
        update_risk_pool_metrics(db)
    
    return withdrawal


@router.get("/metrics", response_model=RiskPoolMetricsResponse)
def get_risk_pool_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RiskPoolMetrics:
    """
    Get current risk pool metrics
    """
    metrics = db.query(RiskPoolMetrics).order_by(
        RiskPoolMetrics.snapshot_date.desc()
    ).first()
    
    if not metrics:
        # If no metrics exist yet, create initial metrics
        metrics = RiskPoolMetrics()
        db.add(metrics)
        db.commit()
        db.refresh(metrics)
    
    return metrics


@router.get("/summary")
def get_risk_pool_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Get a summary of the risk pool and user's participation
    """
    # Get metrics
    metrics = db.query(RiskPoolMetrics).order_by(
        RiskPoolMetrics.snapshot_date.desc()
    ).first()
    
    if not metrics:
        metrics = RiskPoolMetrics()
    
    # Get user specific info
    user_deposits_total = db.query(func.sum(Deposit.amount)).filter(
        Deposit.user_id == current_user.id,
        Deposit.is_active == True
    ).scalar() or 0.0
    
    user_withdrawals_total = db.query(func.sum(RiskPoolWithdrawal.amount)).filter(
        RiskPoolWithdrawal.user_id == current_user.id,
        RiskPoolWithdrawal.status.in_(["pending", "completed"])
    ).scalar() or 0.0
    
    pending_withdrawal = db.query(func.sum(RiskPoolWithdrawal.amount)).filter(
        RiskPoolWithdrawal.user_id == current_user.id,
        RiskPoolWithdrawal.status == "pending"
    ).scalar() or 0.0
    
    user_balance = user_deposits_total - user_withdrawals_total
    available_for_withdrawal = user_balance - pending_withdrawal
    
    # Calculate percentage of total pool
    percentage_of_pool = 0
    if metrics.total_capital > 0:
        percentage_of_pool = (user_balance / metrics.total_capital) * 100
    
    return {
        "pool_metrics": {
            "total_capital": metrics.total_capital,
            "total_coverage_liability": metrics.total_coverage_liability,
            "reserve_ratio": metrics.reserve_ratio,
            "active_policies_count": metrics.active_policies_count,
            "pending_claims_count": metrics.pending_claims_count,
        },
        "user_metrics": {
            "total_deposits": user_deposits_total,
            "total_withdrawals": user_withdrawals_total,
            "current_balance": user_balance,
            "pending_withdrawals": pending_withdrawal,
            "available_for_withdrawal": available_for_withdrawal,
            "percentage_of_pool": percentage_of_pool
        }
    }


def update_risk_pool_metrics(db: Session) -> None:
    """
    Update risk pool metrics based on deposits, withdrawals, policies, and claims.
    This should be called whenever these values change.
    """
    from policies.models import Policy, PolicyStatus
    from claims.models import Claim, ClaimStatus
    
    # Get latest metrics or create new one
    metrics = db.query(RiskPoolMetrics).order_by(
        RiskPoolMetrics.snapshot_date.desc()
    ).first()
    
    if not metrics:
        metrics = RiskPoolMetrics()
        db.add(metrics)
    
    # Calculate total capital
    total_deposits = db.query(func.sum(Deposit.amount)).filter(
        Deposit.is_active == True
    ).scalar() or 0.0
    
    total_withdrawals = db.query(func.sum(RiskPoolWithdrawal.amount)).filter(
        RiskPoolWithdrawal.status == "completed"
    ).scalar() or 0.0
    
    metrics.total_capital = total_deposits - total_withdrawals
    
    # Calculate policies metrics
    active_policies = db.query(Policy).filter(
        Policy.status == PolicyStatus.ACTIVE
    ).all()
    
    metrics.active_policies_count = len(active_policies)
    metrics.total_coverage_liability = db.query(func.sum(Policy.coverage_amount)).filter(
        Policy.status == PolicyStatus.ACTIVE
    ).scalar() or 0.0
    
    # Calculate premium metrics
    metrics.total_premiums_collected = db.query(func.sum(Policy.premium_amount)).filter(
        Policy.status.in_([PolicyStatus.ACTIVE, PolicyStatus.EXPIRED, PolicyStatus.CLAIMED])
    ).scalar() or 0.0
    
    # Calculate claims metrics
    metrics.pending_claims_count = db.query(Claim).filter(
        Claim.status.in_([ClaimStatus.PENDING, ClaimStatus.UNDER_REVIEW, ClaimStatus.NEEDS_INFO])
    ).count()
    
    metrics.total_claims_paid = db.query(func.sum(Claim.claim_amount)).filter(
        Claim.status == ClaimStatus.PAID
    ).scalar() or 0.0
    
    # Calculate reserve ratio
    if metrics.total_coverage_liability > 0:
        metrics.reserve_ratio = metrics.total_capital / metrics.total_coverage_liability
    else:
        metrics.reserve_ratio = 1.0
    
    # Calculate risk score (simplified example)
    if metrics.total_coverage_liability > 0:
        claims_ratio = metrics.total_claims_paid / metrics.total_premiums_collected if metrics.total_premiums_collected > 0 else 0
        reserve_factor = 1.0 - min(1.0, max(0, metrics.reserve_ratio))
        metrics.risk_score = (claims_ratio * 0.7) + (reserve_factor * 0.3)
    else:
        metrics.risk_score = 0.0
    
    # Update timestamp
    metrics.last_update_time = datetime.utcnow()
    metrics.snapshot_date = datetime.utcnow()
    
    db.commit()
