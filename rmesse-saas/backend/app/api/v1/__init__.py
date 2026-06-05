from fastapi import APIRouter

from app.api.v1 import (
    auth,
    delivery_rules,
    drafts,
    inquiries,
    manuals,
    organizations,
    shops,
    templates,
    usage,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(shops.router, prefix="/shops", tags=["shops"])
api_router.include_router(inquiries.router, prefix="/inquiries", tags=["inquiries"])
api_router.include_router(drafts.router, prefix="/drafts", tags=["drafts"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(manuals.router, prefix="/manuals", tags=["manuals"])
api_router.include_router(delivery_rules.router, prefix="/delivery-rules", tags=["delivery-rules"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"])
