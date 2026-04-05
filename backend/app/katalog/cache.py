from functools import lru_cache
from app.katalog.loader import KatalogLoader


@lru_cache(maxsize=1)
def get_katalog_loader() -> KatalogLoader:
    return KatalogLoader()


def get_katalog():
    return get_katalog_loader().yukle()
