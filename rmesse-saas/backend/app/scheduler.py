"""バックグラウンド定期ジョブ（in-process asyncio タスク）。

設計判断:
- まずは asyncio.create_task で十分。SCHEDULER_ENABLED=false で停止可。
- 将来複数プロセスにスケールする時は Celery / RQ / arq に差し替える
  （`schedule_inquiry_sync` を Celery beat の `@periodic_task` で置換）。
- 1ティックで全アクティブShopを順次同期。Shop数が増えたら gather() に変える。
"""
from __future__ import annotations

import asyncio
import logging

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.shop import Shop
from app.services.inquiry_sync import sync_inquiries_for_shop

logger = logging.getLogger(__name__)

_task: asyncio.Task | None = None
_stop_event: asyncio.Event | None = None


async def _tick_once() -> None:
    """全アクティブショップを1回ずつ同期する。"""
    db = SessionLocal()
    try:
        shops = (
            db.query(Shop)
            .filter(Shop.is_active.is_(True), Shop.auto_sync_enabled.is_(True))
            .all()
        )
        for shop in shops:
            try:
                created = await sync_inquiries_for_shop(db, shop)
                if created:
                    logger.info("shop=%s synced %d new inquiries", shop.id, len(created))
            except Exception:  # noqa: BLE001
                logger.exception("scheduler: shop=%s sync error", shop.id)
    finally:
        db.close()


async def _loop() -> None:
    settings = get_settings()
    interval = settings.inquiry_sync_interval_seconds
    logger.info("scheduler started: interval=%ss", interval)
    assert _stop_event is not None
    while not _stop_event.is_set():
        try:
            await _tick_once()
        except Exception:  # noqa: BLE001
            logger.exception("scheduler tick failed")
        try:
            await asyncio.wait_for(_stop_event.wait(), timeout=interval)
        except TimeoutError:
            continue
    logger.info("scheduler stopped")


def start() -> None:
    global _task, _stop_event
    settings = get_settings()
    if not settings.scheduler_enabled:
        logger.info("scheduler disabled by SCHEDULER_ENABLED=false")
        return
    if _task and not _task.done():
        return
    _stop_event = asyncio.Event()
    _task = asyncio.create_task(_loop(), name="rmesse-scheduler")


async def stop() -> None:
    global _task, _stop_event
    if _stop_event is not None:
        _stop_event.set()
    if _task is not None:
        try:
            await asyncio.wait_for(_task, timeout=5)
        except TimeoutError:
            _task.cancel()
    _task = None
    _stop_event = None
