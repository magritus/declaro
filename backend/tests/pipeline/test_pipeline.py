import pytest
from decimal import Decimal
from app.pipeline.pipeline import pipeline_calistir


class TestPipelineUctanUca:
    def test_kar_durumu_305_ile(self):
        """305 istisnası ile basit kâr senaryosu."""
        # 305 kalem için gerçek YAML formülleri çalışacak
        sonuc = pipeline_calistir(
            ticari_kar_zarar=10_000_000,
            kkeg=500_000,
            finansman_fonu=0,
            istek_listesi=["egitim_rehabilitasyon_5_1_i"],
            kalem_verileri={
                "egitim_rehabilitasyon_5_1_i": {
                    "kapsam_ici_hasilat": 3_000_000,
                    "kapsam_ici_giderler": 1_000_000,
                    "oran": 1.0,
                    "kurum_turu": "okul",
                    "faaliyete_gecis_tarihi": "2022-09-01",
                }
            },
            donem_yili=2025,
        )
        # 10M + 0.5M KKEG - 2M istisna (305: 3M-1M=2M, kazanc_varsa grubu) = 8.5M matrah
        # 305 kazanc_varsa grubunda
        assert sonuc.matrah == Decimal("8500000.00")
        assert sonuc.hesaplanan_kv == Decimal("2125000.00")  # %25

    def test_zarar_durumunda_kazanc_varsa_atlanir(self):
        sonuc = pipeline_calistir(
            ticari_kar_zarar=-500_000,
            kkeg=0,
            finansman_fonu=0,
            istek_listesi=[],
            kalem_verileri={},
            donem_yili=2025,
        )
        assert sonuc.matrah == Decimal("0.00")
        assert sonuc.kazanc_varsa_gruplari_atlanmis is True

    def test_yiakv_2025_hesaplanir(self):
        sonuc = pipeline_calistir(
            ticari_kar_zarar=10_000_000,
            kkeg=0,
            finansman_fonu=0,
            istek_listesi=[],
            kalem_verileri={},
            donem_yili=2025,
        )
        # YİAKV oranı %10, matrah 10M → YİAKV 1M
        assert sonuc.yiakv == Decimal("1000000.00")

    def test_yiakv_2024_hesaplanmaz(self):
        sonuc = pipeline_calistir(
            ticari_kar_zarar=10_000_000,
            kkeg=0,
            finansman_fonu=0,
            istek_listesi=[],
            kalem_verileri={},
            donem_yili=2024,
        )
        assert sonuc.yiakv == Decimal("0")
        assert sonuc.yiakv_uygulanmis is False

    def test_adim_sayisi_13(self):
        sonuc = pipeline_calistir(
            ticari_kar_zarar=1_000_000,
            kkeg=0,
            finansman_fonu=0,
            istek_listesi=[],
            kalem_verileri={},
            donem_yili=2025,
        )
        assert len(sonuc.adimlar) == 13
