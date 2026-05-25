from app.core.crypto import _PREFIX, decrypt, encrypt


def test_encrypt_decrypt_roundtrip():
    raw = "super-secret-rms-key-12345"
    enc = encrypt(raw)
    assert enc is not None
    assert enc.startswith(_PREFIX)
    assert enc != raw
    assert decrypt(enc) == raw


def test_encrypt_none_and_empty():
    assert encrypt(None) is None
    assert encrypt("") == ""
    assert decrypt(None) is None
    assert decrypt("") == ""


def test_decrypt_passthrough_for_plaintext_legacy():
    # 旧プレーン保存値はそのまま返す（移行期間用）
    assert decrypt("plain-legacy") == "plain-legacy"


def test_double_encrypt_noop():
    enc1 = encrypt("a-secret")
    enc2 = encrypt(enc1)
    assert enc1 == enc2
