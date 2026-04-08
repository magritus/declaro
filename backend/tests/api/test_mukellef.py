import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.auth.deps import get_current_user
from app.db.session import get_db
from app.db.models.user import User


def make_mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@test.com"
    user.is_active = True
    user.role = MagicMock()
    user.role.value = "admin"
    return user


def make_mock_db():
    from datetime import datetime, timezone
    from app.db.models.mukellef import Mukellef

    db = AsyncMock()

    # execute result — boş (VKN çakışması yok, liste boş)
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.flush = AsyncMock()

    # refresh — eklenen objeye id ve created_at yaz
    async def mock_refresh(obj):
        obj.id = 1
        obj.created_at = datetime.now(timezone.utc)

    db.refresh = mock_refresh
    return db


@pytest.fixture
async def client():
    mock_user = make_mock_user()
    mock_db = make_mock_db()

    async def override_auth():
        return mock_user

    async def override_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)


class TestMukellefAPI:
    async def test_mukellef_olustur(self, client):
        r = await client.post("/mukellef", json={"unvan": "ABC A.Ş.", "vkn": "9999999990"})
        assert r.status_code != 401, f"Auth override çalışmadı: {r.text}"

    async def test_gecersiz_vkn_reddedilir(self, client):
        r = await client.post("/mukellef", json={"unvan": "ABC A.Ş.", "vkn": "123"})
        assert r.status_code == 422

    async def test_mukellef_listele(self, client):
        r = await client.get("/mukellef")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
