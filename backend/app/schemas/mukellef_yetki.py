from datetime import datetime

from pydantic import BaseModel


class MukellefKisaResponse(BaseModel):
    id: int
    unvan: str
    vkn: str
    is_owner: bool = False

    model_config = {"from_attributes": True}


class KullaniciSirketlerResponse(BaseModel):
    yetkili_sirketler: list[MukellefKisaResponse]
    tum_sirketler: list[MukellefKisaResponse]


class YetkiIslemRequest(BaseModel):
    mukellef_id: int


class MukellefYetkiResponse(BaseModel):
    id: int
    user_id: int
    mukellef_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
