import io
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, verify_calisma_owner
from app.db.models.calisma import Calisma
from app.db.models.donem import Donem
from app.db.models.kalem_verisi import KalemVerisi
from app.db.models.mukellef import Mukellef
from app.db.models.user import User
from app.db.session import get_db
from app.export.excel import _temizle_dosya_adi, kalem_xlsx, ozet_xlsx
from app.katalog.cache import get_katalog
from app.pipeline.pipeline import pipeline_calistir

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calisma", tags=["export"])

XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


async def _get_calisma_mukellef_donem(
    calisma_id: int,
    db: AsyncSession,
) -> tuple[Calisma, Mukellef, Donem]:
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Calisma bulunamadi")

    donem = await db.get(Donem, calisma.donem_id)
    if not donem:
        raise HTTPException(status_code=404, detail="Donem bulunamadi")

    mukellef = await db.get(Mukellef, donem.mukellef_id)
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mukellef bulunamadi")

    return calisma, mukellef, donem


@router.get("/{calisma_id}/export/kalem/{ic_kod}")
async def export_kalem_xlsx(
    calisma_id: int,
    ic_kod: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_calisma_owner(calisma_id, current_user, db)
    calisma, mukellef, donem = await _get_calisma_mukellef_donem(calisma_id, db)

    result = await db.execute(
        select(KalemVerisi).where(
            KalemVerisi.calisma_id == calisma_id,
            KalemVerisi.ic_kod == ic_kod,
        )
    )
    kalem_verisi = result.scalar_one_or_none()

    katalog = get_katalog()
    kalem = katalog.get(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadi: {ic_kod}")

    xlsx_bytes = kalem_xlsx(kalem, kalem_verisi, mukellef, donem)

    raw_name = f"{mukellef.unvan}_{donem.yil}_{donem.ceyrek}_{ic_kod}.xlsx"
    filename = _temizle_dosya_adi(raw_name)

    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type=XLSX_MEDIA,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{calisma_id}/export/ozet")
async def export_ozet_xlsx(
    calisma_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_calisma_owner(calisma_id, current_user, db)
    calisma, mukellef, donem = await _get_calisma_mukellef_donem(calisma_id, db)

    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id)
    )
    kalem_verileri_list = result.scalars().all()
    kalem_verileri_map = {kv.ic_kod: kv for kv in kalem_verileri_list}

    kalem_verileri_dict: dict[str, dict] = {
        kv.ic_kod: kv.girdi_verileri or {} for kv in kalem_verileri_list
    }

    pipeline_sonucu = pipeline_calistir(
        ticari_kar_zarar=float(calisma.ticari_kar_zarar or 0),
        kkeg=float(calisma.kkeg or 0),
        finansman_fonu=float(calisma.finansman_fonu or 0),
        istek_listesi=calisma.istek_listesi or [],
        kalem_verileri=kalem_verileri_dict,
        donem_yili=donem.yil,
    )

    katalog = get_katalog()
    xlsx_bytes = ozet_xlsx(
        calisma=calisma,
        mukellef=mukellef,
        donem=donem,
        pipeline_sonucu=pipeline_sonucu,
        kalem_verileri_map=kalem_verileri_map,
        katalog=katalog,
    )

    raw_name = f"{mukellef.unvan}_{donem.yil}_{donem.ceyrek}_OZET.xlsx"
    filename = _temizle_dosya_adi(raw_name)

    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type=XLSX_MEDIA,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
