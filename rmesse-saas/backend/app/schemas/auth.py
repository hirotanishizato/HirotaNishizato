from pydantic import BaseModel, EmailStr

from app.models.user import UserRole
from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105 - OAuth token_type, not a password


class UserOut(ORMModel):
    id: int
    organization_id: int
    email: str
    name: str
    role: UserRole
    is_active: bool


class SignupRequest(BaseModel):
    organization_name: str
    email: EmailStr
    password: str
    name: str
