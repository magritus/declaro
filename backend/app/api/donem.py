from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.mukellef import Mukellef
from app.db.models.donem import Donem
from app.schemas.donem import DonemCreate, DonemResponse

router = APIRouter(prefix="/mukellef/{mukellef_id}/donem", tags=["donem"])


@router.post("", response_model=DonemResponse, status_code=201)
async def donem_olustur(mukellef_id: int, data: DonemCreate, db: AsyncSession = Depends(get_db)):
    # Mükellef var mı?
    mukellef = await db.get(Mukellef, mukellef_id)
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mükellef bulunamadı")

    # Aynı yıl+çeyrek tekrar mı?
    mevcut = await db.execute(
        select(Donem).where(Donem.mukellef_id == mukellef_id, Donem.yil == data.yil, Donem.ceyrek == data.ceyrek)
    )
    if mevcut.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{data.yil} {data.ceyrek} dönemi zaten var")

    donem = Donem(mukellef_id=mukellef_id, **data.model_dump())
    db.add(donem)
    await db.commit()
    await db.refresh(donem)
    return donem


@router.get("", response_model=list[DonemResponse])
async def donem_listele(mukellef_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Donem).where(Donem.mukellef_id == mukellef_id).order_by(Donem.yil.desc(), Donem.ceyrek)
    )
    return result.scalars().all()
