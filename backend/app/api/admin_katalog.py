import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.models.admin_config import AdminConfig
from app.db.models.ana_kategori import AnaKategori
from app.db.models.kalem_override import KalemOverride
from app.db.models.user import User
from app.db.session import get_db
from app.katalog.cache import get_katalog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/katalog", tags=["admin-katalog"])


# --- Schemas ---


class AnaKategoriCreate(BaseModel):
    kod: str
    soru: str
    etiket: str = ""
    bilgi: str | None = None
    grup: str
    beyanname_kodlari: list[int] | None = None
    sira: int = 0
    aktif: bool = True


class AnaKategoriUpdate(BaseModel):
    soru: str | None = None
    etiket: str | None = None
    bilgi: str | None = None
    grup: str | None = None
    beyanname_kodlari: list[int] | None = None
    sira: int | None = None
    aktif: bool | None = None


class AnaKategoriReorderItem(BaseModel):
    id: int
    sira: int


class KalemOverrideUpdate(BaseModel):
    aktif: bool | None = None
    sira: int | None = None


class KalemBulkItem(BaseModel):
    ic_kod: str
    aktif: bool


class WizardStepsUpdate(BaseModel):
    steps: list[dict]


# --- Ana Kategori endpoints ---


@router.get("/ana-kategoriler")
async def list_ana_kategoriler(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(AnaKategori).order_by(AnaKategori.sira))
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "kod": r.kod,
            "soru": r.soru,
            "etiket": r.etiket,
            "bilgi": r.bilgi,
            "grup": r.grup,
            "beyanname_kodlari": r.beyanname_kodlari,
            "sira": r.sira,
            "aktif": r.aktif,
        }
        for r in rows
    ]


@router.post("/ana-kategoriler", status_code=201)
async def create_ana_kategori(
    data: AnaKategoriCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    row = AnaKategori(
        kod=data.kod,
        soru=data.soru,
        etiket=data.etiket,
        bilgi=data.bilgi,
        grup=data.grup,
        beyanname_kodlari=data.beyanname_kodlari,
        sira=data.sira,
        aktif=data.aktif,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    logger.info("AnaKategori created kod=%s by admin id=%d", row.kod, current_admin.id)
    return {"id": row.id, "kod": row.kod}


@router.put("/ana-kategoriler/{kategori_id}")
async def update_ana_kategori(
    kategori_id: int,
    data: AnaKategoriUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(AnaKategori).where(AnaKategori.id == kategori_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="AnaKategori bulunamadı")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(row, field, value)
    await db.commit()
    await db.refresh(row)
    logger.info("AnaKategori updated id=%d by admin id=%d", kategori_id, current_admin.id)
    return {"id": row.id, "kod": row.kod}


@router.patch("/ana-kategoriler/reorder")
async def reorder_ana_kategoriler(
    items: list[AnaKategoriReorderItem],
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    ids = [item.id for item in items]
    result = await db.execute(select(AnaKategori).where(AnaKategori.id.in_(ids)))
    rows = {r.id: r for r in result.scalars().all()}
    for item in items:
        if item.id in rows:
            rows[item.id].sira = item.sira
    await db.commit()
    logger.info("AnaKategori reordered %d items by admin id=%d", len(items), current_admin.id)
    return {"updated": len(items)}


# --- Kalem override endpoints ---


@router.get("/kalemler")
async def list_kalemler_with_overrides(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    katalog = get_katalog()
    result = await db.execute(select(KalemOverride))
    overrides = {o.ic_kod: o for o in result.scalars().all()}
    output = []
    for kalem in katalog.values():
        ov = overrides.get(kalem.ic_kod)
        output.append(
            {
                "ic_kod": kalem.ic_kod,
                "baslik": kalem.baslik,
                "beyanname_bolumu": kalem.beyanname_bolumu,
                "ana_kategori": kalem.ana_kategori,
                "aktif": ov.aktif if ov else True,
                "sira": ov.sira if ov else None,
                "override_exists": ov is not None,
            }
        )
    return output


@router.patch("/kalemler/{ic_kod}")
async def update_kalem_override(
    ic_kod: str,
    data: KalemOverrideUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    katalog = get_katalog()
    if ic_kod not in katalog:
        raise HTTPException(status_code=404, detail=f"Kalem bulunamadı: {ic_kod}")
    result = await db.execute(select(KalemOverride).where(KalemOverride.ic_kod == ic_kod))
    ov = result.scalar_one_or_none()
    if ov is None:
        ov = KalemOverride(ic_kod=ic_kod, updated_by=current_admin.id)
        db.add(ov)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ov, field, value)
    ov.updated_by = current_admin.id
    await db.commit()
    await db.refresh(ov)
    logger.info("KalemOverride updated ic_kod=%s by admin id=%d", ic_kod, current_admin.id)
    return {"ic_kod": ov.ic_kod, "aktif": ov.aktif, "sira": ov.sira}


@router.patch("/kalemler/bulk")
async def bulk_update_kalemler(
    items: list[KalemBulkItem],
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    katalog = get_katalog()
    ic_kodlar = [item.ic_kod for item in items]
    result = await db.execute(
        select(KalemOverride).where(KalemOverride.ic_kod.in_(ic_kodlar))
    )
    existing = {o.ic_kod: o for o in result.scalars().all()}
    for item in items:
        if item.ic_kod not in katalog:
            continue
        if item.ic_kod in existing:
            existing[item.ic_kod].aktif = item.aktif
            existing[item.ic_kod].updated_by = current_admin.id
        else:
            ov = KalemOverride(ic_kod=item.ic_kod, aktif=item.aktif, updated_by=current_admin.id)
            db.add(ov)
    await db.commit()
    logger.info("KalemOverride bulk updated %d items by admin id=%d", len(items), current_admin.id)
    return {"updated": len(items)}


# --- Wizard steps endpoints ---


@router.get("/wizard-steps")
async def get_wizard_steps(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.config_key == "wizard_steps")
    )
    config = result.scalar_one_or_none()
    if not config:
        return {"config_key": "wizard_steps", "steps": []}
    return {"config_key": "wizard_steps", "steps": config.config_value}


@router.put("/wizard-steps")
async def upsert_wizard_steps(
    data: WizardStepsUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.config_key == "wizard_steps")
    )
    config = result.scalar_one_or_none()
    if config is None:
        config = AdminConfig(
            config_key="wizard_steps",
            config_value=data.steps,
            updated_by=current_admin.id,
        )
        db.add(config)
    else:
        config.config_value = data.steps
        config.updated_by = current_admin.id
    await db.commit()
    await db.refresh(config)
    logger.info("wizard_steps upserted by admin id=%d", current_admin.id)
    return {"config_key": "wizard_steps", "steps": config.config_value}
