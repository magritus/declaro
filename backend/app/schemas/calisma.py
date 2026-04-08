from datetime import datetime
from typing import Any
from pydantic import BaseModel


class CalismaCreate(BaseModel):
    pass  # Sadece donem_id URL'den gelir


class WizardFaz0Girdi(BaseModel):
    ticari_kar: float = 0.0
    ticari_zarar: float = 0.0


class WizardFaz1Girdi(BaseModel):
    secilen_kategoriler: dict[str, bool]  # kategori_adi → True/False


class WizardFaz2Girdi(BaseModel):
    secilen_kalemler: list[str]  # ic_kod listesi
    kapi_soru_cevaplari: dict[str, dict[str, str]] = {}  # ic_kod → {soru_id: cevap}


class KalemVeriGirdisi(BaseModel):
    girdi_verileri: dict[str, Any]


class KChecklistGuncelle(BaseModel):
    durum: dict[str, str]  # {K1: "uygun", K2: "eksik", K3: "risk"}


class BelgeDurumuGuncelle(BaseModel):
    durum: dict[str, dict]  # {belge_no: {durum: "uygun", not: "..."}}


class IstekListesiGuncelle(BaseModel):
    ic_kodlar: list[str]


class CalismaResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    donem_id: int
    ticari_kar_zarar: float | None
    kkeg: float | None
    finansman_fonu: float | None
    kar_mi_zarar_mi: str | None
    wizard_faz: int
    wizard_cevaplari: dict | None
    istek_listesi: list | None
    tamamlandi: bool
    created_at: datetime
