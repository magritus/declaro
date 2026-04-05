from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any


@dataclass
class KalemHesapSonucu:
    ic_kod: str
    istisna_tutari: Decimal = Decimal("0")
    ara_sonuclar: dict[str, Decimal] = field(default_factory=dict)
    hatalar: list[str] = field(default_factory=list)
    uyarilar: list[str] = field(default_factory=list)
    aciklama: str = ""


@dataclass
class PipelineAdim:
    adim_no: int
    baslik: str
    onceki_deger: Decimal
    sonraki_deger: Decimal
    aciklama: str = ""


@dataclass
class PipelineSonucu:
    matrah: Decimal = Decimal("0")
    hesaplanan_kv: Decimal = Decimal("0")
    yiakv_matrahi: Decimal = Decimal("0")
    yiakv: Decimal = Decimal("0")
    odenecek_kv: Decimal = Decimal("0")
    yiakv_uygulanmis: bool = False
    kazanc_varsa_gruplari_atlanmis: bool = False
    adimlar: list[PipelineAdim] = field(default_factory=list)
    kalem_sonuclari: dict[str, KalemHesapSonucu] = field(default_factory=dict)
