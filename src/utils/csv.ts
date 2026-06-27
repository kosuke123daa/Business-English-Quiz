import type { Phrase } from "@/types";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
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
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/**
 * CSVは「連番,英語フレーズ,日本語フレーズ」の3列構成を想定。
 * 1行目がヘッダー（連番が数値でない）なら読み飛ばす。
 */
export function parsePhraseCsv(text: string): Phrase[] {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const rows = lines.map(splitCsvLine);
  const firstCellIsHeader = Number.isNaN(Number(rows[0][0]));
  const dataRows = firstCellIsHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((row) => row.length >= 3 && row[1].trim() !== "" && row[2].trim() !== "")
    .map((row, i) => {
      const parsedId = Number(row[0]);
      return {
        id: Number.isFinite(parsedId) && parsedId > 0 ? parsedId : i + 1,
        en: row[1].trim(),
        ja: row[2].trim(),
      };
    });
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** フレーズ集を「連番,英語フレーズ,日本語フレーズ」のCSV文字列に変換する */
export function phrasesToCsv(phrases: Phrase[]): string {
  const header = "連番,英語フレーズ,日本語フレーズ";
  const rows = phrases.map((p) => [String(p.id), escapeCsvCell(p.en), escapeCsvCell(p.ja)].join(","));
  return [header, ...rows].join("\n");
}
