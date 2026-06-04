import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addRow, archiveBatch, clearBatch, setBatchMeta } from "@/store/slices/calculationSlice";
import { useCalculation } from "@/hooks/useCalculation";
import { EditableRowComponent } from "@/components/DataTable/EditableRow";
import { formatNumber } from "@/utils/format";
import styles from "./DataTable.module.css";

const DEFAULT_GAMMA = 0.0012;

export function DataTable() {
  const dispatch = useAppDispatch();
  const batch = useAppSelector((s) => s.calculation.currentBatch);
  const { calculate, ready } = useCalculation();

  const addEmptyRow = useCallback(() => {
    const params = {
      tankType: "",
      level: Number.NaN,
      temperature: Number.NaN,
      densityAtT: Number.NaN,
      expansionCoefficient: DEFAULT_GAMMA,
    };
    const result = calculate(params);
    dispatch(
      addRow({
        wagonNumber: "",
        tankType: params.tankType,
        level: params.level,
        temperature: params.temperature,
        densityAtT: params.densityAtT,
        expansionCoefficient: params.expansionCoefficient,
        result,
      }),
    );
  }, [calculate, dispatch]);

  const totals = batch.rows.reduce(
    (acc, row) => {
      if (Number.isFinite(row.result.massT)) acc.massT += row.result.massT;
      if (Number.isFinite(row.result.volumeLiters)) acc.volumeLiters += row.result.volumeLiters;
      if (Number.isFinite(row.result.errorT)) acc.errorT += row.result.errorT;
      if (row.invoiceMass !== undefined && Number.isFinite(row.invoiceMass)) {
        acc.invoiceMass += row.invoiceMass;
      }
      return acc;
    },
    { massT: 0, volumeLiters: 0, errorT: 0, invoiceMass: 0 },
  );

  return (
    <section className={styles.container} aria-label="Розрахункова таблиця">
      <div className={styles.metaForm}>
        <label className={styles.metaField}>
          <span>Дата</span>
          <input
            type="date"
            value={batch.date.slice(0, 10)}
            onChange={(e) =>
              dispatch(setBatchMeta({ date: new Date(e.target.value).toISOString() }))
            }
          />
        </label>
        <label className={styles.metaField}>
          <span>Продукт</span>
          <input
            type="text"
            value={batch.product}
            placeholder="А-92, ДП…"
            onChange={(e) => dispatch(setBatchMeta({ product: e.target.value }))}
          />
        </label>
        <label className={styles.metaField}>
          <span>Постачальник</span>
          <input
            type="text"
            value={batch.supplier}
            onChange={(e) => dispatch(setBatchMeta({ supplier: e.target.value }))}
          />
        </label>
        <label className={styles.metaField}>
          <span>Отримувач</span>
          <input
            type="text"
            value={batch.receiver}
            onChange={(e) => dispatch(setBatchMeta({ receiver: e.target.value }))}
          />
        </label>
        <label className={styles.metaField}>
          <span>Накладна</span>
          <input
            type="text"
            value={batch.invoiceNumber}
            onChange={(e) => dispatch(setBatchMeta({ invoiceNumber: e.target.value }))}
          />
        </label>
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={addEmptyRow}
          disabled={!ready}
        >
          + Додати вагон
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => dispatch(archiveBatch())}
          disabled={batch.rows.length === 0}
          title="Зберегти партію в історію і почати нову"
        >
          Архівувати партію
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={() => dispatch(clearBatch())}
          disabled={batch.rows.length === 0}
          title="Очистити поточну партію (історія не зачіпається)"
        >
          Очистити
        </button>
        <span className={styles.hint}>
          Подвійний клік на клітинку — редагування. Enter — зберегти, Esc — скасувати.
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2}>#</th>
              <th rowSpan={2}>№ вагона</th>
              <th rowSpan={2}>Тип</th>
              <th rowSpan={2}>Висота, см</th>
              <th rowSpan={2}>t, °C</th>
              <th rowSpan={2}>ρ_t</th>
              <th rowSpan={2}>γ</th>
              <th colSpan={4}>Розрахунок</th>
              <th rowSpan={2}>Маса з накладної, т</th>
              <th colSpan={2}>Відхилення</th>
              <th rowSpan={2}></th>
            </tr>
            <tr>
              <th>ρ_15</th>
              <th>Об'єм, л</th>
              <th>Маса, т</th>
              <th>± похибка, т</th>
              <th>Δ, т</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {batch.rows.length === 0 ? (
              <tr>
                <td colSpan={15} className={styles.emptyState}>
                  Додайте перший вагон, щоб почати розрахунок.
                </td>
              </tr>
            ) : (
              batch.rows.map((row, idx) => (
                <EditableRowComponent key={row.id} row={row} index={idx} />
              ))
            )}
          </tbody>
          {batch.rows.length > 0 && (
            <tfoot>
              <tr className={styles.totalsRow}>
                <td colSpan={8} className={styles.totalsLabel}>
                  Усього по партії:
                </td>
                <td data-align="right">{formatNumber(totals.volumeLiters, 1)}</td>
                <td data-align="right">{formatNumber(totals.massT, 3)}</td>
                <td data-align="right">±{formatNumber(totals.errorT, 3)}</td>
                <td data-align="right">
                  {totals.invoiceMass > 0 ? formatNumber(totals.invoiceMass, 3) : "—"}
                </td>
                <td data-align="right">
                  {totals.invoiceMass > 0
                    ? formatNumber(totals.massT - totals.invoiceMass, 3)
                    : "—"}
                </td>
                <td data-align="right">
                  {totals.invoiceMass > 0
                    ? `${formatNumber(
                        ((totals.massT - totals.invoiceMass) / totals.invoiceMass) * 100,
                        2,
                      )} %`
                    : "—"}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
