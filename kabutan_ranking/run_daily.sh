#!/usr/bin/env bash
# kabutan ランキングを取得し、DB と CSV の変更をコミットする日次実行スクリプト。
#
#   bash run_daily.sh          # 取得して DB/CSV を更新し、変更があればコミット
#   PUSH=1 bash run_daily.sh   # コミットに加えて現在のブランチへ push する
#
# 毎日 7:00 JST に動かす場合は、Claude Code on the web の
# スケジュールトリガーでセッションを起動し、このスクリプトを実行させる。
set -euo pipefail

cd "$(dirname "$0")"

python3 scraper.py

# 蓄積データ(DB と CSV)に変更があればコミット
if ! git diff --quiet -- rankings.db exports/ 2>/dev/null || \
   [ -n "$(git ls-files --others --exclude-standard -- rankings.db exports/)" ]; then
    git add rankings.db exports/
    git commit -m "Update kabutan ranking data ($(TZ=Asia/Tokyo date +%Y-%m-%d))"
    echo "[+] コミットしました。"
    if [ "${PUSH:-0}" = "1" ]; then
        branch="$(git rev-parse --abbrev-ref HEAD)"
        git push -u origin "$branch"
        echo "[+] push しました: $branch"
    fi
else
    echo "[*] 変更はありません(同日に既に取得済みの可能性)。"
fi
