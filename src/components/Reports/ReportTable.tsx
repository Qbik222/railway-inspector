import { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { deleteHistoryBatch } from "@/store/slices/calculationSlice";
import { exportMultipleSheets, exportToExcel } from "@/utils/exportToExcel";
import { formatDate, formatNumber } from "@/utils/format";
import styles from "./ReportTable.module.css";

export function ReportTable() {
  const dispatch = useAppDispatch();
  const batch = useAppSelector((s) => s.calculation.currentBatch);
  const history = useAppSelector((s) => s.calculation.history);

  const totals = useMemo(() => {
    return batch.rows.reduce(
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
  }, [batch.rows]);

  const hasRows = batch.rows.length > 0;
  const diff = totals.invoiceMass > 0 ? totals.massT - totals.invoiceMass : null;
  const deviation =
    totals.invoiceMass > 0 ? ((totals.massT - totals.invoiceMass) / totals.invoiceMass) * 100 : null;

  return (
    <section className={styles.card} aria-labelledby="report-title">
      <div className={styles.header}>
        <div>
          <h2 id="report-title">Звіт</h2>
          <p className={styles.lead}>
            Формований документ за поточною партією. Можна експортувати в Excel, роздрукувати або
            заархівувати разом з історією.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => exportToExcel(batch)}
            disabled={!hasRows}
          >
            Експорт у Excel
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => window.print()}
            disabled={!hasRows}
          >
            Друк
          </button>
          {history.length > 0 && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => exportMultipleSheets([...history, batch].filter((b) => b.rows.length))}
            >
              Експорт історії
            </button>
          )}
        </div>
      </div>

      <div className={styles.metaBlock}>
        <div>
          <strong>Дата:</strong> {formatDate(batch.date)}
        </div>
        <div>
          <strong>Продукт:</strong> {batch.product || "—"}
        </div>
        <div>
          <strong>Постачальник:</strong> {batch.supplier || "—"}
        </div>
        <div>
          <strong>Отримувач:</strong> {batch.receiver || "—"}
        </div>
        <div>
          <strong>Накладна:</strong> {batch.invoiceNumber || "—"}
        </div>
      </div>

      {!hasRows ? (
        <p className={styles.empty}>
          У поточній партії немає рядків. Додайте вагони у таблиці, щоб сформувати звіт.
        </p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>№ вагона</th>
                <th>Тип</th>
                <th>Висота, см</th>
                <th>t, °C</th>
                <th>ρ_t</th>
                <th>ρ_15</th>
                <th>Об'єм, л</th>
                <th>Маса, т</th>
                <th>± похибка, т</th>
                <th>Маса з накладної, т</th>
                <th>Δ, т</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {batch.rows.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.wagonNumber || "—"}</td>
                  <td>{row.tankType || "—"}</td>
                  <td className={styles.right}>{formatNumber(row.level, 1)}</td>
                  <td className={styles.right}>{formatNumber(row.temperature, 1)}</td>
                  <td className={styles.right}>{formatNumber(row.densityAtT, 4)}</td>
                  <td className={styles.right}>{formatNumber(row.result.densityAt15, 4)}</td>
                  <td className={styles.right}>{formatNumber(row.result.volumeLiters, 1)}</td>
                  <td className={styles.right}>{formatNumber(row.result.massT, 3)}</td>
                  <td className={styles.right}>±{formatNumber(row.result.errorT, 3)}</td>
                  <td className={styles.right}>
                    {row.invoiceMass !== undefined && Number.isFinite(row.invoiceMass)
                      ? formatNumber(row.invoiceMass, 3)
                      : "—"}
                  </td>
                  <td className={styles.right}>
                    {row.result.differenceT !== undefined
                      ? formatNumber(row.result.differenceT, 3)
                      : "—"}
                  </td>
                  <td className={styles.right}>
                    {row.result.deviationPercent !== undefined
                      ? `${formatNumber(row.result.deviationPercent, 2)} %`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={7} style={{ textAlign: "right" }}>
                  Разом:
                </th>
                <th className={styles.right}>{formatNumber(totals.volumeLiters, 1)}</th>
                <th className={styles.right}>{formatNumber(totals.massT, 3)}</th>
                <th className={styles.right}>±{formatNumber(totals.errorT, 3)}</th>
                <th className={styles.right}>
                  {totals.invoiceMass > 0 ? formatNumber(totals.invoiceMass, 3) : "—"}
                </th>
                <th className={styles.right}>
                  {diff !== null ? formatNumber(diff, 3) : "—"}
                </th>
                <th className={styles.right}>
                  {deviation !== null ? `${formatNumber(deviation, 2)} %` : "—"}
                </th>
              </tr>
            </tfoot>
            </table>
          </div>

          <div className={styles.signatures}>
            <div className={styles.signatureRow}>
              <div>
                <p>Здав:</p>
                <div className={styles.signLine} />
                <small>підпис, ПІБ</small>
              </div>
              <div>
                <p>Прийняв:</p>
                <div className={styles.signLine} />
                <small>підпис, ПІБ</small>
              </div>
              <div>
                <p>Лаборант:</p>
                <div className={styles.signLine} />
                <small>підпис, ПІБ</small>
              </div>
            </div>
          </div>
        </>
      )}

      {history.length > 0 && (
        <div className={styles.history}>
          <h3>Історія</h3>
          <ul>
            {history.map((b) => (
              <li key={b.id}>
                <span>
                  {formatDate(b.date)} · {b.product || "без продукту"} · {b.rows.length} вагонів
                </span>
                <span className={styles.historyActions}>
                  <button type="button" onClick={() => exportToExcel(b)}>
                    Excel
                  </button>
                  <button
                    type="button"
                    className={styles.deleteHistory}
                    onClick={() => dispatch(deleteHistoryBatch(b.id))}
                  >
                    Видалити
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
