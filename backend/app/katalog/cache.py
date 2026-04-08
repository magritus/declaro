import re
from functools import lru_cache
from app.katalog.loader import KatalogLoader


@lru_cache(maxsize=1)
def get_katalog_loader() -> KatalogLoader:
    return KatalogLoader()


def get_katalog():
    return get_katalog_loader().yukle()


def katalog_kalem_bul(ic_kod: str):
    """
    ic_kod ile kalem şemasını döner.
    coklu_instance kalemler için _N suffix'ini çözer:
      indirimli_kv_kvk_32a_ytb_2 → indirimli_kv_kvk_32a_ytb
    Returns: (base_ic_kod, kalem_schema) veya (ic_kod, None)
    """
    katalog = get_katalog()
    if ic_kod in katalog:
        return ic_kod, katalog[ic_kod]
    # Suffix çözümü: _N sonekini soy, coklu_instance olan kalemi ara
    m = re.match(r'^(.+)_(\d+)$', ic_kod)
    if m:
        base = m.group(1)
        kalem = katalog.get(base)
        if kalem and kalem.coklu_instance:
            return base, kalem
    return ic_kod, None


def ic_kod_instance_no(ic_kod: str) -> int | None:
    """indirimli_kv_kvk_32a_ytb_2 → 2, veya None"""
    m = re.match(r'^(.+)_(\d+)$', ic_kod)
    if m:
        return int(m.group(2))
    return None


def ic_kod_base(ic_kod: str) -> str:
    """indirimli_kv_kvk_32a_ytb_2 → indirimli_kv_kvk_32a_ytb"""
    m = re.match(r'^(.+)_(\d+)$', ic_kod)
    return m.group(1) if m else ic_kod
