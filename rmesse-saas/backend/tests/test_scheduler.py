"""バックグラウンドジョブ (_tick_once) のテスト。"""
from datetime import UTC, datetime

import pytest

from app.models.organization import Organization
from app.models.shop import Shop
from app.scheduler import _tick_once
from tests.conftest import TestingSession


@pytest.fixture
def org_and_shops():
    db = TestingSession()
    try:
        org = Organization(name="O", plan="free")
        db.add(org)
        db.flush()
        s_active = Shop(
            organization_id=org.id,
            name="Active",
            platform="rakuten",
            shop_code="mock-shop",
            is_active=True,
            auto_sync_enabled=True,
        )
        s_inactive = Shop(
            organization_id=org.id,
            name="Inactive",
            platform="rakuten",
            is_active=False,
            auto_sync_enabled=True,
        )
        s_paused = Shop(
            organization_id=org.id,
            name="Paused",
            platform="rakuten",
            is_active=True,
            auto_sync_enabled=False,
        )
        db.add_all([s_active, s_inactive, s_paused])
        db.commit()
        yield s_active.id, s_inactive.id, s_paused.id
    finally:
        db.close()


async def test_tick_syncs_only_active_and_enabled_shops(org_and_shops):
    active_id, inactive_id, paused_id = org_and_shops

    before = datetime.now(UTC)
    await _tick_once()

    db = TestingSession()
    try:
        active = db.get(Shop, active_id)
        inactive = db.get(Shop, inactive_id)
        paused = db.get(Shop, paused_id)

        # アクティブshopは同期される
        assert active.last_synced_at is not None
        assert active.last_synced_at.replace(tzinfo=UTC) >= before
        assert active.last_sync_count == 2  # mock RMSは2件返す

        # 無効/auto_sync=falseのshopは触られない
        assert inactive.last_synced_at is None
        assert paused.last_synced_at is None
    finally:
        db.close()


async def test_tick_with_no_shops_is_noop():
    # 例外を出さず正常終了する
    await _tick_once()
