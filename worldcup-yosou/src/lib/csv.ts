// 試合の一括登録用 CSV パーサ
//
// 想定フォーマット（1行目はヘッダー、無くても可）:
//   title,category,description,kickoffAt,options
//   日本 vs カメルーン,グループD,予選第1戦,2026-06-15 19:00,日本勝利|引き分け|カメルーン勝利
//
//  ・kickoffAt は "YYYY-MM-DD HH:mm"（日本時間 JST として解釈）または ISO8601
//  ・options は区切り文字 "|" で複数指定（＝投票選択肢）
//  ・kickoffAt が投票締め切り時刻になります

export interface ParsedMatchRow {
  title: string;
  category: string;
  description: string;
  kickoffAt: Date;
  options: string[];
}

export interface CsvParseResult {
  rows: ParsedMatchRow[];
  errors: string[];
}

const HEADER_KEYS = ["title", "category", "description", "kickoffat", "options"];

/** 1行をフィールド配列に分割（ダブルクオート対応の簡易CSV） */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** "YYYY-MM-DD HH:mm"(JST) もしくは ISO8601 を Date に変換 */
export function parseKickoff(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  // タイムゾーン指定（Z もしくは +09:00 等）が明示されている ISO8601 はそのまま解釈
  const iso = new Date(value);
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
  if (value.includes("T") && hasTz && !Number.isNaN(iso.getTime())) {
    return iso;
  }

  // "YYYY-MM-DD HH:mm" / "YYYY/MM/DD HH:mm" を JST(+09:00) として解釈
  const m = value.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    const isoJst = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi}:${(s ?? "00").padStart(2, "0")}+09:00`;
    const parsed = new Date(isoJst);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  // 日付のみ → 00:00 JST
  const dOnly = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (dOnly) {
    const [, y, mo, d] = dOnly;
    const parsed = new Date(
      `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00+09:00`,
    );
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return Number.isNaN(iso.getTime()) ? null : iso;
}

export function parseMatchesCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const rows: ParsedMatchRow[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows, errors: ["CSVが空です。"] };
  }

  // ヘッダー行判定
  let startIndex = 0;
  const firstCells = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) => HEADER_KEYS.includes(c));
  if (looksLikeHeader) startIndex = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = splitCsvLine(lines[i]);
    const [title, category, description, kickoffRaw, optionsRaw] = [
      cells[0] ?? "",
      cells[1] ?? "",
      cells[2] ?? "",
      cells[3] ?? "",
      cells[4] ?? "",
    ];

    if (!title) {
      errors.push(`${lineNo}行目: タイトルが空です。`);
      continue;
    }
    const kickoffAt = parseKickoff(kickoffRaw);
    if (!kickoffAt) {
      errors.push(
        `${lineNo}行目「${title}」: 開始/締切時刻が不正です（"${kickoffRaw}"）。`,
      );
      continue;
    }
    const options = optionsRaw
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (options.length < 2) {
      errors.push(
        `${lineNo}行目「${title}」: 選択肢は「|」区切りで2つ以上必要です。`,
      );
      continue;
    }

    rows.push({
      title,
      category,
      description,
      kickoffAt,
      options,
    });
  }

  return { rows, errors };
}
