"""監査ログとAI利用量計測のテスト。"""
from fastapi.testclient import TestClient

from app.models.ai_usage import AIUsage
from app.models.audit_log import AuditLog
from tests.conftest import TestingSession


def _action_count(action: str) -> int:
    db = TestingSession()
    try:
        return db.query(AuditLog).filter(AuditLog.action == action).count()
    finally:
        db.close()


def test_signup_writes_audit_log(client: TestClient):
    client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "AuditOrg",
            "email": "audit@example.com",
            "password": "p",
            "name": "A",
        },
    )
    assert _action_count("auth.signup") == 1


def test_login_failure_writes_audit_log(client: TestClient, auth_token: str):  # noqa: ARG001
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrong"},
    )
    assert r.status_code == 401

    db = TestingSession()
    try:
        rec = (
            db.query(AuditLog)
            .filter(AuditLog.action == "auth.login", AuditLog.success.is_(False))
            .first()
        )
        assert rec is not None
        assert rec.meta == {"email": "test@example.com"}
    finally:
        db.close()


def test_draft_generate_creates_ai_usage_record(client: TestClient, auth_headers: dict):
    s = client.post(
        "/api/v1/shops",
        json={"organization_id": 1, "name": "UsageShop", "shop_code": "mock-shop"},
        headers=auth_headers,
    )
    shop_id = s.json()["id"]
    client.post(f"/api/v1/shops/{shop_id}/sync-inquiries", headers=auth_headers)
    inq_id = client.get("/api/v1/inquiries", headers=auth_headers).json()[0]["id"]

    r = client.post(f"/api/v1/inquiries/{inq_id}/generate-draft", headers=auth_headers)
    assert r.status_code == 200

    db = TestingSession()
    try:
        usages = db.query(AIUsage).all()
        assert len(usages) == 1
        assert usages[0].organization_id == 1
        assert usages[0].provider in ("mock", "openai", "gemini")
    finally:
        db.close()

    # 監査ログにも残る
    assert _action_count("draft.generate") == 1


def test_ai_summary_endpoint(client: TestClient, auth_headers: dict):
    s = client.post(
        "/api/v1/shops",
        json={"organization_id": 1, "name": "SummaryShop", "shop_code": "mock-shop"},
        headers=auth_headers,
    )
    shop_id = s.json()["id"]
    client.post(f"/api/v1/shops/{shop_id}/sync-inquiries", headers=auth_headers)
    inqs = client.get("/api/v1/inquiries", headers=auth_headers).json()
    for inq in inqs:
        client.post(f"/api/v1/inquiries/{inq['id']}/generate-draft", headers=auth_headers)

    r = client.get("/api/v1/usage/ai-summary", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["organization_id"] == 1
    assert body["total_requests"] == len(inqs)
    assert "mock" in body["by_provider"] or "openai" in body["by_provider"]


def test_audit_log_listing_scoped(client: TestClient, auth_headers: dict):
    # 他org のログがリストに混入しないこと
    client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "Other",
            "email": "other@example.com",
            "password": "p",
            "name": "O",
        },
    )
    r = client.get("/api/v1/usage/audit-logs", headers=auth_headers)
    assert r.status_code == 200
    logs = r.json()
    # 取得できるのは自分のorg(=1)のものだけ
    for log in logs:
        # auth.signup 等で organization_id を user 取得前にnullで書く分は除外される
        # （ここではorg=1のsignupのみが残る）
        assert log["user_id"] is None or log["user_id"] == 1


def test_shop_credential_update_audited(client: TestClient, auth_headers: dict):
    s = client.post(
        "/api/v1/shops",
        json={"organization_id": 1, "name": "CredShop"},
        headers=auth_headers,
    )
    shop_id = s.json()["id"]

    client.patch(
        f"/api/v1/shops/{shop_id}",
        json={"rms_service_secret": "newsecret", "rms_license_key": "newlicense"},
        headers=auth_headers,
    )
    assert _action_count("shop.update_credentials") == 1


def test_rate_limit_disabled_in_tests(client: TestClient):
    # 大量の signup が429にならないこと（fixture用に必須）
    for i in range(15):
        r = client.post(
            "/api/v1/auth/signup",
            json={
                "organization_name": f"Org{i}",
                "email": f"u{i}@example.com",
                "password": "p",
                "name": f"U{i}",
            },
        )
        assert r.status_code == 201, f"signup #{i} returned {r.status_code}"
