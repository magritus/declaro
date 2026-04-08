import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.auth.deps import get_current_user
from app.db.models.user import User


def make_mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@test.com"
    user.is_active = True
    user.role = MagicMock()
    user.role.value = "admin"
    return user


@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
async def auth_client():
    mock_user = make_mock_user()

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.pop(get_current_user, None)
