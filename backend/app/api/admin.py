import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.models.mukellef import Mukellef
from app.db.models.mukellef_yetki import MukellefYetki
from app.db.models.user import User, UserRole
from app.db.session import get_db
from app.schemas.mukellef_yetki import (
    KullaniciSirketlerResponse,
    MukellefKisaResponse,
    MukellefYetkiResponse,
    YetkiIslemRequest,
)
from app.schemas.user import (
    AdminStatsResponse,
    AdminUpdateUserRequest,
    UserDetailResponse,
    UserListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


async def _user_with_count(user: User, db: AsyncSession) -> UserDetailResponse:
    count_result = await db.execute(
        select(func.count()).where(Mukellef.owner_id == user.id)
    )
    mukellef_count = count_result.scalar() or 0
    return UserDetailResponse(
        id=user.id,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        mukellef_count=mukellef_count,
    )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = select(User)
    if role:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar() or 0
    result = await db.execute(
        q.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = result.scalars().all()
    items = [await _user_with_count(u, db) for u in users]
    return UserListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return await _user_with_count(user, db)


@router.patch("/users/{user_id}", response_model=UserDetailResponse)
async def update_user(
    user_id: int,
    data: AdminUpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    # Son admin koruması — kendi hesabını deaktif veya rolünü düşürme
    if user.id == current_admin.id and (data.role == "user" or data.is_active is False):
        raise HTTPException(
            status_code=400,
            detail="Kendi hesabınızı deaktif edemez veya rolünüzü düşüremezsiniz",
        )
    if data.role == "user" and user.role == UserRole.admin:
        admin_count_result = await db.execute(
            select(func.count()).where(User.role == UserRole.admin, User.is_active == True)  # noqa: E712
        )
        admin_count = admin_count_result.scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Son admin kullanıcısının rolü değiştirilemez",
            )
    if data.role is not None:
        user.role = UserRole(data.role)
    if data.is_active is not None:
        user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)
    logger.info("Admin updated user id=%d by admin id=%d", user_id, current_admin.id)
    return await _user_with_count(user, db)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if user.role == UserRole.admin:
        admin_count_result = await db.execute(
            select(func.count()).where(User.role == UserRole.admin, User.is_active == True)  # noqa: E712
        )
        if (admin_count_result.scalar() or 0) <= 1:
            raise HTTPException(status_code=400, detail="Son admin silinemez")
    await db.delete(user)
    await db.commit()
    logger.info("User id=%d deleted by admin id=%d", user_id, current_admin.id)


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))  # noqa: E712
    ).scalar() or 0
    admin_count = (
        await db.execute(select(func.count(User.id)).where(User.role == UserRole.admin))
    ).scalar() or 0
    user_count = (
        await db.execute(select(func.count(User.id)).where(User.role == UserRole.user))
    ).scalar() or 0
    total_mukellefler = (await db.execute(select(func.count(Mukellef.id)))).scalar() or 0
    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_mukellefler=total_mukellefler,
        admin_count=admin_count,
        user_count=user_count,
    )


# ─── Kullanıcı – Şirket Yetki Yönetimi ───────────────────────────────────


@router.get("/users/{user_id}/sirketler", response_model=KullaniciSirketlerResponse)
async def get_user_sirketler(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    # Kullanıcının var olduğunu kontrol et
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")

    # Yetkili şirket ID'leri (MukellefYetki tablosundan)
    yetki_result = await db.execute(
        select(MukellefYetki.mukellef_id).where(MukellefYetki.user_id == user_id)
    )
    yetkili_ids = set(yetki_result.scalars().all())

    # Owner olduğu şirketler
    owner_result = await db.execute(
        select(Mukellef.id).where(Mukellef.owner_id == user_id)
    )
    owner_ids = set(owner_result.scalars().all())

    # Birleşik yetkili set
    tum_yetkili_ids = yetkili_ids | owner_ids

    # Tüm şirketler
    all_result = await db.execute(select(Mukellef).order_by(Mukellef.unvan))
    all_mukellefler = all_result.scalars().all()

    yetkili_sirketler = [
        MukellefKisaResponse(
            id=m.id, unvan=m.unvan, vkn=m.vkn, is_owner=(m.id in owner_ids)
        )
        for m in all_mukellefler
        if m.id in tum_yetkili_ids
    ]
    tum_sirketler = [
        MukellefKisaResponse(
            id=m.id, unvan=m.unvan, vkn=m.vkn, is_owner=(m.owner_id == user_id)
        )
        for m in all_mukellefler
    ]

    return KullaniciSirketlerResponse(
        yetkili_sirketler=yetkili_sirketler,
        tum_sirketler=tum_sirketler,
    )


@router.post("/users/{user_id}/sirketler", response_model=MukellefYetkiResponse, status_code=201)
async def add_user_sirket(
    user_id: int,
    data: YetkiIslemRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    # Kullanıcı ve mükellef var mı kontrol et
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")
    mukellef_result = await db.execute(select(Mukellef).where(Mukellef.id == data.mukellef_id))
    if not mukellef_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mukellef bulunamadi")

    # Zaten yetki var mı
    existing = await db.execute(
        select(MukellefYetki).where(
            MukellefYetki.user_id == user_id,
            MukellefYetki.mukellef_id == data.mukellef_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu yetki zaten mevcut")

    yetki = MukellefYetki(user_id=user_id, mukellef_id=data.mukellef_id)
    db.add(yetki)
    await db.commit()
    await db.refresh(yetki)
    logger.info(
        "Yetki added: user=%d mukellef=%d by admin=%d",
        user_id, data.mukellef_id, current_admin.id,
    )
    return yetki


@router.delete("/users/{user_id}/sirketler/{mukellef_id}", status_code=204)
async def remove_user_sirket(
    user_id: int,
    mukellef_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    # Owner kontrolü — owner yetkisi kaldırılamaz
    mukellef_result = await db.execute(select(Mukellef).where(Mukellef.id == mukellef_id))
    mukellef = mukellef_result.scalar_one_or_none()
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mukellef bulunamadi")
    if mukellef.owner_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Sirket sahibinin yetkisi kaldirilamaz. Sahipligi degistirmek icin sirket duzenlemeyi kullanin.",
        )

    yetki_result = await db.execute(
        select(MukellefYetki).where(
            MukellefYetki.user_id == user_id,
            MukellefYetki.mukellef_id == mukellef_id,
        )
    )
    yetki = yetki_result.scalar_one_or_none()
    if not yetki:
        raise HTTPException(status_code=404, detail="Yetki kaydi bulunamadi")

    await db.delete(yetki)
    await db.commit()
    logger.info(
        "Yetki removed: user=%d mukellef=%d by admin=%d",
        user_id, mukellef_id, current_admin.id,
    )
