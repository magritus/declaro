import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, verify_donem_owner, verify_mukellef_owner
from app.db.models.donem import Donem
from app.db.models.mukellef import Mukellef
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.donem import DonemCreate, DonemResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mukellef/{mukellef_id}/donem", tags=["donem"])
donem_tekil_router = APIRouter(prefix="/donem", tags=["donem"])


@donem_tekil_router.get("/{donem_id}", response_model=DonemResponse)
async def donem_getir(
    donem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    donem = await verify_donem_owner(donem_id, current_user, db)
    return donem


@router.post("", response_model=DonemResponse, status_code=201)
async def donem_olustur(
    mukellef_id: int,
    data: DonemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify mukellef ownership
    await verify_mukellef_owner(mukellef_id, current_user, db)

    # Aynı yıl+çeyrek tekrar mı?
    mevcut = await db.execute(
        select(Donem).where(
            Donem.mukellef_id == mukellef_id,
            Donem.yil == data.yil,
            Donem.ceyrek == data.ceyrek,
        )
    )
    if mevcut.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{data.yil} {data.ceyrek} donemi zaten var")

    donem = Donem(mukellef_id=mukellef_id, **data.model_dump())
    db.add(donem)
    await db.commit()
    await db.refresh(donem)
    logger.info("Donem created: id=%d mukellef=%d", donem.id, mukellef_id)
    return donem


@router.get("", response_model=list[DonemResponse])
async def donem_listele(
    mukellef_id: int,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify mukellef ownership
    await verify_mukellef_owner(mukellef_id, current_user, db)

    result = await db.execute(
        select(Donem)
        .where(Donem.mukellef_id == mukellef_id)
        .order_by(Donem.yil.desc(), Donem.ceyrek)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
