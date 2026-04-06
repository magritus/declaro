from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Donem(Base):
    __tablename__ = "donem"
    __table_args__ = (
        UniqueConstraint("mukellef_id", "yil", "ceyrek", name="uq_donem_mukellef_yil_ceyrek"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    mukellef_id: Mapped[int] = mapped_column(ForeignKey("mukellef.id"), nullable=False, index=True)
    yil: Mapped[int] = mapped_column(Integer, nullable=False)
    ceyrek: Mapped[str] = mapped_column(String(10), nullable=False)  # Q1-GV, Q2-GV, Q3-GV, YILLIK
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    mukellef: Mapped["Mukellef"] = relationship("Mukellef", back_populates="donemler")
    calismalar: Mapped[list["Calisma"]] = relationship("Calisma", back_populates="donem", cascade="all, delete-orphan")
