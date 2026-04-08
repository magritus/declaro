from datetime import datetime
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class KalemOverride(Base):
    __tablename__ = "kalem_override"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ic_kod: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    # YAML'daki ic_kod'a karşılık gelir

    aktif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sira: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # None ise YAML'daki doğal sıra kullanılır

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
