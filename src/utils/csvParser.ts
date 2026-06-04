import type { CalibrationRecord } from "@/types";

/**
 * Очищення однієї клітинки калібрувальної таблиці.
 *
 * Алгоритм (узгоджено з `csv/calibration_anomalies.md`):
 *   1. Якщо клітинка порожня — повертаємо `NaN` (немає даних для цього рівня/типу).
 *   2. `Vol_20=2002` → беремо число після `=` (типові артефакти Excel named-range).
 *   3. Видаляємо всі пробільні символи всередині (наприклад, `"70 126"` → `70126`).
 *   4. Замінюємо першу кому на крапку (`"264,7"` → `264.7`, `"13249, 1"` → `13249.1`).
 *   5. Парсимо як `parseFloat`. Якщо результат `NaN` — повертаємо `NaN`.
 */
export function cleanCalibrationCell(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return Number.NaN;
  }

  let normalized = trimmed;

  const volMatch = /^Vol_\d+=(\d+(?:[.,]\d+)?)$/.exec(normalized);
  if (volMatch) {
    normalized = volMatch[1];
  }

  normalized = normalized.replace(/\s+/g, "");

  const firstComma = normalized.indexOf(",");
  if (firstComma >= 0) {
    normalized = normalized.slice(0, firstComma) + "." + normalized.slice(firstComma + 1).replace(/,/g, "");
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : Number.isNaN(value) ? Number.NaN : Number.NaN;
}

/** Розбиває один CSV-рядок з урахуванням подвійних лапок (RFC 4180). */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Парсить вміст `csv/calibration.csv` у плоский масив записів.
 *
 * Очікуваний формат файла: перший стовпець `level`, далі 114 типів вагонів.
 * Перший рядок — заголовок. Підтримує BOM на початку.
 */
export function parseCalibrationCSV(csvText: string): {
  records: CalibrationRecord[];
  tankTypes: string[];
} {
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { records: [], tankTypes: [] };
  }

  const header = splitCsvLine(lines[0]);
  const tankTypes = header.slice(1);

  const records: CalibrationRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length === 0) continue;

    const level = Number.parseInt(cells[0], 10);
    if (!Number.isFinite(level)) continue;

    const volumes: Record<string, number> = {};
    for (let j = 0; j < tankTypes.length; j++) {
      const rawCell = cells[j + 1] ?? "";
      volumes[tankTypes[j]] = cleanCalibrationCell(rawCell);
    }
    records.push({ level, volumes });
  }

  return { records, tankTypes };
}

/** Парсить `csv/tanks.csv` у масив `TankData`. */
export function parseTanksCSV(csvText: string): import("@/types").TankData[] {
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const [number, tankType, volume, model] = splitCsvLine(line);
    return {
      number: number ?? "",
      tankType: tankType ?? "",
      volume: Number.parseFloat(volume ?? "0") || 0,
      model: model ?? "",
    };
  });
}
