from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import assert_shop_in_org, get_current_user
from app.db.session import get_db
from app.models.manual import Manual
from app.models.shop import Shop
from app.models.user import User
from app.schemas.manual import ManualCreate, ManualOut, ManualUpdate

router = APIRouter()


def _scoped(manual_id: int, db: Session, user: User) -> Manual:
    m = (
        db.query(Manual)
        .join(Shop, Manual.shop_id == Shop.id)
        .filter(Manual.id == manual_id, Shop.organization_id == user.organization_id)
        .first()
    )
    if not m:
        raise HTTPException(404, "Manual not found")
    return m


@router.get("", response_model=list[ManualOut])
def list_manuals(
    shop_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Manual]:
    assert_shop_in_org(db, shop_id, user.organization_id)
    return db.query(Manual).filter(Manual.shop_id == shop_id).order_by(Manual.id).all()


@router.post("", response_model=ManualOut, status_code=201)
def create_manual(
    payload: ManualCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Manual:
    assert_shop_in_org(db, payload.shop_id, user.organization_id)
    m = Manual(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/{manual_id}", response_model=ManualOut)
def update_manual(
    manual_id: int,
    payload: ManualUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Manual:
    m = _scoped(manual_id, db, user)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{manual_id}", status_code=204)
def delete_manual(
    manual_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    m = _scoped(manual_id, db, user)
    db.delete(m)
    db.commit()
