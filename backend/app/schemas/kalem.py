from decimal import Decimal
from enum import Enum
from typing import Annotated, Any
from pydantic import BaseModel, BeforeValidator, field_validator


class BeyannameBolumuEnum(str, Enum):
    ZARAR_OLSA_DAHI = "zarar_olsa_dahi"
    KAZANC_VARSA = "kazanc_varsa"
    GECMIS_YIL_ZARARI = "gecmis_yil_zarari"
    ILAVE = "ilave"
    HESAPLANAN_KV_INDIRIMI = "hesaplanan_kv_indirimi"


class YiakVEtkisiEnum(str, Enum):
    DUSULUR = "dusulur"
    DUSULMEZ = "dusulmez"
    TARTISMALI = "tartismali"


class DurumEnum(str, Enum):
    AKTIF = "aktif"
    GECIS = "gecis"
    MULGA = "mulga"


class VeriGirisiTipiEnum(str, Enum):
    PARA = "para"
    TARIH = "tarih"
    SECENEK = "secenek"
    EVET_HAYIR = "evet_hayir"
    METIN = "metin"
    SAYI = "sayi"
    BOLUM = "bolum"
    MATRIS = "matris"
    UZLASTIRMA = "uzlastirma"


class BelgeKategorisiEnum(str, Enum):
    ZORUNLU = "zorunlu"
    DESTEKLEYICI = "destekleyici"


class BeyannamKodu(BaseModel):
    donem: int
    kod: int
    aciklama: str | None = None


class YururlukAraligi(BaseModel):
    baslangic: str
    bitis: str | None = None


class KapiSorusu(BaseModel):
    id: str
    soru: str
    tip: str
    zorunlu_cevap: str | None = None
    aciklama: str | None = None


class WizardAgaci(BaseModel):
    tetikleyici_soru: str
    info_modal: str | None = None
    kapi_sorulari: list[KapiSorusu] = []


def _secenekler_normalize(v: Any) -> Any:
    """str → {deger, etiket} dönüşümü — hem plain string hem dict kabul eder."""
    if isinstance(v, list):
        return [{"deger": x, "etiket": x} if isinstance(x, str) else x for x in v]
    return v


class SecebekItem(BaseModel):
    """Zengin seçenek: {deger, etiket}. YAML'da hem plain string hem dict kabul edilir."""
    deger: str
    etiket: str


class VeriGirisiAlani(BaseModel):
    id: str
    etiket: str
    tip: VeriGirisiTipiEnum
    zorunlu: bool = False
    varsayilan: str | int | float | bool | None = None
    secenekler: Annotated[list[SecebekItem] | None, BeforeValidator(_secenekler_normalize)] = None
    yardim: str | None = None
    satirlar: list[dict[str, Any]] | None = None   # matris rows: [{id, etiket}]
    sutunlar: list[dict[str, Any]] | None = None   # matris cols: [{id, etiket, zorunlu?}]
    kaynak_alan: str | None = None                  # uzlastirma: watched form field id


class Validasyon(BaseModel):
    kural: str
    hata: str


class HesaplamaSablonu(BaseModel):
    veri_girisi_alanlari: list[VeriGirisiAlani] = []
    formuller: dict[str, str] = {}
    sonuc_alan: str = ""
    validasyonlar: list[Validasyon] = []


class BelgeListesiKalem(BaseModel):
    kategori: BelgeKategorisiEnum
    no: int
    baslik: str
    detay: str | None = None
    temin_yeri: str | None = None


class KChecklistItem(BaseModel):
    id: str
    soru: str
    referans: str | None = None


class KalemSchema(BaseModel):
    ic_kod: str
    baslik: str
    ust_kalem: str | None = None
    beyanname_kodlari: list[BeyannamKodu] = []
    dahili_ref: str | None = None  # XML'de karşılığı olmayan özel iç referans (ör. "IKV-YTB")
    mevzuat_dayanagi: list[str] = []
    beyanname_bolumu: BeyannameBolumuEnum
    yiakv_etkisi: YiakVEtkisiEnum
    durum: DurumEnum = DurumEnum.AKTIF
    yururluk_araligi: YururlukAraligi | None = None
    ana_kategori: str | None = None
    wizard_agaci: WizardAgaci | None = None
    parametreler: dict[str, Any] = {}
    coklu_instance: bool = False  # aynı kalemden birden fazla eklenebilir (ör. YTB)
    hesaplama_sablonu: HesaplamaSablonu = HesaplamaSablonu()
    denetci_notlari: str | None = None
    muhasebe_kayitlari: str | None = None
    belge_listesi: list[BelgeListesiKalem] = []
    k_checklist: list[KChecklistItem] = []
    hesaplayici: str | None = None  # karmaşık Python hesaplayıcı referansı

    @field_validator("ic_kod")
    @classmethod
    def ic_kod_bos_olamaz(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("ic_kod boş olamaz")
        return v

    def get_beyanname_kodu(self, donem_yili: int) -> int | None:
        """Dönem yılına göre GİB beyanname kodunu döner."""
        for bk in self.beyanname_kodlari:
            if bk.donem == donem_yili:
                return bk.kod
        # En yakın önceki dönemi bul
        onceki = [bk for bk in self.beyanname_kodlari if bk.donem <= donem_yili]
        if onceki:
            return max(onceki, key=lambda x: x.donem).kod
        return None
