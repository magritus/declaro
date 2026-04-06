from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.calisma import Calisma
from app.db.models.donem import Donem
from app.db.models.kalem_verisi import KalemVerisi
from app.db.models.mukellef import Mukellef
from app.katalog.cache import get_katalog
from app.pipeline.kalem_hesaplayici import kalem_hesapla
from app.pipeline.pipeline import pipeline_calistir
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/calisma", tags=["hesaplama"])


class KalemHesaplaRequest(BaseModel):
    girdi_verileri: dict[str, Any]


@router.get("/{calisma_id}/kalem/{ic_kod}/veri")
async def kalem_veri_getir(
    calisma_id: int,
    ic_kod: str,
    db: AsyncSession = Depends(get_db),
):
    """Daha önce kaydedilmiş girdi verilerini ve hesap sonucunu döner."""
    result = await db.execute(
        select(KalemVerisi).where(
            KalemVerisi.calisma_id == calisma_id,
            KalemVerisi.ic_kod == ic_kod
        )
    )
    kv = result.scalar_one_or_none()
    if not kv:
        return {"girdi_verileri": None, "istisna_tutari": None, "ara_sonuclar": None, "k_checklist_durumu": None, "belge_durumu": None}
    return {
        "girdi_verileri": kv.girdi_verileri,
        "istisna_tutari": float(kv.istisna_tutari) if kv.istisna_tutari is not None else None,
        "ara_sonuclar": {k: float(v) for k, v in (kv.hesap_sonucu or {}).items()},
        "k_checklist_durumu": kv.k_checklist_durumu,
        "belge_durumu": kv.belge_durumu,
    }


@router.post("/{calisma_id}/kalem/{ic_kod}/hesapla")
async def kalem_hesapla_endpoint(
    calisma_id: int,
    ic_kod: str,
    data: KalemHesaplaRequest,
    db: AsyncSession = Depends(get_db),
):
    """Tek kalem hesaplar ve sonucu DB'ye kaydeder."""
    katalog = get_katalog()
    kalem = katalog.get(ic_kod)
    if not kalem:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadı: {ic_kod}")

    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    if ic_kod not in (calisma.istek_listesi or []):
        raise HTTPException(status_code=400, detail=f"{ic_kod} bu çalışmanın istek listesinde değil")

    sonuc = kalem_hesapla(kalem, data.girdi_verileri)

    # Sonucu DB'ye kaydet
    result = await db.execute(
        select(KalemVerisi).where(
            KalemVerisi.calisma_id == calisma_id,
            KalemVerisi.ic_kod == ic_kod
        )
    )
    kalem_verisi = result.scalar_one_or_none()
    if kalem_verisi:
        kalem_verisi.girdi_verileri = data.girdi_verileri
        kalem_verisi.hesap_sonucu = {k: str(v) for k, v in sonuc.ara_sonuclar.items()}
        kalem_verisi.istisna_tutari = float(sonuc.istisna_tutari)
    else:
        kalem_verisi = KalemVerisi(
            calisma_id=calisma_id,
            ic_kod=ic_kod,
            girdi_verileri=data.girdi_verileri,
            hesap_sonucu={k: str(v) for k, v in sonuc.ara_sonuclar.items()},
            istisna_tutari=float(sonuc.istisna_tutari),
        )
        db.add(kalem_verisi)
    await db.commit()

    return {
        "ic_kod": ic_kod,
        "istisna_tutari": float(sonuc.istisna_tutari),
        "ara_sonuclar": {k: float(v) for k, v in sonuc.ara_sonuclar.items()},
        "hatalar": sonuc.hatalar,
        "uyarilar": sonuc.uyarilar,
        "aciklama": sonuc.aciklama,
    }


@router.post("/{calisma_id}/hesapla")
async def pipeline_hesapla_endpoint(calisma_id: int, db: AsyncSession = Depends(get_db)):
    """Çalışmanın tüm pipeline'ını çalıştırır."""
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    if not calisma.istek_listesi:
        raise HTTPException(status_code=400, detail="Wizard tamamlanmamış veya istek listesi boş")

    # Kalem verilerini yükle
    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id)
    )
    kalem_verileri_db = {kv.ic_kod: kv.girdi_verileri or {} for kv in result.scalars().all()}

    # Dönem ve mükellef bilgilerini al
    donem = await db.get(Donem, calisma.donem_id)
    donem_yili = donem.yil if donem else 2025
    mukellef = await db.get(Mukellef, donem.mukellef_id) if donem else None
    kv_orani_override = float(mukellef.kv_orani) if mukellef and mukellef.kv_orani else None

    sonuc = pipeline_calistir(
        ticari_kar_zarar=float(calisma.ticari_kar_zarar or 0),
        kkeg=float(calisma.kkeg or 0),
        finansman_fonu=float(calisma.finansman_fonu or 0),
        istek_listesi=list(calisma.istek_listesi),
        kalem_verileri=kalem_verileri_db,
        donem_yili=donem_yili,
        kv_orani_override=kv_orani_override,
    )

    return {
        "matrah": float(sonuc.matrah),
        "hesaplanan_kv": float(sonuc.hesaplanan_kv),
        "yiakv": float(sonuc.yiakv),
        "odenecek_kv": float(sonuc.odenecek_kv),
        "yiakv_uygulanmis": sonuc.yiakv_uygulanmis,
        "kazanc_varsa_gruplari_atlanmis": sonuc.kazanc_varsa_gruplari_atlanmis,
        "adimlar": [
            {
                "adim_no": a.adim_no,
                "baslik": a.baslik,
                "deger": float(a.sonraki_deger),
                "aciklama": a.aciklama,
            }
            for a in sonuc.adimlar
        ],
        "kalemler": {
            ic_kod: {
                "istisna_tutari": float(ks.istisna_tutari),
                "hatalar": ks.hatalar,
                "uyarilar": ks.uyarilar,
                "aciklama": ks.aciklama,
            }
            for ic_kod, ks in sonuc.kalem_sonuclari.items()
        },
    }
