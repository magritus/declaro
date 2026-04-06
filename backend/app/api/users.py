import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.security import hash_password, verify_password
from app.db.models.mukellef import Mukellef
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import UserResponse
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest, UserDetailResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/profile", response_model=UserDetailResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(
        select(func.count()).where(Mukellef.owner_id == current_user.id)
    )
    mukellef_count = count_result.scalar() or 0
    return UserDetailResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        mukellef_count=mukellef_count,
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.email and data.email != current_user.email:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Bu e-posta adresi kullanımda")
        current_user.email = data.email
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password", status_code=204)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    current_user.hashed_password = hash_password(data.new_password)
    await db.commit()
    logger.info("Password changed for user id=%d", current_user.id)
