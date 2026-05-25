from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserOut
from app.services import audit

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=201)
@limiter.limit("5/hour")
def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.query(User).filter(User.email == payload.email).first():
        audit.write(
            action="auth.signup",
            success=False,
            meta={"email": payload.email, "reason": "duplicate"},
            request=request,
        )
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    org = Organization(name=payload.organization_name, plan="free")
    db.add(org)
    db.flush()
    user = User(
        organization_id=org.id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=UserRole.OWNER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=str(user.id), claims={"org": user.organization_id})
    audit.write(
        action="auth.signup",
        organization_id=org.id,
        user_id=user.id,
        request=request,
    )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        audit.write(
            action="auth.login",
            success=False,
            meta={"email": payload.email},
            request=request,
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_access_token(subject=str(user.id), claims={"org": user.organization_id})
    audit.write(
        action="auth.login",
        organization_id=user.organization_id,
        user_id=user.id,
        request=request,
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
