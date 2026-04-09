from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Gecersiz token")
    result = await db.execute(
        select(User).where(User.id == int(user_id), User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanici bulunamadi")
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetkiniz yok")
    return current_user


async def user_has_mukellef_access(user: User, mukellef_id: int, db: AsyncSession) -> bool:
    if user.role.value == "admin":
        return True

    from app.db.models.mukellef import Mukellef
    from app.db.models.mukellef_yetki import MukellefYetki

    # owner_id kontrolü
    owner_result = await db.execute(
        select(Mukellef.id).where(Mukellef.id == mukellef_id, Mukellef.owner_id == user.id)
    )
    if owner_result.scalar_one_or_none() is not None:
        return True

    # mukellef_yetki tablosu kontrolü
    yetki_result = await db.execute(
        select(MukellefYetki.id).where(
            MukellefYetki.user_id == user.id,
            MukellefYetki.mukellef_id == mukellef_id,
        )
    )
    return yetki_result.scalar_one_or_none() is not None


async def verify_mukellef_owner(mukellef_id: int, user: User, db: AsyncSession):
    from app.db.models.mukellef import Mukellef

    result = await db.execute(select(Mukellef).where(Mukellef.id == mukellef_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Mukellef bulunamadi")
    if not await user_has_mukellef_access(user, mukellef_id, db):
        raise HTTPException(status_code=403, detail="Bu mukellefe erisim yetkiniz yok")
    return m


async def verify_donem_owner(donem_id: int, user: User, db: AsyncSession):
    from app.db.models.donem import Donem

    result = await db.execute(select(Donem).where(Donem.id == donem_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Donem bulunamadi")
    if not await user_has_mukellef_access(user, d.mukellef_id, db):
        raise HTTPException(status_code=403, detail="Bu doneme erisim yetkiniz yok")
    return d


async def verify_calisma_owner(calisma_id: int, user: User, db: AsyncSession):
    from app.db.models.calisma import Calisma
    from app.db.models.donem import Donem

    result = await db.execute(select(Calisma).where(Calisma.id == calisma_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Calisma bulunamadi")
    donem_result = await db.execute(select(Donem).where(Donem.id == c.donem_id))
    d = donem_result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Donem bulunamadi")
    if not await user_has_mukellef_access(user, d.mukellef_id, db):
        raise HTTPException(status_code=403, detail="Bu calismaya erisim yetkiniz yok")
    return c
