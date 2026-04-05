import pytest
from decimal import Decimal
from datetime import date
from app.formul_motoru.evaluator import (
    ForumulEvaluator,
    EvaluatorGuvenlikHatasi,
    ForumulDegiskenHatasi,
    ValidasyonHatasi,
)


@pytest.fixture
def evaluator():
    return ForumulEvaluator()


class TestGuvenlik:
    def test_import_yasak(self, evaluator):
        with pytest.raises(EvaluatorGuvenlikHatasi):
            evaluator.hesapla("__import__('os')", {})

    def test_exec_yasak(self, evaluator):
        with pytest.raises(EvaluatorGuvenlikHatasi):
            evaluator.hesapla("exec('x=1')", {})

    def test_eval_yasak(self, evaluator):
        with pytest.raises(EvaluatorGuvenlikHatasi):
            evaluator.hesapla("eval('1+1')", {})

    def test_open_yasak(self, evaluator):
        with pytest.raises(EvaluatorGuvenlikHatasi):
            evaluator.hesapla("open('/etc/passwd')", {})


class TestTemelFormüller:
    def test_toplama(self, evaluator):
        assert evaluator.hesapla("a + b", {"a": 100, "b": 200}) == Decimal("300.00")

    def test_carpma(self, evaluator):
        assert evaluator.hesapla("hasilat * oran", {"hasilat": 1000, "oran": 0.5}) == Decimal("500.00")

    def test_cikarma(self, evaluator):
        assert evaluator.hesapla("a - b", {"a": 1000, "b": 600}) == Decimal("400.00")

    def test_max_fonksiyon(self, evaluator):
        assert evaluator.hesapla("max(kar, 0)", {"kar": -500}) == Decimal("0.00")
        assert evaluator.hesapla("max(kar, 0)", {"kar": 500}) == Decimal("500.00")

    def test_min_fonksiyon(self, evaluator):
        assert evaluator.hesapla("min(a, b)", {"a": 100, "b": 50}) == Decimal("50.00")

    def test_abs_fonksiyon(self, evaluator):
        assert evaluator.hesapla("abs(zarar)", {"zarar": -300}) == Decimal("300.00")

    def test_round_fonksiyon(self, evaluator):
        sonuc = evaluator.hesapla("round(a, 2)", {"a": 3.14159})
        assert sonuc == Decimal("3.14")


class TestKalem305Formulleri:
    def test_faaliyet_kari(self, evaluator):
        context = {"kapsam_ici_hasilat": 2_000_000, "kapsam_ici_giderler": 1_200_000}
        sonuc = evaluator.hesapla("kapsam_ici_hasilat - kapsam_ici_giderler", context)
        assert sonuc == Decimal("800000.00")

    def test_istisna_tutari_pozitif_kar(self, evaluator):
        context = {"faaliyet_kari": 800_000, "oran": 1.0}
        sonuc = evaluator.hesapla("max(faaliyet_kari * oran, 0)", context)
        assert sonuc == Decimal("800000.00")

    def test_istisna_tutari_negatif_kar(self, evaluator):
        context = {"faaliyet_kari": -100_000, "oran": 1.0}
        sonuc = evaluator.hesapla("max(faaliyet_kari * oran, 0)", context)
        assert sonuc == Decimal("0.00")

    def test_decimal_input_desteklenir(self, evaluator):
        context = {"tutar": Decimal("1000000"), "oran": Decimal("0.25")}
        sonuc = evaluator.hesapla("tutar * oran", context)
        assert sonuc == Decimal("250000.00")


class TestGecenYilSayisi:
    def test_3_yil_once(self, evaluator):
        tarih = date(date.today().year - 3, 1, 1)
        sonuc = evaluator.hesapla("gecen_yil_sayisi(faaliyete_gecis_tarihi)", {"faaliyete_gecis_tarihi": tarih})
        assert sonuc == Decimal("3.00")

    def test_string_tarih(self, evaluator):
        tarih_str = f"{date.today().year - 2}-01-01"
        sonuc = evaluator.hesapla("gecen_yil_sayisi(t)", {"t": tarih_str})
        assert sonuc == Decimal("2.00")


class TestValidasyon:
    def test_gecerli_validasyon(self, evaluator):
        formuller = {"faaliyet_kari": "hasilat - gider"}
        validasyonlar = [{"kural": "faaliyet_kari > 0", "hata": "Zarar var"}]
        _, hatalar = evaluator.formulleri_hesapla(
            formuller,
            {"hasilat": 1_000_000, "gider": 600_000},
            {"oran": 1.0},
            validasyonlar,
        )
        assert hatalar == []

    def test_basarisiz_validasyon(self, evaluator):
        formuller = {"faaliyet_kari": "hasilat - gider"}
        validasyonlar = [{"kural": "faaliyet_kari > 0", "hata": "Kapsam içi faaliyet zararda"}]
        _, hatalar = evaluator.formulleri_hesapla(
            formuller,
            {"hasilat": 500_000, "gider": 700_000},
            {"oran": 1.0},
            validasyonlar,
        )
        assert len(hatalar) == 1
        assert "zararda" in hatalar[0]

    def test_tanimsiz_degisken_hatasi(self, evaluator):
        with pytest.raises(ForumulDegiskenHatasi):
            evaluator.hesapla("tanimsiz_degisken * 2", {})


class TestFormullerHesapla:
    def test_305_uctan_uca(self, evaluator):
        formuller = {
            "faaliyet_kari": "kapsam_ici_hasilat - kapsam_ici_giderler",
            "istisna_tutari": "max(faaliyet_kari * oran, 0)",
        }
        sonuclar, hatalar = evaluator.formulleri_hesapla(
            formuller,
            {"kapsam_ici_hasilat": 2_000_000, "kapsam_ici_giderler": 1_200_000},
            {"oran": 1.0},
        )
        assert sonuclar["faaliyet_kari"] == Decimal("800000.00")
        assert sonuclar["istisna_tutari"] == Decimal("800000.00")
        assert hatalar == []
