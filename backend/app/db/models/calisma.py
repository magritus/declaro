from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime, JSON, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Calisma(Base):
    __tablename__ = "calisma"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    donem_id: Mapped[int] = mapped_column(ForeignKey("donem.id"), nullable=False, index=True)

    # Faz 0 temel girdiler
    ticari_kar_zarar: Mapped[float | None] = mapped_column(Numeric(18, 2))
    kkeg: Mapped[float | None] = mapped_column(Numeric(18, 2), default=0)
    finansman_fonu: Mapped[float | None] = mapped_column(Numeric(18, 2), default=0)
    kar_mi_zarar_mi: Mapped[str | None] = mapped_column(String(10))  # "kar" | "zarar"

    # Wizard state
    wizard_faz: Mapped[int] = mapped_column(default=0)  # 0, 1, 2, tamamlandi
    wizard_cevaplari: Mapped[dict | None] = mapped_column(JSON, default=dict)
    istek_listesi: Mapped[list | None] = mapped_column(JSON, default=list)  # seçilen ic_kod listesi

    tamamlandi: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    donem: Mapped["Donem"] = relationship("Donem", back_populates="calismalar")
    kalem_verileri: Mapped[list["KalemVerisi"]] = relationship("KalemVerisi", back_populates="calisma", cascade="all, delete-orphan")
