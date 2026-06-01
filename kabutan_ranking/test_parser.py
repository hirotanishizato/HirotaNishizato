#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ネットワーク不要のパーサ単体テスト。`python3 test_parser.py` で実行。

kabutan の想定構造に近い合成HTMLで extract_rankings() を検証する。
実際のHTML構造に差異があれば、許可リスト追加後に .cache/last_page.html を見て
scraper.extract_rankings() を調整すること。
"""

from scraper import extract_rankings, store, export_all_csv
import os
import sqlite3
import tempfile

SAMPLE_HTML = """
<html><body>
<table class="stock_table">
  <tr><th>順位</th><th>テーマ</th><th>代表的な銘柄</th></tr>
  <tr><td>1</td>
      <td><a href="/themes/?theme=AI%E9%96%A2%E9%80%A3">AI関連</a></td>
      <td><a href="/stock/?code=6920">レーザーテック</a></td></tr>
  <tr><td>2</td>
      <td><a href="/themes/?theme=%E5%8D%8A%E5%B0%8E%E4%BD%93">半導体</a></td>
      <td><a href="/stock/?code=8035">東京エレクトロン</a></td></tr>
  <tr><td>3</td>
      <td><a href="/themes/?theme=%E9%98%B2%E8%A1%9B">防衛関連</a></td>
      <td><a href="/stock/?code=7011">三菱重工業</a></td></tr>
</table>
<!-- 無関係な別テーブル(銘柄ランキング等) -->
<table class="other">
  <tr><td>1</td><td><a href="/stock/?code=9984">ソフトバンクG</a></td></tr>
</table>
</body></html>
"""


def test_extract():
    rows = extract_rankings(SAMPLE_HTML)
    assert len(rows) == 3, f"期待3件, 実際{len(rows)}件: {rows}"
    assert rows[0]["rank"] == 1
    assert rows[0]["genre"] == "AI関連"
    assert rows[0]["stock_name"] == "レーザーテック"
    assert rows[0]["stock_code"] == "6920"
    assert rows[1]["genre"] == "半導体"
    assert rows[2]["stock_code"] == "7011"
    print("[OK] extract_rankings: 3件を正しく抽出")


def test_store_and_csv():
    with tempfile.TemporaryDirectory() as d:
        db = os.path.join(d, "t.db")
        csv_out = os.path.join(d, "out.csv")
        rows = extract_rankings(SAMPLE_HTML)
        store("2026-06-01", rows, "2026-06-01 07:00:00+0900", db_path=db)
        # 同日再実行しても重複しない
        store("2026-06-01", rows, "2026-06-01 07:05:00+0900", db_path=db)
        conn = sqlite3.connect(db)
        n = conn.execute("SELECT COUNT(*) FROM rankings").fetchone()[0]
        conn.close()
        assert n == 3, f"重複排除に失敗: {n}行"
        path, total = export_all_csv(db_path=db, out_path=csv_out)
        assert total == 3 and os.path.exists(path)
        print("[OK] store/CSV: 冪等保存とCSV出力を確認")


if __name__ == "__main__":
    test_extract()
    test_store_and_csv()
    print("\nすべてのテストに合格しました。")
