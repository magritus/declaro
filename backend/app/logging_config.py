import logging
import sys

from app.config import settings


def setup_logging() -> None:
    level = logging.DEBUG if settings.environment == "development" else logging.INFO
    fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"

    logging.basicConfig(
        level=level,
        format=fmt,
        stream=sys.stdout,
    )

    # Quieten noisy third-party loggers in production
    if settings.environment != "development":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
