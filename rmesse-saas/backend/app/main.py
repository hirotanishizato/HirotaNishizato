from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app import scheduler
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.rate_limit import limiter

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    scheduler.start()
    try:
        yield
    finally:
        await scheduler.stop()


app = FastAPI(
    title="R-Messe Inquiry SaaS API",
    version="0.1.0",
    description="楽天R-Messe問い合わせ管理 + AI下書き生成 SaaS",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}
