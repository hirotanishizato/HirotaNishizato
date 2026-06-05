"""認証とOrganizationスコープのE2Eテスト。"""
from fastapi.testclient import TestClient


def test_unauthenticated_requests_rejected(client: TestClient):
    r = client.get("/api/v1/shops")
    assert r.status_code == 401


def test_signup_and_me(client: TestClient, auth_headers: dict):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "test@example.com"
    assert body["role"] == "owner"


def test_signup_duplicate_email(client: TestClient, auth_token: str):
    r = client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "Other",
            "email": "test@example.com",
            "password": "x",
            "name": "x",
        },
    )
    assert r.status_code == 409


def test_login_success_and_failure(client: TestClient, auth_token: str):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "passw0rd!"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_create_shop_and_list_scoped(client: TestClient, auth_headers: dict):
    r = client.post(
        "/api/v1/shops",
        json={
            "organization_id": 999,  # 偽装してもサーバ側で上書き
            "name": "My Shop",
            "platform": "rakuten",
            "shop_code": "my-shop",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    shop = r.json()
    assert shop["organization_id"] == 1  # ユーザ自身のorgに割り当て直し
    assert shop["has_rms_credentials"] is False

    r = client.get("/api/v1/shops", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_cross_org_isolation(client: TestClient):
    # ユーザA
    rA = client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "OrgA",
            "email": "a@example.com",
            "password": "p",
            "name": "A",
        },
    )
    tokA = rA.json()["access_token"]
    sA = client.post(
        "/api/v1/shops",
        json={"organization_id": 1, "name": "ShopA"},
        headers={"Authorization": f"Bearer {tokA}"},
    )
    shop_a_id = sA.json()["id"]

    # ユーザB
    rB = client.post(
        "/api/v1/auth/signup",
        json={
            "organization_name": "OrgB",
            "email": "b@example.com",
            "password": "p",
            "name": "B",
        },
    )
    tokB = rB.json()["access_token"]

    # BはAの shop を見れない
    r = client.get(f"/api/v1/shops/{shop_a_id}", headers={"Authorization": f"Bearer {tokB}"})
    assert r.status_code == 404

    # BのシェアではAは listに出ない
    r = client.get("/api/v1/shops", headers={"Authorization": f"Bearer {tokB}"})
    assert r.status_code == 200
    assert r.json() == []


def test_rms_credentials_stored_encrypted(client: TestClient, auth_headers: dict):
    """API経由でセットしたRMS資格情報はDBに暗号化されて保存される。"""
    from app.core.crypto import _PREFIX
    from app.models.shop import Shop
    from tests.conftest import TestingSession

    r = client.post(
        "/api/v1/shops",
        json={
            "organization_id": 1,
            "name": "Enc Shop",
            "rms_service_secret": "plaintext-secret",
            "rms_license_key": "plaintext-license",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    shop_id = r.json()["id"]

    db = TestingSession()
    try:
        shop = db.get(Shop, shop_id)
        assert shop.rms_service_secret is not None
        assert shop.rms_service_secret.startswith(_PREFIX)
        assert "plaintext-secret" not in shop.rms_service_secret
        assert shop.rms_license_key.startswith(_PREFIX)
    finally:
        db.close()


def test_full_inquiry_to_draft_flow(client: TestClient, auth_headers: dict):
    # ショップ作成
    s = client.post(
        "/api/v1/shops",
        json={"organization_id": 1, "name": "FlowShop", "shop_code": "mock-shop"},
        headers=auth_headers,
    )
    shop_id = s.json()["id"]

    # 同期 (mockプロバイダで2件入る)
    r = client.post(f"/api/v1/shops/{shop_id}/sync-inquiries", headers=auth_headers)
    assert r.status_code == 202
    assert r.json()["created"] == 2

    # 問い合わせ一覧
    r = client.get("/api/v1/inquiries", headers=auth_headers)
    inqs = r.json()
    assert len(inqs) == 2

    # 下書き生成
    r = client.post(f"/api/v1/inquiries/{inqs[0]['id']}/generate-draft", headers=auth_headers)
    assert r.status_code == 200
    draft = r.json()
    assert draft["status"] == "pending_review"
    assert draft["ai_provider"] in ("mock", "openai", "gemini")
