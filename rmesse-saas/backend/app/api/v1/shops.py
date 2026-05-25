from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopOut, ShopUpdate
from app.services.inquiry_sync import sync_inquiries_for_shop

router = APIRouter()


def _to_out(shop: Shop) -> ShopOut:
    return ShopOut(
        id=shop.id,
        organization_id=shop.organization_id,
        name=shop.name,
        platform=shop.platform,
        shop_code=shop.shop_code,
        ai_persona=shop.ai_persona,
        ai_signature=shop.ai_signature,
        is_active=shop.is_active,
        has_rms_credentials=bool(shop.rms_service_secret and shop.rms_license_key),
    )


@router.get("", response_model=list[ShopOut])
def list_shops(
    organization_id: int | None = None, db: Session = Depends(get_db)
) -> list[ShopOut]:
    q = db.query(Shop)
    if organization_id is not None:
        q = q.filter(Shop.organization_id == organization_id)
    return [_to_out(s) for s in q.order_by(Shop.id).all()]


@router.post("", response_model=ShopOut, status_code=201)
def create_shop(payload: ShopCreate, db: Session = Depends(get_db)) -> ShopOut:
    shop = Shop(**payload.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return _to_out(shop)


@router.get("/{shop_id}", response_model=ShopOut)
def get_shop(shop_id: int, db: Session = Depends(get_db)) -> ShopOut:
    shop = db.get(Shop, shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    return _to_out(shop)


@router.patch("/{shop_id}", response_model=ShopOut)
def update_shop(shop_id: int, payload: ShopUpdate, db: Session = Depends(get_db)) -> ShopOut:
    shop = db.get(Shop, shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(shop, k, v)
    db.commit()
    db.refresh(shop)
    return _to_out(shop)


@router.post("/{shop_id}/sync-inquiries", status_code=202)
async def sync_inquiries(shop_id: int, db: Session = Depends(get_db)) -> dict:
    shop = db.get(Shop, shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    created = await sync_inquiries_for_shop(db, shop)
    return {"created": len(created), "ids": [i.id for i in created]}
