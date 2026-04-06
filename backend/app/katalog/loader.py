import logging
import yaml
from pathlib import Path
from pydantic import ValidationError
from app.schemas.kalem import KalemSchema

logger = logging.getLogger(__name__)


class KatalogYuklemeHatasi(Exception):
    pass


class KatalogLoader:
    def __init__(self, katalog_dir: str | Path | None = None):
        if katalog_dir is None:
            # Proje kök dizinine göre kalemler/ dizini
            self.katalog_dir = Path(__file__).parent.parent.parent.parent / "kalemler"
        else:
            self.katalog_dir = Path(katalog_dir)
        self._cache: dict[str, KalemSchema] | None = None

    def _yaml_oku(self, path: Path) -> dict:
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f)

    def yukle(self, force: bool = False) -> dict[str, KalemSchema]:
        if self._cache is not None and not force:
            return self._cache

        katalog: dict[str, KalemSchema] = {}
        hatalar: list[str] = []

        yaml_files = list(self.katalog_dir.glob("*.yaml"))
        if not yaml_files:
            return katalog

        for yaml_path in sorted(yaml_files):
            if yaml_path.name.startswith("_"):
                continue
            try:
                data = self._yaml_oku(yaml_path)
                kalem = KalemSchema(**data)
                katalog[kalem.ic_kod] = kalem
            except (ValidationError, Exception) as e:
                hatalar.append(f"{yaml_path.name}: {e}")

        if hatalar:
            raise KatalogYuklemeHatasi(
                f"Katalog yüklenirken {len(hatalar)} hata:\n" + "\n".join(hatalar)
            )

        logger.info("Katalog yuklendi: %d kalem", len(katalog))
        self._cache = katalog
        return katalog

    def get(self, ic_kod: str) -> KalemSchema | None:
        return self.yukle().get(ic_kod)

    def get_by_gib_kodu(self, gib_kodu: int, donem_yili: int) -> KalemSchema | None:
        for kalem in self.yukle().values():
            if kalem.get_beyanname_kodu(donem_yili) == gib_kodu:
                return kalem
        return None

    def __contains__(self, ic_kod: str) -> bool:
        return ic_kod in self.yukle()
