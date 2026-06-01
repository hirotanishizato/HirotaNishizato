#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蓄積した kabutan ランキング DB を CSV に出力する(いつでも実行可)。

使い方:
    python3 export_csv.py                       # 全期間を exports/ に出力
    python3 export_csv.py --date 2026-06-01     # 指定日のみ
    python3 export_csv.py --latest              # 最新日のみ
    python3 export_csv.py --out /path/to.csv    # 出力先を指定
    python3 export_csv.py --list                # DB にある日付一覧を表示
"""

import argparse
import csv
import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "rankings.db")
EXPORT_DIR = os.path.join(BASE_DIR, "exports")

COLUMNS = ["date", "rank", "genre", "stock_code", "stock_name", "fetched_at"]


def connect(db_path):
    if not os.path.exists(db_path):
        print(f"[!] DB が見つかりません: {db_path}\n    先に scraper.py を実行してください。",
              file=sys.stderr)
        raise SystemExit(2)
    return sqlite3.connect(db_path)


def list_dates(db_path=DB_PATH):
    conn = connect(db_path)
    try:
        cur = conn.execute("SELECT date, COUNT(*) FROM rankings GROUP BY date ORDER BY date")
        return cur.fetchall()
    finally:
        conn.close()


def export(db_path=DB_PATH, date=None, latest=False, out_path=None):
    conn = connect(db_path)
    try:
        if latest:
            row = conn.execute("SELECT MAX(date) FROM rankings").fetchone()
            date = row[0] if row else None
            if not date:
                print("[!] DB が空です。", file=sys.stderr)
                raise SystemExit(2)
        if date:
            cur = conn.execute(
                f"SELECT {', '.join(COLUMNS)} FROM rankings WHERE date = ? ORDER BY rank",
                (date,),
            )
        else:
            cur = conn.execute(
                f"SELECT {', '.join(COLUMNS)} FROM rankings ORDER BY date, rank"
            )
        rows = cur.fetchall()
    finally:
        conn.close()

    if out_path is None:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        name = f"kabutan_ranking_{date}.csv" if date else "kabutan_ranking_all.csv"
        out_path = os.path.join(EXPORT_DIR, name)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)

    # Excel で文字化けしないよう BOM 付き UTF-8
    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(COLUMNS)
        w.writerows(rows)

    return out_path, len(rows)


def main(argv=None):
    ap = argparse.ArgumentParser(description="kabutan ランキング DB を CSV 出力")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--date", help="指定日のみ出力 (YYYY-MM-DD)")
    g.add_argument("--latest", action="store_true", help="最新日のみ出力")
    ap.add_argument("--out", help="出力先パス")
    ap.add_argument("--list", action="store_true", help="DB 内の日付一覧を表示して終了")
    args = ap.parse_args(argv)

    if args.list:
        for date, n in list_dates():
            print(f"  {date}  ({n} 件)")
        return 0

    out_path, n = export(date=args.date, latest=args.latest, out_path=args.out)
    print(f"[+] CSV 出力: {out_path}  ({n} 行)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
