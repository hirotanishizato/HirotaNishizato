# kabutan テーマ別アクセスランキング 収集ツール

[kabutan のテーマ別アクセスランキング](https://kabutan.jp/info/accessranking/3_2)
を毎日取得し、**1位〜30位の「順位 / ジャンル(テーマ名) / 代表銘柄」** を
SQLite データベースに日付ごとに蓄積します。CSV にはいつでも出力できます。

## 構成

| ファイル | 役割 |
| --- | --- |
| `scraper.py` | ページを取得・解析して `rankings.db` に当日分を蓄積。実行のたびに全期間CSVも再生成 |
| `export_csv.py` | 蓄積した DB を CSV に出力(全期間 / 指定日 / 最新日) |
| `run_daily.sh` | 取得 → DB/CSV 更新 → コミット(任意で push)を一括実行する日次用スクリプト |
| `rankings.db` | 蓄積先の SQLite データベース(リポジトリにコミットして永続化) |
| `exports/` | CSV 出力先。`kabutan_ranking_all.csv` が全期間スナップショット |
| `test_parser.py` | ネットワーク不要のパーサ単体テスト |

依存は **Python 標準ライブラリ + `requests`** のみ(`requests` が無ければ `urllib` に自動フォールバック)。追加インストール不要です。

## ⚠️ 事前に必要な設定(あなたの作業)

この収集ツールは外部サイト `kabutan.jp` へアクセスします。Claude Code on the web の
実行環境は既定でアクセス先を**許可リスト方式**で制限しているため、次の2点の設定が必要です。

1. **ネットワーク許可リストに `kabutan.jp` を追加する。**
   環境のネットワークポリシーで `kabutan.jp` への送信を許可してください。
   （未設定だと `403 Host not in allowlist` で取得に失敗します。）
   設定方法: https://code.claude.com/docs/en/claude-code-on-the-web

2. **毎日 7:00 JST に起動するスケジュールトリガーを作成する。**
   実行環境は使い捨て(セッション終了で破棄)なので、コンテナ内に常駐させる
   cron では「毎日」を実現できません。代わりに毎日 7:00 JST にセッションを起動する
   トリガーを設定し、その中で `bash kabutan_ranking/run_daily.sh` を実行させます。
   （7:00 JST = 22:00 UTC 前日）

> 上記が未設定でも手動実行は可能です。許可リスト追加後に「スクレイパーを実行して」と
> 指示すれば、その場で取得・コミットできます。

## 使い方

```bash
# 当日分(JST)を取得して DB に蓄積し、全期間CSVを再生成
python3 kabutan_ranking/scraper.py

# DB に書き込まず、解析結果だけ確認(構造チェック用)
python3 kabutan_ranking/scraper.py --dry-run

# CSV 出力(いつでも)
python3 kabutan_ranking/export_csv.py            # 全期間 → exports/kabutan_ranking_all.csv
python3 kabutan_ranking/export_csv.py --latest   # 最新日のみ
python3 kabutan_ranking/export_csv.py --date 2026-06-01
python3 kabutan_ranking/export_csv.py --list     # 蓄積済みの日付一覧

# 日次一括(取得 → コミット、PUSH=1 で push も)
bash kabutan_ranking/run_daily.sh
PUSH=1 bash kabutan_ranking/run_daily.sh
```

## データ構造(`rankings` テーブル)

| 列 | 内容 |
| --- | --- |
| `date` | 取得日 (JST, `YYYY-MM-DD`) |
| `rank` | 順位 (1〜30) |
| `genre` | ジャンル(テーマ名) |
| `stock_code` | 代表銘柄の証券コード |
| `stock_name` | 代表銘柄名 |
| `raw` | 解析元の行テキスト(保険) |
| `fetched_at` | 取得時刻 |

主キーは `(date, rank)`。同じ日に複数回実行しても上書きされ、重複しません。

## 解析がうまくいかないとき

kabutan 側の HTML 構造が変わると抽出件数が減ることがあります。その場合 scraper は
警告を出して終了し、取得した生HTMLを `.cache/last_page.html`(Git管理外)に保存します。
これを見て `scraper.py` の `extract_rankings()`(テーマリンク `/themes/`・
銘柄リンク `/stock/?code=` の判定部分)を調整してください。
