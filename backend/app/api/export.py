import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.calisma import Calisma
from app.db.models.donem import Donem
from app.db.models.kalem_verisi import KalemVerisi
from app.db.models.mukellef import Mukellef
from app.katalog.cache import get_katalog
from app.pipeline.pipeline import pipeline_calistir
from app.export.excel import kalem_xlsx, ozet_xlsx, _temizle_dosya_adi

router = APIRouter(prefix="/calisma", tags=["export"])

XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


async def _get_calisma_mukellef_donem(
    calisma_id: int,
    db: AsyncSession,
) -> tuple[Calisma, Mukellef, Donem]:
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    donem = await db.get(Donem, calisma.donem_id)
    if not donem:
        raise HTTPException(status_code=404, detail="Dönem bulunamadı")

    mukellef = await db.get(Mukellef, donem.mukellef_id)
    if not mukellef:
        raise HTTPException(status_code=404, detail="Mükellef bulunamadı")

    return calisma, mukellef, donem


@router.get("/{calisma_id}/export/kalem/{ic_kod}")
async def export_kalem_xlsx(
    calisma_id: int,
    ic_kod: str,
    db: AsyncSession = Depends(get_db),
):
    calisma, mukellef, donem = await _get_calisma_mukellef_donem(calisma_id, db)

    # KalemVerisi yükle
    result = await db.execute(
        select(KalemVerisi).where(
            KalemVerisi.calisma_id == calisma_id,
            KalemVerisi.ic_kod == ic_kod,
        )
    )
    kalem_verisi = result.scalar_one_or_none()

    # Kalem şeması
    katalog = get_katalog()
    kalem = katalog.get(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadı: {ic_kod}")

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
):
    calisma, mukellef, donem = await _get_calisma_mukellef_donem(calisma_id, db)

    # Tüm KalemVerisi kayıtlarını yükle
    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id)
    )
    kalem_verileri_list = result.scalars().all()
    kalem_verileri_map = {kv.ic_kod: kv for kv in kalem_verileri_list}

    # Pipeline için girdi verilerini hazırla
    kalem_verileri_dict: dict[str, dict] = {
        kv.ic_kod: kv.girdi_verileri or {} for kv in kalem_verileri_list
    }

    # Pipeline'ı çalıştır
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
