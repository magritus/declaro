from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Modelleri import et — Alembic autogenerate için gerekli
from app.db.models import mukellef, donem, calisma, kalem_verisi, user  # noqa: F401, E402
from app.db.models import mukellef_yetki  # noqa: F401, E402
