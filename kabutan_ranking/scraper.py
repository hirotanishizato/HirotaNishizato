#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kabutan テーマ別アクセスランキング スクレイパー

https://kabutan.jp/info/accessranking/3_2 を取得し、
1位〜30位の「順位 / ジャンル(テーマ名) / 代表銘柄」を抽出して
SQLite データベース (rankings.db) に日付ごとに蓄積する。

特徴:
  - 追加ライブラリ不要 (Python 標準ライブラリ + requests のみ)。
    requests が無い場合は標準ライブラリ urllib にフォールバックする。
  - 同じ日に複数回実行しても (date, rank) で上書きされるので重複しない。
  - 実行のたびに exports/kabutan_ranking_all.csv (全期間スナップショット) も再生成する。

使い方:
    python3 scraper.py            # 今日(JST)の分として取得・蓄積
    python3 scraper.py --dry-run  # DB に書き込まず、解析結果だけ表示
"""

import argparse
import csv
import datetime
import os
import re
import sqlite3
import sys
from html.parser import HTMLParser

URL = "https://kabutan.jp/info/accessranking/3_2"
TOP_N = 30
JST = datetime.timezone(datetime.timedelta(hours=9))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "rankings.db")
CACHE_DIR = os.path.join(BASE_DIR, ".cache")
EXPORT_DIR = os.path.join(BASE_DIR, "exports")
ALL_CSV_PATH = os.path.join(EXPORT_DIR, "kabutan_ranking_all.csv")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


# --------------------------------------------------------------------------
# 取得
# --------------------------------------------------------------------------
def fetch(url=URL):
    """ページHTMLを取得して文字列で返す。requests 優先、無ければ urllib。"""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        import requests  # type: ignore

        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        if not resp.encoding or resp.encoding.lower() == "iso-8859-1":
            resp.encoding = resp.apparent_encoding or "utf-8"
        return resp.text
    except ImportError:
        import urllib.request

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
        charset = r.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace")


# --------------------------------------------------------------------------
# 解析
# --------------------------------------------------------------------------
class _TableParser(HTMLParser):
    """全ての <tr> を「セルのリスト」に分解する軽量パーサ。

    各セルは {"text": "...", "anchors": [(href, text), ...]} の dict。
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self._row = None
        self._cell = None
        self._in_cell = False
        self._in_a = False
        self._href = ""
        self._a_text = []

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = {"parts": [], "anchors": []}
            self._in_cell = True
        elif tag == "a" and self._in_cell:
            self._in_a = True
            self._href = dict(attrs).get("href", "") or ""
            self._a_text = []

    def handle_data(self, data):
        if self._in_a:
            self._a_text.append(data)
        elif self._in_cell and self._cell is not None:
            self._cell["parts"].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._in_a:
            text = "".join(self._a_text).strip()
            if self._cell is not None:
                self._cell["anchors"].append((self._href, text))
                if text:
                    self._cell["parts"].append(text)
            self._in_a = False
            self._href = ""
            self._a_text = []
        elif tag in ("td", "th") and self._in_cell:
            text = " ".join(p.strip() for p in self._cell["parts"] if p.strip())
            self._cell["text"] = re.sub(r"\s+", " ", text).strip()
            if self._row is not None:
                self._row.append(self._cell)
            self._in_cell = False
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None


