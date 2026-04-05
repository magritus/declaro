import re
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from simpleeval import SimpleEval, NameNotDefined, FunctionNotDefined, InvalidExpression


class EvaluatorGuvenlikHatasi(Exception):
    pass


class ForumulDegiskenHatasi(Exception):
    pass


class ValidasyonHatasi(Exception):
    def __init__(self, message: str, kural: str = ""):
        super().__init__(message)
        self.kural = kural


# Yasak kelimeler — bunlar formülde geçemez
YASAK_KELIMELER = [
    "__import__", "__builtins__", "__class__", "__globals__",
    "exec", "eval", "compile", "open", "os", "sys",
    "subprocess", "importlib", "getattr", "setattr", "delattr",
    "vars", "dir", "type", "hasattr", "callable", "iter", "next",
    "__dict__", "__doc__", "__module__",
]

# Kısa kelimeler (1-3 karakter) — substring eşleşmesini önlemek için kelime sınırı kullan
_KISA_YASAK_KELIMELER = {k for k in YASAK_KELIMELER if len(k) <= 3}


def _gecen_yil_sayisi(tarih_str: str | date) -> int:
    """Verilen tarihten bugüne kaç yıl geçmiş."""
    if isinstance(tarih_str, str):
        tarih = date.fromisoformat(tarih_str)
    elif isinstance(tarih_str, datetime):
        tarih = tarih_str.date()
    else:
        tarih = tarih_str
    bugun = date.today()
    return bugun.year - tarih.year - (
        (bugun.month, bugun.day) < (tarih.month, tarih.day)
    )


def _str_sayisal_mi(s: str) -> bool:
    """String'in gerçek bir sayı olup olmadığını kontrol eder (tarih gibi string'leri dışlar)."""
    try:
        float(s)
        return True
    except ValueError:
        return False


def _guvenlik_kontrol(formul: str) -> None:
    """Formülde yasak kelime var mı kontrol et."""
    formul_lower = formul.lower()
    for yasak in YASAK_KELIMELER:
        if yasak in _KISA_YASAK_KELIMELER:
            # Kısa kelimeler için kelime sınırı kullan (örn: "os" → "cos" içinde eşleşmesin)
            if re.search(r'\b' + re.escape(yasak) + r'\b', formul_lower):
                raise EvaluatorGuvenlikHatasi(f"Güvenlik ihlali: '{yasak}' formülde kullanılamaz")
        else:
            if yasak in formul_lower:
                raise EvaluatorGuvenlikHatasi(f"Güvenlik ihlali: '{yasak}' formülde kullanılamaz")


class ForumulEvaluator:
    """YAML formüllerini güvenli sandbox'ta çalıştırır."""

    IZIN_VERILEN_FONKSIYONLAR = {
        "min": min,
        "max": max,
        "abs": abs,
        "round": round,
        "int": int,
        "float": float,
        "gecen_yil_sayisi": _gecen_yil_sayisi,
    }

    def hesapla(self, formul: str, context: dict[str, Any]) -> Decimal:
        """
        Formülü güvenli sandbox'ta hesaplar, Decimal döner.

        Args:
            formul: YAML'dan gelen formül string'i
            context: değişken adı → değer mapping'i

        Raises:
            EvaluatorGuvenlikHatasi: Yasak kelime kullanımı
            ForumulDegiskenHatasi: Tanımsız değişken
        """
        _guvenlik_kontrol(formul)

        # Context değerlerini float'a çevir (Decimal, str gibi gelebilir)
        temiz_context: dict[str, Any] = {}
        for k, v in context.items():
            if isinstance(v, Decimal):
                temiz_context[k] = float(v)
            elif isinstance(v, str) and _str_sayisal_mi(v):
                temiz_context[k] = float(v)
            else:
                temiz_context[k] = v

        evaluator = SimpleEval()
        evaluator.ATTR_INDEX_FALLBACK = False
        evaluator.functions = self.IZIN_VERILEN_FONKSIYONLAR
        evaluator.names = temiz_context

        try:
            sonuc = evaluator.eval(formul)
        except NameNotDefined as e:
            raise ForumulDegiskenHatasi(f"Tanımsız değişken: {e}") from e
        except FunctionNotDefined as e:
            raise EvaluatorGuvenlikHatasi(f"İzin verilmeyen fonksiyon: {e}") from e
        except InvalidExpression as e:
            raise EvaluatorGuvenlikHatasi(f"Geçersiz formül: {e}") from e
        except Exception as e:
            # Diğer tüm hataları güvenlik hatası say
            if any(yasak in str(e).lower() for yasak in YASAK_KELIMELER):
                raise EvaluatorGuvenlikHatasi(f"Güvenlik ihlali: {e}") from e
            raise EvaluatorGuvenlikHatasi(f"Formül çalıştırma hatası: {e}") from e

        # Sonucu Decimal'e çevir
        if sonuc is None:
            return Decimal("0")
        return Decimal(str(sonuc)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def validasyon_kontrol(
        self,
        validasyonlar: list[dict],
        context: dict[str, Any],
        ara_sonuclar: dict[str, Any] | None = None,
    ) -> list[str]:
        """
        Validasyon kurallarını çalıştırır, başarısız olanların hata mesajlarını döner.

        Returns:
            Hata mesajları listesi (boş = tümü geçti)
        """
        hatalar: list[str] = []
        tam_context = {**context, **(ara_sonuclar or {})}

        for validasyon in validasyonlar:
            kural = validasyon.get("kural", "")
            hata_mesaji = validasyon.get("hata", "Validasyon hatası")

            try:
                _guvenlik_kontrol(kural)
                evaluator = SimpleEval()
                evaluator.ATTR_INDEX_FALLBACK = False
                evaluator.functions = self.IZIN_VERILEN_FONKSIYONLAR

                temiz_context: dict[str, Any] = {}
                for k, v in tam_context.items():
                    if isinstance(v, Decimal):
                        temiz_context[k] = float(v)
                    else:
                        temiz_context[k] = v

                evaluator.names = temiz_context
                gecti = evaluator.eval(kural)
                if not gecti:
                    hatalar.append(hata_mesaji)
            except NameNotDefined:
                pass  # değişken henüz mevcut değil, bu validasyonu atla

        return hatalar

    def formulleri_hesapla(
        self,
        formuller: dict[str, str],
        kullanici_girdisi: dict[str, Any],
        parametreler: dict[str, Any],
        validasyonlar: list[dict] | None = None,
    ) -> tuple[dict[str, Decimal], list[str]]:
        """
        Tüm formülleri sırayla hesaplar.

        Returns:
            (ara_sonuclar, hata_mesajlari) tuple'ı
        """
        context = {**parametreler, **kullanici_girdisi}
        ara_sonuclar: dict[str, Any] = {}

        for degisken, formul in formuller.items():
            tam_context = {**context, **ara_sonuclar}
            try:
                ara_sonuclar[degisken] = self.hesapla(formul, tam_context)
                # float olarak da ekle (sonraki formüller için)
                tam_context[degisken] = float(ara_sonuclar[degisken])
            except (ForumulDegiskenHatasi, EvaluatorGuvenlikHatasi):
                ara_sonuclar[degisken] = Decimal("0")

        hatalar = self.validasyon_kontrol(validasyonlar or [], context, {k: float(v) for k, v in ara_sonuclar.items()})

        return ara_sonuclar, hatalar
