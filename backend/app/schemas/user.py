from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserDetailResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    mukellef_count: int = 0

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserDetailResponse]
    total: int
    page: int
    page_size: int


class UpdateProfileRequest(BaseModel):
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class AdminUpdateUserRequest(BaseModel):
    role: Optional[str] = None  # "user" | "admin"
    is_active: Optional[bool] = None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_mukellefler: int
    admin_count: int
    user_count: int
