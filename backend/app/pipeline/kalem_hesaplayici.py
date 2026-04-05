from decimal import Decimal
from typing import Any
from app.formul_motoru.evaluator import ForumulEvaluator
from app.pipeline.types import KalemHesapSonucu
from app.schemas.kalem import KalemSchema


evaluator = ForumulEvaluator()


def kalem_hesapla(
    kalem: KalemSchema,
    kullanici_girdisi: dict[str, Any],
    donem_yili: int = 2025,
) -> KalemHesapSonucu:
    """
    Bir kalemi hesaplar. Basit kalemler YAML formülleriyle,
    karmaşık kalemler Python hesaplayıcısıyla çalışır.
    """
    ic_kod = kalem.ic_kod

    # Karmaşık hesaplayıcı varsa delegé et
    if kalem.hesaplayici:
        return _karmasik_hesapla(kalem, kullanici_girdisi, donem_yili)

    # Parametreleri dönem bazlı al
    parametreler = dict(kalem.parametreler)

    formuller = kalem.hesaplama_sablonu.formuller
    validasyonlar = [v.model_dump() for v in kalem.hesaplama_sablonu.validasyonlar]

    if not formuller:
        return KalemHesapSonucu(
            ic_kod=ic_kod,
            hatalar=["Hesaplama şablonu tanımlı değil"],
        )

    try:
        ara_sonuclar, hatalar = evaluator.formulleri_hesapla(
            formuller,
            kullanici_girdisi,
            parametreler,
            validasyonlar,
        )

        sonuc_alan = kalem.hesaplama_sablonu.sonuc_alan
        istisna_tutari = ara_sonuclar.get(sonuc_alan, Decimal("0"))

        aciklama = _aciklama_uret(kalem, ara_sonuclar, istisna_tutari)

        return KalemHesapSonucu(
            ic_kod=ic_kod,
            istisna_tutari=istisna_tutari,
            ara_sonuclar=ara_sonuclar,
            hatalar=hatalar,
            aciklama=aciklama,
        )
    except Exception as e:
        return KalemHesapSonucu(
            ic_kod=ic_kod,
            hatalar=[f"Hesaplama hatası: {str(e)}"],
        )


def _aciklama_uret(
    kalem: KalemSchema,
    ara_sonuclar: dict[str, Decimal],
    istisna_tutari: Decimal,
) -> str:
    satirlar = [f"**{kalem.baslik}**"]
    for degisken, deger in ara_sonuclar.items():
        if degisken != kalem.hesaplama_sablonu.sonuc_alan:
            satirlar.append(f"- {degisken}: {deger:,.2f} TL")
    satirlar.append(f"**İstisna tutarı: {istisna_tutari:,.2f} TL**")
    return "\n".join(satirlar)


def _karmasik_hesapla(
    kalem: KalemSchema,
    kullanici_girdisi: dict[str, Any],
    donem_yili: int,
) -> KalemHesapSonucu:
    """İleride karmaşık Python hesaplayıcıları buradan çağrılacak."""
    return KalemHesapSonucu(
        ic_kod=kalem.ic_kod,
        uyarilar=[f"Karmaşık hesaplayıcı '{kalem.hesaplayici}' henüz implement edilmedi."],
    )
