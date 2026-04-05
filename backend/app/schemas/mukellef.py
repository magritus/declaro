from datetime import datetime
from pydantic import BaseModel, field_validator


class MukellefCreate(BaseModel):
    unvan: str
    vkn: str
    vergi_dairesi: str | None = None

    @field_validator("vkn")
    @classmethod
    def vkn_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("VKN 10 haneli sayı olmalıdır")
        return v

    @field_validator("unvan")
    @classmethod
    def unvan_bos_olamaz(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Ünvan boş olamaz")
        return v.strip()


class MukellefResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    unvan: str
    vkn: str
    vergi_dairesi: str | None
    created_at: datetime
