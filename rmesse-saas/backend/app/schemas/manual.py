from app.schemas.common import ORMModel


class ManualBase(ORMModel):
    title: str
    content: str
    applies_to_product_external_ids: list[str] | None = None
    tags: list[str] | None = None
    is_active: bool = True


class ManualCreate(ManualBase):
    shop_id: int


class ManualUpdate(ORMModel):
    title: str | None = None
    content: str | None = None
    applies_to_product_external_ids: list[str] | None = None
    tags: list[str] | None = None
    is_active: bool | None = None


class ManualOut(ManualBase):
    id: int
    shop_id: int