def extract_rankings(html):
    """HTML からランキング行 (rank, genre, stock_code, stock_name, raw) を抽出。

    各行から、テーマ(ジャンル)へのリンクと銘柄へのリンクを見つけて対応付ける。
    kabutan のテーマページは /themes/ 、銘柄ページは /stock/?code=NNNN を含む。
    """
    parser = _TableParser()
    parser.feed(html)

    results = []
    for row in parser.rows:
        genre = None
        stock_code = ""
        stock_name = ""
        for cell in row:
            for href, text in cell["anchors"]:
                if not text:
                    continue
                if ("/stock/" in href or "code=" in href) and re.search(r"code=\d", href):
                    if not stock_name:
                        m = re.search(r"code=(\d+)", href)
                        stock_code = m.group(1) if m else ""
                        stock_name = text
                elif "/themes/" in href or "theme=" in href:
                    if genre is None:
                        genre = text
        # テーマ(ジャンル)と銘柄の両方が取れた行だけをランキング行とみなす
        if not genre or not stock_name:
            continue

        rank = None
        for cell in row:
            t = cell["text"].strip()
            if re.fullmatch(r"\d{1,3}", t):
                rank = int(t)
                break

        raw = " | ".join(c["text"] for c in row if c["text"])
        results.append(
            {
                "rank": rank,
                "genre": genre,
                "stock_code": stock_code,
                "stock_name": stock_name,
                "raw": raw,
            }
        )

    # 重複ジャンル(同じテーマが別表に出る等)を除去しつつ出現順を維持
    seen = set()
    deduped = []
    for r in results:
        key = (r["genre"], r["stock_name"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)
    results = deduped[:TOP_N]

    # 順位セルが信頼できない場合は出現順で 1..N を振り直す
    ranks = [r["rank"] for r in results]
    if not (all(isinstance(x, int) for x in ranks) and len(set(ranks)) == len(ranks)):
        for i, r in enumerate(results, 1):
            r["rank"] = i

    return results


# --------------------------------------------------------------------------
# 保存
# --------------------------------------------------------------------------
def store(date_str, rows, fetched_at, db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rankings (
                date        TEXT    NOT NULL,
                rank        INTEGER NOT NULL,
                genre       TEXT,
                stock_code  TEXT,
                stock_name  TEXT,
                raw         TEXT,
                fetched_at  TEXT,
                PRIMARY KEY (date, rank)
            )
            """
        )
        for r in rows:
            conn.execute(
                """
                INSERT INTO rankings (date, rank, genre, stock_code, stock_name, raw, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, rank) DO UPDATE SET
                    genre      = excluded.genre,
                    stock_code = excluded.stock_code,
                    stock_name = excluded.stock_name,
                    raw        = excluded.raw,
                    fetched_at = excluded.fetched_at
                """,
                (
                    date_str,
                    r["rank"],
                    r["genre"],
                    r["stock_code"],
                    r["stock_name"],
                    r["raw"],
                    fetched_at,
                ),
            )
        conn.commit()
    finally:
        conn.close()


def export_all_csv(db_path=DB_PATH, out_path=ALL_CSV_PATH):
    """DB 全件を CSV に書き出す(全期間スナップショット)。"""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute(
            "SELECT date, rank, genre, stock_code, stock_name, fetched_at "
            "FROM rankings ORDER BY date, rank"
        )
        rows = cur.fetchall()
    finally:
        conn.close()
    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "rank", "genre", "stock_code", "stock_name", "fetched_at"])
        w.writerows(rows)
    return out_path, len(rows)


# --------------------------------------------------------------------------
# メイン
# --------------------------------------------------------------------------
def main(argv=None):
    ap = argparse.ArgumentParser(description="kabutan テーマ別アクセスランキング収集")
    ap.add_argument("--dry-run", action="store_true", help="DB に書き込まず解析結果のみ表示")
    ap.add_argument("--date", help="記録日を YYYY-MM-DD で上書き(既定: 今日 JST)")
    ap.add_argument("--min-rows", type=int, default=10, help="この件数未満なら失敗扱い(既定:10)")
    args = ap.parse_args(argv)

    now = datetime.datetime.now(JST)
    date_str = args.date or now.strftime("%Y-%m-%d")
    fetched_at = now.strftime("%Y-%m-%d %H:%M:%S%z")

    print(f"[*] 取得中: {URL}")
    try:
        html = fetch()
    except Exception as e:  # noqa: BLE001
        print(f"[!] 取得失敗: {e}", file=sys.stderr)
        print("    → kabutan.jp が環境のネットワーク許可リストに入っているか確認してください。",
              file=sys.stderr)
        return 2

    # 後で解析を見直せるよう生HTMLを保存(.cache は .gitignore 対象)
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_file = os.path.join(CACHE_DIR, "last_page.html")
    with open(cache_file, "w", encoding="utf-8") as f:
        f.write(html)

    rows = extract_rankings(html)
    print(f"[*] 抽出件数: {len(rows)} 件")

    print("\n  順位  ジャンル(テーマ)                     代表銘柄")
    print("  " + "-" * 70)
    for r in rows:
        code = f"({r['stock_code']})" if r["stock_code"] else ""
        print(f"  {str(r['rank']).rjust(3)}  {r['genre'][:28].ljust(28)}  {r['stock_name']}{code}")
    print()

    if len(rows) < args.min_rows:
        print(
            f"[!] 抽出件数が想定より少ない({len(rows)} < {args.min_rows})。"
            f"HTML 構造が変わった可能性。生HTML: {cache_file}",
            file=sys.stderr,
        )
        return 3

    if args.dry_run:
        print("[*] --dry-run のため DB へは書き込みません。")
        return 0

    store(date_str, rows, fetched_at)
    out_path, total = export_all_csv()
    print(f"[+] DB へ保存: {DB_PATH}  ({date_str} / {len(rows)} 件)")
    print(f"[+] CSV 出力: {out_path}  (累計 {total} 行)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
