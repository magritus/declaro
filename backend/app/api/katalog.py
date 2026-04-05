from fastapi import APIRouter, HTTPException
from app.katalog.cache import get_katalog

router = APIRouter(prefix="/katalog", tags=["katalog"])


@router.get("/kalemler")
async def kalem_listesi():
    katalog = get_katalog()
    return [
        {
            "ic_kod": k.ic_kod,
            "baslik": k.baslik,
            "beyanname_bolumu": k.beyanname_bolumu,
            "yiakv_etkisi": k.yiakv_etkisi,
            "durum": k.durum,
            "ana_kategori": k.ana_kategori,
        }
        for k in katalog.values()
    ]


@router.get("/kalemler/{ic_kod}")
async def kalem_detay(ic_kod: str):
    katalog = get_katalog()
    kalem = katalog.get(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadı: {ic_kod}")
    return kalem.model_dump()
