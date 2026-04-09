import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, verify_mukellef_owner
from app.db.models.mukellef import Mukellef
from app.db.models.mukellef_yetki import MukellefYetki
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.mukellef import MukellefCreate, MukellefResponse, MukellefUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mukellef", tags=["mukellef"])


@router.post("", response_model=MukellefResponse, status_code=201)
async def mukellef_olustur(
    data: MukellefCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # VKN tekrar kontrolü — sistem genelinde
    mevcut = await db.execute(
        select(Mukellef).where(Mukellef.vkn == data.vkn)
    )
    if mevcut.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu VKN zaten kayitli")

    mukellef = Mukellef(**data.model_dump(), owner_id=current_user.id)
    db.add(mukellef)
    await db.flush()
    # Otomatik yetki kaydı oluştur
    yetki = MukellefYetki(user_id=current_user.id, mukellef_id=mukellef.id)
    db.add(yetki)
    await db.commit()
    await db.refresh(mukellef)
    logger.info("Mukellef created: id=%d owner=%d", mukellef.id, current_user.id)
    return mukellef


@router.get("", response_model=list[MukellefResponse])
async def mukellef_listele(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Mukellef)
    if current_user.role.value != "admin":
        yetkili_ids = select(MukellefYetki.mukellef_id).where(MukellefYetki.user_id == current_user.id)
        q = q.where(
            (Mukellef.owner_id == current_user.id) | (Mukellef.id.in_(yetkili_ids))
        )
    result = await db.execute(q.order_by(Mukellef.unvan).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{mukellef_id}", response_model=MukellefResponse)
async def mukellef_getir(
    mukellef_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mukellef = await verify_mukellef_owner(mukellef_id, current_user, db)
    return mukellef


@router.put("/{mukellef_id}", response_model=MukellefResponse)
async def mukellef_guncelle(
    mukellef_id: int,
    data: MukellefUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mukellef = await verify_mukellef_owner(mukellef_id, current_user, db)
    if data.unvan is not None:
        mukellef.unvan = data.unvan.strip()
    if data.vergi_dairesi is not None:
        mukellef.vergi_dairesi = data.vergi_dairesi or None
    if data.kv_orani is not None:
        mukellef.kv_orani = data.kv_orani
    await db.commit()
    await db.refresh(mukellef)
    logger.info("Mukellef updated: id=%d", mukellef_id)
    return mukellef


@router.delete("/{mukellef_id}", status_code=204)
async def mukellef_sil(
    mukellef_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mukellef = await verify_mukellef_owner(mukellef_id, current_user, db)
    await db.delete(mukellef)
    await db.commit()
    logger.info("Mukellef deleted: id=%d", mukellef_id)
