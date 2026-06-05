from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_user_shop
from app.core.crypto import encrypt
from app.db.session import get_db
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopCreate, ShopOut, ShopUpdate
from app.services import audit
from app.services.inquiry_sync import sync_inquiries_for_shop

_SECRET_FIELDS = {"rms_service_secret", "rms_license_key"}

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
        auto_sync_enabled=shop.auto_sync_enabled,
        has_rms_credentials=bool(shop.rms_service_secret and shop.rms_license_key),
        last_synced_at=shop.last_synced_at,
        last_sync_count=shop.last_sync_count,
        last_sync_error=shop.last_sync_error,
    )


@router.get("", response_model=list[ShopOut])
def list_shops(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ShopOut]:
    shops = (
        db.query(Shop)
        .filter(Shop.organization_id == user.organization_id)
        .order_by(Shop.id)
        .all()
    )
    return [_to_out(s) for s in shops]


@router.post("", response_model=ShopOut, status_code=201)
def create_shop(
    payload: ShopCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShopOut:
    data = payload.model_dump()
    # 自分のOrganization以外には作らせない
    data["organization_id"] = user.organization_id
    for f in _SECRET_FIELDS:
        if data.get(f):
            data[f] = encrypt(data[f])
    shop = Shop(**data)
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return _to_out(shop)


@router.get("/{shop_id}", response_model=ShopOut)
def get_shop(shop: Shop = Depends(get_user_shop)) -> ShopOut:
    return _to_out(shop)


@router.patch("/{shop_id}", response_model=ShopOut)
def update_shop(
    request: Request,
    payload: ShopUpdate,
    shop: Shop = Depends(get_user_shop),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ShopOut:
    changes = payload.model_dump(exclude_unset=True)
    touched_secrets = bool(_SECRET_FIELDS & changes.keys() & {k for k, v in changes.items() if v})
    for k, v in changes.items():
        if k in _SECRET_FIELDS and v:
            v = encrypt(v)
        setattr(shop, k, v)
    db.commit()
    db.refresh(shop)
    if touched_secrets:
        audit.write(
            action="shop.update_credentials",
            organization_id=user.organization_id,
            user_id=user.id,
            target_type="shop",
            target_id=shop.id,
            request=request,
        )
    return _to_out(shop)


@router.post("/{shop_id}/sync-inquiries", status_code=202)
async def sync_inquiries(
    shop: Shop = Depends(get_user_shop),
    db: Session = Depends(get_db),
) -> dict:
    created = await sync_inquiries_for_shop(db, shop)
    return {"created": len(created), "ids": [i.id for i in created]}
