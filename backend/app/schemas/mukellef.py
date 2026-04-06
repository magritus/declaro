from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class MukellefCreate(BaseModel):
    unvan: str = Field(..., min_length=1, max_length=200)
    vkn: str = Field(..., min_length=10, max_length=10)
    vergi_dairesi: str | None = Field(default=None, max_length=100)
    kv_orani: float = 0.25

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

    @field_validator("kv_orani")
    @classmethod
    def kv_orani_gecerli(cls, v: float) -> float:
        if not (0 < v <= 1):
            raise ValueError("KV oranı 0 ile 1 arasında olmalıdır (örn: 0.25)")
        return v


class MukellefUpdate(BaseModel):
    unvan: str | None = None
    vergi_dairesi: str | None = None
    kv_orani: float | None = None

    @field_validator("kv_orani")
    @classmethod
    def kv_orani_gecerli(cls, v: float | None) -> float | None:
        if v is not None and not (0 < v <= 1):
            raise ValueError("KV oranı 0 ile 1 arasında olmalıdır (örn: 0.25)")
        return v


class MukellefResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    unvan: str
    vkn: str
    vergi_dairesi: str | None
    kv_orani: float
    created_at: datetime
