import { useMemo, useState } from "react";
import { TankTypeSelect } from "@/components/common/TankTypeSelect";
import { useCalculation } from "@/hooks/useCalculation";
import { useAppDispatch } from "@/hooks/redux";
import { addRow } from "@/store/slices/calculationSlice";
import { formatNumber } from "@/utils/format";
import styles from "./SingleCalculation.module.css";

const DEFAULT_GAMMA = 0.0012;

interface FormState {
  wagonNumber: string;
  tankType: string;
  level: string;
  temperature: string;
  densityAtT: string;
  expansionCoefficient: string;
  invoiceMass: string;
}

const empty: FormState = {
  wagonNumber: "",
  tankType: "",
  level: "",
  temperature: "20",
  densityAtT: "",
  expansionCoefficient: String(DEFAULT_GAMMA),
  invoiceMass: "",
};

function parseNum(raw: string): number {
  const v = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(v) ? v : Number.NaN;
}

export function SingleCalculation() {
  const [form, setForm] = useState<FormState>(empty);
  const { calculate, ready } = useCalculation();
  const dispatch = useAppDispatch();

  const params = useMemo(
    () => ({
      tankType: form.tankType,
      level: parseNum(form.level),
      temperature: parseNum(form.temperature),
      densityAtT: parseNum(form.densityAtT),
      expansionCoefficient: parseNum(form.expansionCoefficient),
      invoiceMass: form.invoiceMass ? parseNum(form.invoiceMass) : undefined,
    }),
    [form],
  );

  const result = useMemo(() => calculate(params), [calculate, params]);
  const canCalc =
    ready &&
    form.tankType !== "" &&
    Number.isFinite(params.level) &&
    Number.isFinite(params.densityAtT) &&
    Number.isFinite(params.temperature);

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function addToBatch() {
    dispatch(
      addRow({
        wagonNumber: form.wagonNumber.trim(),
        tankType: form.tankType,
        level: params.level,
        temperature: params.temperature,
        densityAtT: params.densityAtT,
        expansionCoefficient: params.expansionCoefficient,
        invoiceMass: params.invoiceMass,
        result,
      }),
    );
    setForm(empty);
  }

  return (
    <section className={styles.card} aria-labelledby="single-calc-title">
      <h2 id="single-calc-title">Один вагон</h2>
      <p className={styles.lead}>
        Швидкий розрахунок без додавання у таблицю. Заповніть поля — формула
        перерахує миттєво. Кнопка «Додати до партії» збереже рядок у звіті.
      </p>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>№ вагона</span>
          <input
            type="text"
            value={form.wagonNumber}
            onChange={(e) => setField("wagonNumber", e.target.value)}
            placeholder="наприклад, 53305405"
          />
        </label>

        <label className={styles.field}>
          <span>Тип вагона</span>
          <TankTypeSelect
            value={form.tankType}
            onChange={(v) => setField("tankType", v)}
          />
        </label>

        <label className={styles.field}>
          <span>Висота нальоту, см</span>
          <input
            type="number"
            step="0.1"
            min={0}
            value={form.level}
            onChange={(e) => setField("level", e.target.value)}
            placeholder="напр., 100.5"
          />
        </label>

        <label className={styles.field}>
          <span>Температура, °C</span>
          <input
            type="number"
            step="0.1"
            value={form.temperature}
            onChange={(e) => setField("temperature", e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Густина при t (ρ_t)</span>
          <input
            type="number"
            step="0.0001"
            value={form.densityAtT}
            onChange={(e) => setField("densityAtT", e.target.value)}
            placeholder="напр., 0.745"
          />
        </label>

        <label className={styles.field}>
          <span>Коефіцієнт γ</span>
          <input
            type="number"
            step="0.0001"
            value={form.expansionCoefficient}
            onChange={(e) => setField("expansionCoefficient", e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Маса з накладної, т (опціонально)</span>
          <input
            type="number"
            step="0.001"
            value={form.invoiceMass}
            onChange={(e) => setField("invoiceMass", e.target.value)}
            placeholder="—"
          />
        </label>
      </div>

      <div className={styles.results} aria-live="polite">
        <ResultTile label="Об'єм" value={formatNumber(result.volumeLiters, 1)} unit="л" />
        <ResultTile label="ρ_15" value={formatNumber(result.densityAt15, 4)} unit="" />
        <ResultTile label="Маса" value={formatNumber(result.massT, 3)} unit="т" highlight />
        <ResultTile label="± похибка" value={formatNumber(result.errorT, 3)} unit="т" />
        {result.differenceT !== undefined && (
          <ResultTile
            label="Різниця Δ"
            value={formatNumber(result.differenceT, 3)}
            unit="т"
            tone={
              Math.abs(result.deviationPercent ?? 0) <= 0.5
                ? "ok"
                : Math.abs(result.deviationPercent ?? 0) <= 1
                  ? "warn"
                  : "danger"
            }
          />
        )}
        {result.deviationPercent !== undefined && (
          <ResultTile
            label="Відхилення"
            value={formatNumber(result.deviationPercent, 2)}
            unit="%"
          />
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={addToBatch}
          disabled={!canCalc}
        >
          + Додати до партії
        </button>
        <button type="button" className={styles.secondary} onClick={() => setForm(empty)}>
          Скинути форму
        </button>
      </div>
    </section>
  );
}

function ResultTile({
  label,
  value,
  unit,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <div className={styles.tile} data-highlight={highlight ? "true" : undefined} data-tone={tone}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>
        {value} <small>{unit}</small>
      </span>
    </div>
  );
}
