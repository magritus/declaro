from datetime import datetime
from typing import Literal
from pydantic import BaseModel

CeyrekTip = Literal["Q1-GV", "Q2-GV", "Q3-GV", "Q4-GV", "YILLIK"]


class DonemCreate(BaseModel):
    yil: int
    ceyrek: CeyrekTip


class DonemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    mukellef_id: int
    yil: int
    ceyrek: str
    created_at: datetime
