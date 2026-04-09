from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MukellefYetki(Base):
    __tablename__ = "mukellef_yetki"
    __table_args__ = (
        UniqueConstraint("user_id", "mukellef_id", name="uq_mukellef_yetki"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    mukellef_id: Mapped[int] = mapped_column(ForeignKey("mukellef.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User")
    mukellef: Mapped["Mukellef"] = relationship("Mukellef")
