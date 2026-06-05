from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationOut

router = APIRouter()


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Organization:
    org = db.get(Organization, user.organization_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    return org
