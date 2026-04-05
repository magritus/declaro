from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.mukellef import Mukellef
from app.schemas.mukellef import MukellefCreate, MukellefResponse

router = APIRouter(prefix="/mukellef", tags=["mukellef"])


@router.post("", response_model=MukellefResponse, status_code=201)
async def mukellef_olustur(data: MukellefCreate, db: AsyncSession = Depends(get_db)):
    # VKN tekrar kontrolü
    mevcut = await db.execute(select(Mukellef).where(Mukellef.vkn == data.vkn))
    if mevcut.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"VKN {data.vkn} zaten kayıtlı")

    mukellef = Mukellef(**data.model_dump())
    db.add(mukellef)
    await db.commit()
    await db.refresh(mukellef)
    return mukellef


@router.get("", response_model=list[MukellefResponse])
async def mukellef_listele(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Mukellef).order_by(Mukellef.unvan).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{mukellef_id}", response_model=MukellefResponse)
async def mukellef_getir(mukellef_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mukellef).where(Mukellef.id == mukellef_id))
    mukellef = result.scalar_one_or_none()
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mükellef bulunamadı")
    return mukellef


@router.delete("/{mukellef_id}", status_code=204)
async def mukellef_sil(mukellef_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mukellef).where(Mukellef.id == mukellef_id))
    mukellef = result.scalar_one_or_none()
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mükellef bulunamadı")
    await db.delete(mukellef)
    await db.commit()
