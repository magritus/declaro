import pytest
from pathlib import Path
import yaml
from app.katalog.loader import KatalogLoader, KatalogYuklemeHatasi
from app.schemas.kalem import KalemSchema, BeyannameBolumuEnum


GECERLI_KALEM_DICT = {
    "ic_kod": "test_kalem",
    "baslik": "Test Kalemi",
    "beyanname_bolumu": "kazanc_varsa",
    "yiakv_etkisi": "dusulur",
    "beyanname_kodlari": [{"donem": 2025, "kod": 999}],
}


@pytest.fixture
def gecerli_yaml_dosyasi(tmp_path):
    yaml_file = tmp_path / "999_test.yaml"
    yaml_file.write_text(yaml.dump(GECERLI_KALEM_DICT, allow_unicode=True), encoding="utf-8")
    return tmp_path


class TestKatalogLoader:
    def test_gecerli_yaml_yuklenir(self, gecerli_yaml_dosyasi):
        loader = KatalogLoader(katalog_dir=gecerli_yaml_dosyasi)
        katalog = loader.yukle()
        assert "test_kalem" in katalog
        assert katalog["test_kalem"].baslik == "Test Kalemi"

    def test_gecersiz_yaml_hata_verir(self, tmp_path):
        yaml_file = tmp_path / "bad.yaml"
        yaml_file.write_text("ic_kod: eksik_alan_var\nbaslik: test", encoding="utf-8")
        loader = KatalogLoader(katalog_dir=tmp_path)
        with pytest.raises(KatalogYuklemeHatasi):
            loader.yukle()

    def test_cache_tekrar_yukleme_yapmaz(self, gecerli_yaml_dosyasi, mocker):
        loader = KatalogLoader(katalog_dir=gecerli_yaml_dosyasi)
        spy = mocker.spy(loader, "_yaml_oku")
        loader.yukle()
        loader.yukle()
        assert spy.call_count == 1

    def test_bos_dizin_bos_katalog_doner(self, tmp_path):
        loader = KatalogLoader(katalog_dir=tmp_path)
        assert loader.yukle() == {}

    def test_alt_cizgi_ile_baslayan_yaml_atlanir(self, tmp_path):
        schema_file = tmp_path / "_schema.yaml"
        schema_file.write_text("bu: atlanmali", encoding="utf-8")
        loader = KatalogLoader(katalog_dir=tmp_path)
        assert loader.yukle() == {}

    def test_get_by_gib_kodu(self, gecerli_yaml_dosyasi):
        loader = KatalogLoader(katalog_dir=gecerli_yaml_dosyasi)
        kalem = loader.get_by_gib_kodu(999, 2025)
        assert kalem is not None
        assert kalem.ic_kod == "test_kalem"

    def test_contains(self, gecerli_yaml_dosyasi):
        loader = KatalogLoader(katalog_dir=gecerli_yaml_dosyasi)
        assert "test_kalem" in loader
        assert "yok_kalem" not in loader


class TestKalemSchema:
    def test_gecerli_kalem(self):
        kalem = KalemSchema(**GECERLI_KALEM_DICT)
        assert kalem.ic_kod == "test_kalem"
        assert kalem.beyanname_bolumu == BeyannameBolumuEnum.KAZANC_VARSA

    def test_ic_kod_bos_olamaz(self):
        from pydantic import ValidationError
        data = {**GECERLI_KALEM_DICT, "ic_kod": ""}
        with pytest.raises(ValidationError):
            KalemSchema(**data)

    def test_gecersiz_enum_reddedilir(self):
        from pydantic import ValidationError
        data = {**GECERLI_KALEM_DICT, "beyanname_bolumu": "gecersiz"}
        with pytest.raises(ValidationError):
            KalemSchema(**data)

    def test_get_beyanname_kodu_donem_bulunur(self):
        kalem = KalemSchema(**GECERLI_KALEM_DICT)
        assert kalem.get_beyanname_kodu(2025) == 999

    def test_get_beyanname_kodu_onceki_donem(self):
        data = {**GECERLI_KALEM_DICT, "beyanname_kodlari": [{"donem": 2024, "kod": 998}]}
        kalem = KalemSchema(**data)
        assert kalem.get_beyanname_kodu(2025) == 998

    def test_get_beyanname_kodu_yoksa_none(self):
        data = {**GECERLI_KALEM_DICT, "beyanname_kodlari": []}
        kalem = KalemSchema(**data)
        assert kalem.get_beyanname_kodu(2025) is None
