from decimal import Decimal
from functools import lru_cache
from typing import Any
import yaml
from pathlib import Path
from app.pipeline.types import PipelineAdim, PipelineSonucu, KalemHesapSonucu
from app.pipeline.kalem_hesaplayici import kalem_hesapla
from app.katalog.cache import get_katalog


@lru_cache(maxsize=1)
def _parametreler_yukle() -> dict[str, Any]:
    """Tüm parametre YAML dosyalarını yükler."""
    parametreler_dir = Path(__file__).parent.parent.parent.parent / "parametreler"
    parametreler: dict[str, Any] = {}
    for yaml_file in parametreler_dir.glob("*.yaml"):
        with open(yaml_file, encoding="utf-8") as f:
            data = yaml.safe_load(f)
            if data:
                parametreler[yaml_file.stem] = data
    return parametreler


def _kv_orani_al(donem_yili: int, parametreler: dict) -> Decimal:
    kv_data = parametreler.get("kv_oranlari", {})
    oranlar = kv_data.get("oranlar", [])
    for oran in reversed(oranlar):
        if oran.get("donem_baslangic", 0) <= donem_yili:
            bitis = oran.get("donem_bitis")
            if bitis is None or donem_yili <= bitis:
                return Decimal(str(oran.get("genel_oran", 0.25)))
    return Decimal("0.25")


def _yiakv_orani_al(donem_yili: int, parametreler: dict) -> Decimal | None:
    yiakv_data = parametreler.get("yiakv", {})
    yururluk = yiakv_data.get("yururluk_baslangic", "")
    if yururluk:
        baslangic_yili = int(yururluk[:4])
        if donem_yili >= baslangic_yili:
            return Decimal(str(yiakv_data.get("oran", 0.10)))
    return None


