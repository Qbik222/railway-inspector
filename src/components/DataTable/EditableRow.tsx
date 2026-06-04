import { useCallback } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { deleteRow, updateRow } from "@/store/slices/calculationSlice";
import { useCalculation } from "@/hooks/useCalculation";
import { TankTypeSelect } from "@/components/common/TankTypeSelect";
import { EditableCell } from "@/components/DataTable/EditableCell";
import { formatNumber } from "@/utils/format";
import type { ReportRow } from "@/types";
import styles from "./DataTable.module.css";

interface EditableRowProps {
  row: ReportRow;
  index: number;
}

export function EditableRowComponent({ row, index }: EditableRowProps) {
  const dispatch = useAppDispatch();
  const { calculate } = useCalculation();

  const recalc = useCallback(
    (changes: Partial<ReportRow>) => {
      const merged = { ...row, ...changes };
      const result = calculate({
        tankType: merged.tankType,
        level: merged.level,
        temperature: merged.temperature,
        densityAtT: merged.densityAtT,
        expansionCoefficient: merged.expansionCoefficient,
        invoiceMass: merged.invoiceMass,
        invoiceVolume: merged.invoiceVolume,
      });
      dispatch(updateRow({ id: row.id, changes, result }));
    },
    [calculate, dispatch, row],
  );

  function parseNumber(raw: string): number {
    const cleaned = raw.replace(/,/g, ".").replace(/\s+/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : Number.NaN;
  }

  return (
    <tr className={styles.row} data-deviation={getDeviationFlag(row)}>
      <td className={styles.indexCell}>{index + 1}</td>
      <EditableCell
        value={row.wagonNumber}
        onCommit={(v) => recalc({ wagonNumber: v.trim() })}
        placeholder="№ вагона"
        ariaLabel="Номер вагона"
      />
      <td className={styles.selectCell}>
        <TankTypeSelect
          value={row.tankType}
          onChange={(v) => recalc({ tankType: v })}
          ariaLabel={`Тип вагона ${index + 1}`}
        />
      </td>
      <EditableCell
        value={Number.isFinite(row.level) ? String(row.level) : ""}
        type="number"
        step="0.1"
        min={0}
        align="right"
        onCommit={(v) => recalc({ level: parseNumber(v) })}
        placeholder="0"
        ariaLabel="Висота, см"
      />
      <EditableCell
        value={Number.isFinite(row.temperature) ? String(row.temperature) : ""}
        type="number"
        step="0.1"
        align="right"
        onCommit={(v) => recalc({ temperature: parseNumber(v) })}
        placeholder="t°C"
        ariaLabel="Температура"
      />
      <EditableCell
        value={Number.isFinite(row.densityAtT) ? String(row.densityAtT) : ""}
        type="number"
        step="0.0001"
        align="right"
        onCommit={(v) => recalc({ densityAtT: parseNumber(v) })}
        placeholder="ρ_t"
        ariaLabel="Густина при t"
      />
      <EditableCell
        value={Number.isFinite(row.expansionCoefficient) ? String(row.expansionCoefficient) : ""}
        type="number"
        step="0.0001"
        align="right"
        onCommit={(v) => recalc({ expansionCoefficient: parseNumber(v) })}
        placeholder="γ"
        ariaLabel="Коефіцієнт об'ємного розширення"
      />
      <td className={styles.resultCell} data-align="right">
        {formatNumber(row.result.densityAt15, 4)}
      </td>
      <td className={styles.resultCell} data-align="right">
        {formatNumber(row.result.volumeLiters, 1)}
      </td>
      <td className={styles.resultCell} data-align="right">
        {formatNumber(row.result.massT, 3)}
      </td>
      <td className={styles.resultCell} data-align="right">
        ±{formatNumber(row.result.errorT, 3)}
      </td>
      <EditableCell
        value={
          row.invoiceMass !== undefined && Number.isFinite(row.invoiceMass)
            ? String(row.invoiceMass)
            : ""
        }
        type="number"
        step="0.001"
        align="right"
        onCommit={(v) =>
          recalc({ invoiceMass: v.trim() === "" ? undefined : parseNumber(v) })
        }
        placeholder="—"
        ariaLabel="Фактурна маса"
      />
      <td className={styles.resultCell} data-align="right">
        {row.result.differenceT !== undefined ? formatNumber(row.result.differenceT, 3) : "—"}
      </td>
      <td className={styles.resultCell} data-align="right">
        {row.result.deviationPercent !== undefined
          ? `${formatNumber(row.result.deviationPercent, 2)} %`
          : "—"}
      </td>
      <td className={styles.actionsCell}>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => dispatch(deleteRow(row.id))}
          aria-label="Видалити рядок"
          title="Видалити рядок"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function getDeviationFlag(row: ReportRow): "ok" | "warn" | "danger" | "" {
  if (row.result.deviationPercent === undefined || !Number.isFinite(row.result.deviationPercent)) {
    return "";
  }
  const abs = Math.abs(row.result.deviationPercent);
  if (abs <= 0.5) return "ok";
  if (abs <= 1) return "warn";
  return "danger";
}
