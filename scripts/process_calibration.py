#!/usr/bin/env python3
"""
Process raw calibration TSV data into:
  1. csv/calibration.csv          - RFC 4180 CSV with UTF-8 BOM, preserves all artifacts 1-to-1
  2. csv/calibration_anomalies.md - markdown report listing anomalies by tank type + level
  3. csv/tanks.csv                - sample tank reference

Run from project root: python3 scripts/process_calibration.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_TSV = PROJECT_ROOT / "scripts" / "calibration_full.tsv"
OUT_CSV = PROJECT_ROOT / "csv" / "calibration.csv"
OUT_MD = PROJECT_ROOT / "csv" / "calibration_anomalies.md"
OUT_TANKS = PROJECT_ROOT / "csv" / "tanks.csv"


VOL_PATTERN = re.compile(r"^Vol_\d+=\d+$")
NUMBER_WITH_SPACE_PATTERN = re.compile(r"^\d[\d\s]*\d$")  # e.g. "70 126"
NUMBER_WITH_COMMA_PATTERN = re.compile(r"^\d+[\d\s]*,\s*\d+$")  # e.g. "264,7", "13249, 1"


def is_number_with_space(value: str) -> bool:
    """Detect cells like '70 126' (digits with at least one inner whitespace and no other chars)."""
    if not value or not re.search(r"\d\s+\d", value):
        return False
    cleaned = value.replace(" ", "").replace("\u00a0", "")
    return cleaned.isdigit()


def is_number_with_comma(value: str) -> bool:
    """Detect cells like '264,7' or '13249, 1' (digits + comma as decimal separator)."""
    if "," not in value:
        return False
    cleaned = re.sub(r"[,\s]", "", value)
    return cleaned.isdigit() and not value.endswith(",")


def is_pure_number(value: str) -> bool:
    """Detect a value that is a normal positive integer (no anomalies)."""
    return value.isdigit()


def classify_anomaly(value: str) -> str | None:
    """Return anomaly category for a non-empty cell, or None if value is clean."""
    if not value:
        return None
    if is_pure_number(value):
        return None
    if VOL_PATTERN.match(value):
        return "vol_x"
    if is_number_with_space(value):
        return "spaces"
    if is_number_with_comma(value):
        return "commas"
    return "other"


def main() -> None:
    if not RAW_TSV.exists():
        raise FileNotFoundError(f"Input TSV not found: {RAW_TSV}")

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    with RAW_TSV.open("r", encoding="utf-8", newline="") as fh:
        lines = fh.read().splitlines()

    header_cells = lines[0].split("\t")
    expected_cols = len(header_cells)
    # First header cell is "См" (cyrillic for "level"); replace with English "level".
    header_out = ["level"] + header_cells[1:]
    tank_types = header_cells[1:]

    anomalies: dict[str, list[tuple[str, str, str]]] = {
        "vol_x": [],
        "spaces": [],
        "commas": [],
        "other": [],
    }

    data_rows: list[list[str]] = []
    for raw_line in lines[1:]:
        cells = raw_line.split("\t")
        if len(cells) < expected_cols:
            cells = cells + [""] * (expected_cols - len(cells))
        elif len(cells) > expected_cols:
            cells = cells[:expected_cols]

        level_str = cells[0]
        for col_idx, value in enumerate(cells[1:]):
            tank = tank_types[col_idx]
            category = classify_anomaly(value)
            if category:
                anomalies[category].append((tank, level_str, value))

        data_rows.append(cells)

    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        writer.writerow(header_out)
        for row in data_rows:
            writer.writerow(row)

    total_anomalies = sum(len(v) for v in anomalies.values())

    md_lines: list[str] = []
    md_lines.append("# Аномалії в калібрувальній таблиці\n")
    md_lines.append(
        "Цей документ автоматично сформовано скриптом "
        "[`scripts/process_calibration.py`](../scripts/process_calibration.py) "
        "на основі сирих даних із `scripts/calibration_full.tsv`.\n"
    )
    md_lines.append(
        f"У вхідних даних знайдено **{total_anomalies}** клітинок із нестандартним форматом. "
        "У CSV ([`csv/calibration.csv`](calibration.csv)) ці значення збережено 1-в-1; "
        "очищення відбувається в TypeScript-парсері (`src/utils/csvParser.ts`).\n"
    )
    md_lines.append("## Зведення\n")
    md_lines.append(f"- `Vol_X=Y` (Excel named-range references): **{len(anomalies['vol_x'])}** клітинок")
    md_lines.append(f"- Числа з пробілами всередині: **{len(anomalies['spaces'])}** клітинок")
    md_lines.append(f"- Кома як десятковий розділювач: **{len(anomalies['commas'])}** клітинок")
    md_lines.append(f"- Інше нестандартне: **{len(anomalies['other'])}** клітинок\n")

    def emit_section(title: str, items: list[tuple[str, str, str]], explanation: str) -> None:
        md_lines.append(f"## {title}")
        md_lines.append(explanation)
        if not items:
            md_lines.append("\n_Не знайдено._\n")
            return
        by_tank: dict[str, list[tuple[str, str]]] = {}
        for tank, level, value in items:
            by_tank.setdefault(tank, []).append((level, value))
        md_lines.append("")
        for tank in sorted(by_tank.keys(), key=lambda t: (len(t), t)):
            entries = by_tank[tank]
            levels_str = ", ".join(
                f"рівень {lvl} = `{val}`" for lvl, val in entries
            )
            md_lines.append(f"- **Тип вагона `{tank}`** ({len(entries)} клітинок): {levels_str}")
        md_lines.append("")

    emit_section(
        "1. Записи виду `Vol_X=Y` (Excel named-range references)",
        anomalies["vol_x"],
        "Це посилання на іменовані клітинки в оригінальному Excel-файлі. "
        "Парсер вибирає число `Y` після знака `=`.",
    )
    emit_section(
        "2. Числа з пробілами всередині",
        anomalies["spaces"],
        "Імовірно, артефакти ручного введення в Excel "
        "(коли користувач натискав пробіл як тисячний розділювач). "
        "Парсер видаляє всі пробіли всередині числа.",
    )
    emit_section(
        "3. Кома як десятковий розділювач",
        anomalies["commas"],
        "У вхідних даних трапляються числа з комою (наприклад, `264,7` або `13249, 1`). "
        "Парсер замінює кому на крапку.",
    )
    emit_section(
        "4. Інше нестандартне",
        anomalies["other"],
        "Значення, що не вписуються в попередні три категорії. "
        "Потребують ручного огляду.",
    )

    OUT_MD.write_text("\n".join(md_lines), encoding="utf-8")

    if not OUT_TANKS.exists():
        sample_tanks = [
            ("number", "tankType", "volume", "model"),
            ("53305405", "66", "62.145", "15-1407"),
            ("74747742", "62", "52.961", "15_1407"),
            ("51629152", "66", "62.423", "15_903R"),
            ("51629319", "66", "62.386", "15_1602"),
            ("57438821", "73", "73.624", "15_1722"),
            ("57438953", "73", "73.624", "15_1722"),
            ("50324507", "1200G", "120.000", "15_5103"),
            ("50324614", "1407G", "140.071", "15_1407G"),
        ]
        with OUT_TANKS.open("w", encoding="utf-8-sig", newline="") as fh:
            writer = csv.writer(fh, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
            for row in sample_tanks:
                writer.writerow(row)

    print(
        f"OK: wrote {OUT_CSV.name} ({len(data_rows)} rows), "
        f"{OUT_MD.name} ({total_anomalies} anomalies), "
        f"and {OUT_TANKS.name}."
    )


if __name__ == "__main__":
    main()
