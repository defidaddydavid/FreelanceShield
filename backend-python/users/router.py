"""
User management router for FreelanceShield API.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.security import get_current_active_user, get_current_superuser, get_password_hash
from database import get_db
from users.models import User, Profile, UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_superuser: User = Depends(get_current_superuser)
) -> User:
    """
    Create a new user (admin only)
    """
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user with hashed password
    db_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create user profile
    profile = Profile(
        user_id=db_user.id,
        full_name=user_data.full_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return db_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_new_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
) -> User:
    """
    Register a new user (public endpoint)
    """
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user with hashed password
    db_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        is_superuser=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create user profile
    profile = Profile(
        user_id=db_user.id,
        full_name=user_data.full_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return db_user


@router.get("/me", response_model=UserResponse)
def get_user_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user information
    """
    # Get full user with profile
    user_with_profile = db.query(User).filter(User.id == current_user.id).first()
    return user_with_profile


@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Update current user information
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if user_data.email is not None:
        # Check email uniqueness if changing email
        if user_data.email != user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        user.email = user_data.email
    
    # Update profile information
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
    
    if user_data.full_name is not None:
        profile.full_name = user_data.full_name
    if user_data.bio is not None:
        profile.bio = user_data.bio
    if user_data.professional_title is not None:
        profile.professional_title = user_data.professional_title
    if user_data.website is not None:
        profile.website = user_data.website
    if user_data.profile_image is not None:
        profile.profile_image = user_data.profile_image
        
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get a specific user by ID
    """
    # Only allow superusers to view other users or users to view themselves
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this user"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    return user


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_superuser: User = Depends(get_current_superuser)
) -> List[User]:
    """
    List all users (admin only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_superuser: User = Depends(get_current_superuser)
) -> None:
    """
    Delete a user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    db.delete(user)
    db.commit()
