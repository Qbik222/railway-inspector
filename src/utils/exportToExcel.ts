import * as XLSX from "xlsx";
import type { ReportBatch, ReportRow } from "@/types";

const HEADER = [
  "№",
  "Номер вагона",
  "Тип",
  "Висота, см",
  "t, °C",
  "ρ_t",
  "γ",
  "ρ_15",
  "Об'єм, л",
  "Маса, т",
  "± похибка, т",
  "Маса з накладної, т",
  "Δ, т",
  "Відхилення, %",
];

function rowToArray(row: ReportRow, index: number): (string | number)[] {
  return [
    index + 1,
    row.wagonNumber,
    row.tankType,
    safeNumber(row.level),
    safeNumber(row.temperature),
    safeNumber(row.densityAtT),
    safeNumber(row.expansionCoefficient),
    safeNumber(row.result.densityAt15),
    safeNumber(row.result.volumeLiters),
    safeNumber(row.result.massT),
    safeNumber(row.result.errorT),
    safeNumber(row.invoiceMass),
    safeNumber(row.result.differenceT),
    safeNumber(row.result.deviationPercent),
  ];
}

function safeNumber(value: number | undefined | null): number | string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  return value;
}

function buildSheet(batch: ReportBatch) {
  const meta = [
    ["Дата", new Date(batch.date).toLocaleDateString("uk-UA")],
    ["Продукт", batch.product],
    ["Постачальник", batch.supplier],
    ["Отримувач", batch.receiver],
    ["Накладна №", batch.invoiceNumber],
    [],
  ];
  const data: (string | number)[][] = [
    ...meta,
    HEADER,
    ...batch.rows.map(rowToArray),
  ];

  const totals = batch.rows.reduce(
    (acc, row) => {
      if (Number.isFinite(row.result.volumeLiters)) acc.volumeLiters += row.result.volumeLiters;
      if (Number.isFinite(row.result.massT)) acc.massT += row.result.massT;
      if (Number.isFinite(row.result.errorT)) acc.errorT += row.result.errorT;
      if (row.invoiceMass !== undefined && Number.isFinite(row.invoiceMass))
        acc.invoiceMass += row.invoiceMass;
      return acc;
    },
    { volumeLiters: 0, massT: 0, errorT: 0, invoiceMass: 0 },
  );
  data.push([
    "",
    "Разом",
    "",
    "",
    "",
    "",
    "",
    "",
    totals.volumeLiters,
    totals.massT,
    totals.errorT,
    totals.invoiceMass || "",
    totals.invoiceMass ? totals.massT - totals.invoiceMass : "",
    totals.invoiceMass ? ((totals.massT - totals.invoiceMass) / totals.invoiceMass) * 100 : "",
  ]);

  return XLSX.utils.aoa_to_sheet(data);
}

/** Експортує одну партію в Excel-файл і ініціює download. */
export function exportToExcel(batch: ReportBatch, filename?: string): void {
  const wb = XLSX.utils.book_new();
  const sheet = buildSheet(batch);
  XLSX.utils.book_append_sheet(wb, sheet, "Звіт");
  const name = filename ?? `Звіт_${new Date(batch.date).toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}

/** Експортує кілька партій (історію) одним файлом з кількома аркушами. */
export function exportMultipleSheets(batches: ReportBatch[], filename = "Історія_розрахунків.xlsx"): void {
  const wb = XLSX.utils.book_new();
  batches.forEach((batch, idx) => {
    const sheet = buildSheet(batch);
    const sheetName = `${new Date(batch.date).toISOString().slice(0, 10)}_${idx + 1}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  });
  XLSX.writeFile(wb, filename);
}
