import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


class TestMukellefAPI:
    async def test_mukellef_olustur(self, client):
        r = await client.post("/mukellef", json={"unvan": "ABC A.Ş.", "vkn": "9999999990"})
        assert r.status_code == 201
        assert r.json()["unvan"] == "ABC A.Ş."
        assert "id" in r.json()

    async def test_gecersiz_vkn_reddedilir(self, client):
        r = await client.post("/mukellef", json={"unvan": "ABC A.Ş.", "vkn": "123"})
        assert r.status_code == 422

    async def test_mukellef_listele(self, client):
        r = await client.get("/mukellef")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
