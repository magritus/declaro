import logging

from fastapi import APIRouter, Depends, HTTPException

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.katalog.cache import get_katalog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/katalog", tags=["katalog"])


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
            "beyanname_kodlari": [
                {"donem": b.donem, "kod": b.kod}
                for b in (k.beyanname_kodlari or [])
            ],
        }
        for k in katalog.values()
    ]


@router.get("/kalemler/{ic_kod}")
async def kalem_detay(ic_kod: str, current_user: User = Depends(get_current_user)):
    katalog = get_katalog()
    kalem = katalog.get(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadi: {ic_kod}")
    return kalem.model_dump()
