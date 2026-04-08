from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class AnaKategori(Base):
    __tablename__ = "ana_kategori"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    kod: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    # "istirak_kazanc_istisnalari", "serbest_bolge_tgb_istisnalari" etc.

    soru: Mapped[str] = mapped_column(Text, nullable=False)
    # "İştirak kazancı istisnası var mı?" gibi wizard sorusu

    etiket: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    # "Her koşulda indirilir" veya "Kazanç varsa indirilir"

    bilgi: Mapped[str | None] = mapped_column(Text)
    # Uzun markdown açıklama metni

    grup: Mapped[str] = mapped_column(String(50), nullable=False)
    # "zarar_olsa_dahi" veya "kazanc_varsa"

    beyanname_kodlari: Mapped[list | None] = mapped_column(JSON)
    # Bu kategoriye ait XML beyanname kodları: [297, 298, 299, ...]

    sira: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    aktif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
