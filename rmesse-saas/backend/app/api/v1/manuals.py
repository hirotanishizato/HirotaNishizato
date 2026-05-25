from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.manual import Manual
from app.schemas.manual import ManualCreate, ManualOut, ManualUpdate

router = APIRouter()


@router.get("", response_model=list[ManualOut])
def list_manuals(shop_id: int, db: Session = Depends(get_db)) -> list[Manual]:
    return db.query(Manual).filter(Manual.shop_id == shop_id).order_by(Manual.id).all()


@router.post("", response_model=ManualOut, status_code=201)
def create_manual(payload: ManualCreate, db: Session = Depends(get_db)) -> Manual:
    m = Manual(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/{manual_id}", response_model=ManualOut)
def update_manual(manual_id: int, payload: ManualUpdate, db: Session = Depends(get_db)) -> Manual:
    m = db.get(Manual, manual_id)
    if not m:
        raise HTTPException(404, "Manual not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{manual_id}", status_code=204)
def delete_manual(manual_id: int, db: Session = Depends(get_db)) -> None:
    m = db.get(Manual, manual_id)
    if not m:
        raise HTTPException(404, "Manual not found")
    db.delete(m)
    db.commit()