def pipeline_calistir(
    ticari_kar_zarar: float,
    kkeg: float,
    finansman_fonu: float,
    istek_listesi: list[str],
    kalem_verileri: dict[str, dict[str, Any]],
    donem_yili: int = 2025,
    kv_orani_override: float | None = None,
) -> PipelineSonucu:
    """
    Ticari kâr → matrah → vergi tam pipeline.

    §8'deki 13 adım sırayla uygulanır.
    """
    katalog = get_katalog()
    parametreler = _parametreler_yukle()
    kv_orani = Decimal(str(kv_orani_override)) if kv_orani_override else _kv_orani_al(donem_yili, parametreler)
    yiakv_orani = _yiakv_orani_al(donem_yili, parametreler)

    sonuc = PipelineSonucu()
    adimlar = []

    # Adım 1: Ticari bilanço kârı/zararı
    ara = Decimal(str(ticari_kar_zarar))
    adimlar.append(PipelineAdim(1, "Ticari bilanço kârı/zararı", Decimal("0"), ara,
                                f"Ticari bilanço kârı: {ara:,.2f} TL"))

    # Adım 2: KKEG ve ilaveler
    kkeg_dec = Decimal(str(kkeg))
    finansman_dec = Decimal(str(finansman_fonu))
    onceki = ara
    ara = ara + kkeg_dec + finansman_dec
    adimlar.append(PipelineAdim(2, "(+) KKEG ve ilaveler", onceki, ara,
                                f"KKEG: {kkeg_dec:,.2f} TL, Finansman fonu: {finansman_dec:,.2f} TL"))

    # Adım 3: Zarar olsa dahi indirilecek istisnalar (kod 297-386)
    zarar_olsa_dahi_toplam = Decimal("0")
    for ic_kod in istek_listesi:
        kalem = katalog.get(ic_kod)
        if not kalem or kalem.beyanname_bolumu.value != "zarar_olsa_dahi":
            continue
        girdi = kalem_verileri.get(ic_kod, {})
        kalem_sonuc = kalem_hesapla(kalem, girdi, donem_yili)
        sonuc.kalem_sonuclari[ic_kod] = kalem_sonuc
        if not kalem_sonuc.hatalar:
            zarar_olsa_dahi_toplam += kalem_sonuc.istisna_tutari

    onceki = ara
    ara = ara - zarar_olsa_dahi_toplam
    adimlar.append(PipelineAdim(3, "(−) Zarar olsa dahi indirilecek istisnalar", onceki, ara,
                                f"Toplam: {zarar_olsa_dahi_toplam:,.2f} TL"))

    # Adım 4: Ara sonuç — kâr mı zarar mı?
    adimlar.append(PipelineAdim(4, "Ara sonuç", ara, ara,
                                "Kâr" if ara > 0 else "Zarar"))

    # Adım 5-6: Kazanç varsa indirilecek (sadece kârda)
    kazanc_varsa_toplam = Decimal("0")
    if ara <= 0:
        sonuc.kazanc_varsa_gruplari_atlanmis = True
        adimlar.append(PipelineAdim(5, "Geçmiş yıl zarar mahsubu", ara, ara,
                                    "Zarar nedeniyle atlandı"))
        adimlar.append(PipelineAdim(6, "(−) Kazanç varsa indirilecek kalemler", ara, ara,
                                    "Zarar nedeniyle atlandı"))
    else:
        # Adım 5: Geçmiş yıl zarar mahsubu (şimdilik 0 — v1 basit)
        adimlar.append(PipelineAdim(5, "Geçmiş yıl zarar mahsubu", ara, ara,
                                    "Geçmiş yıl zararı yok"))

        # Adım 6: Kazanç varsa indirilecek
        for ic_kod in istek_listesi:
            kalem = katalog.get(ic_kod)
            if not kalem or kalem.beyanname_bolumu.value != "kazanc_varsa":
                continue
            girdi = kalem_verileri.get(ic_kod, {})
            kalem_sonuc = kalem_hesapla(kalem, girdi, donem_yili)
            sonuc.kalem_sonuclari[ic_kod] = kalem_sonuc
            if not kalem_sonuc.hatalar:
                kazanc_varsa_toplam += kalem_sonuc.istisna_tutari

        onceki = ara
        ara = ara - kazanc_varsa_toplam
        adimlar.append(PipelineAdim(6, "(−) Kazanç varsa indirilecek kalemler", onceki, ara,
                                    f"Toplam: {kazanc_varsa_toplam:,.2f} TL"))

    # Adım 7: Matrah
    matrah = max(ara, Decimal("0"))
    sonuc.matrah = matrah
    adimlar.append(PipelineAdim(7, "MATRAH (dönem safi kurum kazancı)", ara, matrah, ""))

    # Adım 8: KVK 32/A indirimli KV (v1'de atlanıyor)
    adimlar.append(PipelineAdim(8, "KVK 32/A indirimli KV matrah parçalanması", matrah, matrah,
                                "v1'de uygulanmıyor"))

    # Adım 9: Hesaplanan KV
    hesaplanan_kv = matrah * kv_orani
    sonuc.hesaplanan_kv = hesaplanan_kv
    adimlar.append(PipelineAdim(9, f"Hesaplanan KV (oran: %{kv_orani * 100:.0f})", matrah, hesaplanan_kv,
                                f"{matrah:,.2f} × {kv_orani} = {hesaplanan_kv:,.2f} TL"))

    # Adım 10: YİAKV paralel hesap
    if yiakv_orani and donem_yili >= 2025:
        yiakv_matrahi = Decimal(str(ticari_kar_zarar)) + kkeg_dec + finansman_dec
        for ic_kod in istek_listesi:
            kalem = katalog.get(ic_kod)
            if kalem and kalem.yiakv_etkisi.value == "dusulur":
                ks = sonuc.kalem_sonuclari.get(ic_kod)
                if ks and not ks.hatalar:
                    yiakv_matrahi -= ks.istisna_tutari

        yiakv_matrahi = max(yiakv_matrahi, Decimal("0"))
        yiakv = yiakv_matrahi * yiakv_orani
        sonuc.yiakv_matrahi = yiakv_matrahi
        sonuc.yiakv = yiakv
        adimlar.append(PipelineAdim(10, f"YİAKV paralel hesap (oran: %{yiakv_orani * 100:.0f})",
                                    yiakv_matrahi, yiakv,
                                    f"Matrah: {yiakv_matrahi:,.2f} TL → YİAKV: {yiakv:,.2f} TL"))

        # Adım 11: KV vs YİAKV karşılaştırma
        if yiakv > hesaplanan_kv:
            sonuc.odenecek_kv = yiakv
            sonuc.yiakv_uygulanmis = True
            adimlar.append(PipelineAdim(11, "KV vs YİAKV — YİAKV uygulanır",
                                        hesaplanan_kv, yiakv,
                                        f"YİAKV ({yiakv:,.2f}) > KV ({hesaplanan_kv:,.2f})"))
        else:
            sonuc.odenecek_kv = hesaplanan_kv
            adimlar.append(PipelineAdim(11, "KV vs YİAKV — Normal KV uygulanır",
                                        hesaplanan_kv, hesaplanan_kv,
                                        f"KV ({hesaplanan_kv:,.2f}) ≥ YİAKV ({yiakv:,.2f})"))
    else:
        sonuc.odenecek_kv = hesaplanan_kv
        adimlar.append(PipelineAdim(10, "YİAKV (2025 öncesi — uygulanmıyor)", Decimal("0"), Decimal("0"), ""))
        adimlar.append(PipelineAdim(11, "Ödenecek KV = Hesaplanan KV", hesaplanan_kv, hesaplanan_kv, ""))

    # Adım 12-13: Mahsuplar (v1'de kullanıcı girdisi bekliyor — şimdilik 0)
    adimlar.append(PipelineAdim(12, "(−) Mahsup edilecek vergiler", sonuc.odenecek_kv, sonuc.odenecek_kv,
                                "v1'de manuel mahsup"))
    adimlar.append(PipelineAdim(13, "Ödenecek / İade Edilecek KV", sonuc.odenecek_kv, sonuc.odenecek_kv, ""))

    sonuc.adimlar = adimlar
    return sonuc
