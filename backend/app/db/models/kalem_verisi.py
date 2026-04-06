from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class KalemVerisi(Base):
    __tablename__ = "kalem_verisi"
    __table_args__ = (
        UniqueConstraint('calisma_id', 'ic_kod', name='uq_calisma_kalem'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    calisma_id: Mapped[int] = mapped_column(ForeignKey("calisma.id"), nullable=False, index=True)
    ic_kod: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Kullanıcı form girdileri (Katman 1)
    girdi_verileri: Mapped[dict | None] = mapped_column(JSON, default=dict)

    # Hesaplama sonuçları
    hesap_sonucu: Mapped[dict | None] = mapped_column(JSON, default=dict)
    istisna_tutari: Mapped[float | None] = mapped_column(Numeric(18, 2))

    # K-checklist ve belge durumları
    k_checklist_durumu: Mapped[dict | None] = mapped_column(JSON, default=dict)
    belge_durumu: Mapped[dict | None] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    calisma: Mapped["Calisma"] = relationship("Calisma", back_populates="kalem_verileri")
