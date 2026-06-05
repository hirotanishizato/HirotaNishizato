from app.schemas.common import ORMModel


class OrganizationCreate(ORMModel):
    name: str
    plan: str = "free"


class OrganizationOut(ORMModel):
    id: int
    name: str
    plan: str
