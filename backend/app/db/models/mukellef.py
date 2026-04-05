from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Mukellef(Base):
    __tablename__ = "mukellef"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    unvan: Mapped[str] = mapped_column(String(200), nullable=False)
    vkn: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    vergi_dairesi: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    donemler: Mapped[list["Donem"]] = relationship("Donem", back_populates="mukellef", cascade="all, delete-orphan")
