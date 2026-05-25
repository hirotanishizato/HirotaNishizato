from app.schemas.common import ORMModel


class DeliveryRuleBase(ORMModel):
    name: str
    cutoff_time: str | None = None
    business_days: list[str] | None = None
    ship_within_business_days: int = 1
    arrival_by_region: dict[str, str] | None = None
    closed_dates: list[str] | None = None
    applies_to_product_external_ids: list[str] | None = None
    notes: str | None = None
    is_active: bool = True
    priority: int = 0


class DeliveryRuleCreate(DeliveryRuleBase):
    shop_id: int


class DeliveryRuleUpdate(ORMModel):
    name: str | None = None
    cutoff_time: str | None = None
    business_days: list[str] | None = None
    ship_within_business_days: int | None = None
    arrival_by_region: dict[str, str] | None = None
    closed_dates: list[str] | None = None
    applies_to_product_external_ids: list[str] | None = None
    notes: str | None = None
    is_active: bool | None = None
    priority: int | None = None


class DeliveryRuleOut(DeliveryRuleBase):
    id: int
    shop_id: int
