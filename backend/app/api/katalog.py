import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.db.models.admin_config import AdminConfig
from app.db.models.ana_kategori import AnaKategori
from app.db.models.user import User
from app.db.session import get_db
from app.katalog.cache import get_katalog, katalog_kalem_bul

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/katalog", tags=["katalog"])

FALLBACK_WIZARD_STEPS = [
    {"key": "donem-acilis", "label": "Dönem Açılışı", "order": 0, "aktif": True},
    {"key": "ana-kategori", "label": "Ana Kategori Tarama", "order": 1, "aktif": True},
    {"key": "alt-kategori", "label": "Alt Kalem Seçimi", "order": 2, "aktif": True},
]


@router.get("/kalemler")
async def kalem_listesi(current_user: User = Depends(get_current_user)):
    katalog = get_katalog()
    return [
        {
            "ic_kod": k.ic_kod,
            "baslik": k.baslik,
            "beyanname_bolumu": k.beyanname_bolumu,
            "yiakv_etkisi": k.yiakv_etkisi,
            "durum": k.durum,
            "ana_kategori": k.ana_kategori,
            "coklu_instance": k.coklu_instance,
            "dahili_ref": k.dahili_ref,
            "beyanname_kodlari": [
                {"donem": b.donem, "kod": b.kod}
                for b in (k.beyanname_kodlari or [])
            ],
        }
        for k in katalog.values()
    ]


@router.get("/kalemler/{ic_kod}")
async def kalem_detay(ic_kod: str, current_user: User = Depends(get_current_user)):
    _, kalem = katalog_kalem_bul(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadi: {ic_kod}")
    return kalem.model_dump()


@router.get("/ana-kategoriler")
async def ana_kategori_listesi(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AnaKategori)
        .where(AnaKategori.aktif == True)  # noqa: E712
        .order_by(AnaKategori.sira)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "kod": r.kod,
            "soru": r.soru,
            "etiket": r.etiket,
            "bilgi": r.bilgi,
            "grup": r.grup,
            "beyanname_kodlari": r.beyanname_kodlari,
            "sira": r.sira,
        }
        for r in rows
    ]


@router.get("/wizard-steps")
async def wizard_steps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.config_key == "wizard_steps")
    )
    config = result.scalar_one_or_none()
    if not config:
        return {"steps": FALLBACK_WIZARD_STEPS}
    return {"steps": config.config_value}
