from app.schemas.common import ORMModel


class TemplateBase(ORMModel):
    title: str
    category: str | None = None
    body: str
    match_keywords: list[str] | None = None
    description: str | None = None
    is_active: bool = True
    priority: int = 0


class TemplateCreate(TemplateBase):
    shop_id: int


class TemplateUpdate(ORMModel):
    title: str | None = None
    category: str | None = None
    body: str | None = None
    match_keywords: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None
    priority: int | None = None


class TemplateOut(TemplateBase):
    id: int
    shop_id: int
