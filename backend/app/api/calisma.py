from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.donem import Donem
from app.db.models.calisma import Calisma
from app.db.models.kalem_verisi import KalemVerisi
from app.schemas.calisma import (
    CalismaResponse, WizardFaz0Girdi, WizardFaz1Girdi, WizardFaz2Girdi,
    KalemVeriGirdisi, KChecklistGuncelle, BelgeDurumuGuncelle
)

router = APIRouter(prefix="/donem/{donem_id}/calisma", tags=["calisma"])
kalem_router = APIRouter(prefix="/calisma", tags=["calisma"])


@router.post("", response_model=CalismaResponse, status_code=201)
async def calisma_olustur(donem_id: int, db: AsyncSession = Depends(get_db)):
    donem = await db.get(Donem, donem_id)
    if not donem:
        raise HTTPException(status_code=404, detail="Dönem bulunamadı")

    calisma = Calisma(donem_id=donem_id)
    db.add(calisma)
    await db.commit()
    await db.refresh(calisma)
    return calisma


@router.get("", response_model=list[CalismaResponse])
async def calisma_listele(donem_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Calisma).where(Calisma.donem_id == donem_id))
    return result.scalars().all()


@kalem_router.get("/{calisma_id}", response_model=CalismaResponse)
async def calisma_getir(calisma_id: int, db: AsyncSession = Depends(get_db)):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")
    return calisma


@kalem_router.put("/{calisma_id}/wizard/faz0", response_model=CalismaResponse)
async def wizard_faz0(calisma_id: int, data: WizardFaz0Girdi, db: AsyncSession = Depends(get_db)):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    calisma.ticari_kar_zarar = data.ticari_kar_zarar
    calisma.kkeg = data.kkeg
    calisma.finansman_fonu = data.finansman_fonu
    calisma.kar_mi_zarar_mi = "kar" if data.ticari_kar_zarar > 0 else "zarar"
    calisma.wizard_faz = 1

    await db.commit()
    await db.refresh(calisma)
    return calisma


@kalem_router.put("/{calisma_id}/wizard/faz1", response_model=CalismaResponse)
async def wizard_faz1(calisma_id: int, data: WizardFaz1Girdi, db: AsyncSession = Depends(get_db)):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    if calisma.wizard_faz < 1:
        raise HTTPException(status_code=400, detail="Faz 0 tamamlanmadan faz 1 başlatılamaz")

    if not any(data.secilen_kategoriler.values()):
        raise HTTPException(status_code=400, detail="En az bir kategori seçilmelidir")

    mevcut = dict(calisma.wizard_cevaplari or {})
    mevcut["faz1"] = data.secilen_kategoriler
    calisma.wizard_cevaplari = mevcut
    calisma.wizard_faz = 2

    await db.commit()
    await db.refresh(calisma)
    return calisma


@kalem_router.put("/{calisma_id}/wizard/faz2", response_model=CalismaResponse)
async def wizard_faz2(calisma_id: int, data: WizardFaz2Girdi, db: AsyncSession = Depends(get_db)):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    if calisma.wizard_faz < 2:
        raise HTTPException(status_code=400, detail="Faz 1 tamamlanmadan faz 2 başlatılamaz")

    mevcut = dict(calisma.wizard_cevaplari or {})
    mevcut["faz2"] = data.kapi_soru_cevaplari
    calisma.wizard_cevaplari = mevcut
    calisma.istek_listesi = data.secilen_kalemler
    calisma.wizard_faz = 3
    calisma.tamamlandi = True

    await db.commit()
    await db.refresh(calisma)
    return calisma


@kalem_router.put("/{calisma_id}/kalem/{ic_kod}/veri")
async def kalem_veri_kaydet(
    calisma_id: int, ic_kod: str, data: KalemVeriGirdisi, db: AsyncSession = Depends(get_db)
):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")

    if ic_kod not in (calisma.istek_listesi or []):
        raise HTTPException(status_code=400, detail=f"{ic_kod} bu çalışmanın istek listesinde değil")

    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id, KalemVerisi.ic_kod == ic_kod)
    )
    kalem_verisi = result.scalar_one_or_none()

    if kalem_verisi:
        kalem_verisi.girdi_verileri = data.girdi_verileri
    else:
        kalem_verisi = KalemVerisi(calisma_id=calisma_id, ic_kod=ic_kod, girdi_verileri=data.girdi_verileri)
        db.add(kalem_verisi)

    await db.commit()
    await db.refresh(kalem_verisi)
    return {"ic_kod": ic_kod, "girdi_verileri": kalem_verisi.girdi_verileri}


@kalem_router.put("/{calisma_id}/kalem/{ic_kod}/checklist")
async def k_checklist_guncelle(
    calisma_id: int, ic_kod: str, data: KChecklistGuncelle, db: AsyncSession = Depends(get_db)
):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")
    if ic_kod not in (calisma.istek_listesi or []):
        raise HTTPException(status_code=400, detail=f"{ic_kod} bu çalışmanın istek listesinde değil")

    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id, KalemVerisi.ic_kod == ic_kod)
    )
    kalem_verisi = result.scalar_one_or_none()
    if not kalem_verisi:
        raise HTTPException(status_code=404, detail="Kalem verisi bulunamadı")

    kalem_verisi.k_checklist_durumu = data.durum
    await db.commit()
    return {"ic_kod": ic_kod, "k_checklist_durumu": data.durum}


@kalem_router.put("/{calisma_id}/kalem/{ic_kod}/belgeler")
async def belge_durumu_guncelle(
    calisma_id: int, ic_kod: str, data: BelgeDurumuGuncelle, db: AsyncSession = Depends(get_db)
):
    calisma = await db.get(Calisma, calisma_id)
    if not calisma:
        raise HTTPException(status_code=404, detail="Çalışma bulunamadı")
    if ic_kod not in (calisma.istek_listesi or []):
        raise HTTPException(status_code=400, detail=f"{ic_kod} bu çalışmanın istek listesinde değil")

    result = await db.execute(
        select(KalemVerisi).where(KalemVerisi.calisma_id == calisma_id, KalemVerisi.ic_kod == ic_kod)
    )
    kalem_verisi = result.scalar_one_or_none()
    if not kalem_verisi:
        raise HTTPException(status_code=404, detail="Kalem verisi bulunamadı")

    kalem_verisi.belge_durumu = data.durum
    await db.commit()
    return {"ic_kod": ic_kod, "belge_durumu": data.durum}
