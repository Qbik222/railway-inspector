import type {
  CalculationParams,
  CalculationResult,
  CalibrationRecord,
} from "@/types";

/**
 * Калібрувальна мапа: `level` (см) → (`tankType` → об'єм у літрах).
 * Створюється один раз після завантаження CSV.
 */
export type CalibrationMap = Map<number, Map<string, number>>;

/** Будує мапу `level → tankType → volume(л)` з пласких записів. */
export function buildCalibrationMap(records: CalibrationRecord[]): CalibrationMap {
  const map: CalibrationMap = new Map();
  for (const record of records) {
    const inner = new Map<string, number>();
    for (const [tankType, vol] of Object.entries(record.volumes)) {
      inner.set(tankType, vol);
    }
    map.set(record.level, inner);
  }
  return map;
}

/**
 * Лінійна інтерполяція об'єму для дробового рівня.
 *
 * Якщо рівень — ціле число й табличне значення є — повертаємо його напряму.
 * Інакше беремо значення в `floor(level)` і `ceil(level)` та інтерполюємо.
 * Якщо одне зі значень відсутнє (`NaN`) — повертаємо `NaN`.
 */
export function interpolateVolume(
  level: number,
  tankType: string,
  map: CalibrationMap,
): number {
  if (!Number.isFinite(level) || level < 0) {
    return Number.NaN;
  }

  const lowerLevel = Math.floor(level);
  const upperLevel = Math.ceil(level);

  const lowerRow = map.get(lowerLevel);
  const upperRow = map.get(upperLevel);
  if (!lowerRow || !upperRow) {
    return Number.NaN;
  }

  const lowerVol = lowerRow.get(tankType);
  const upperVol = upperRow.get(tankType);

  if (lowerVol === undefined || upperVol === undefined) {
    return Number.NaN;
  }
  if (!Number.isFinite(lowerVol) || !Number.isFinite(upperVol)) {
    return Number.NaN;
  }

  if (lowerLevel === upperLevel) {
    return lowerVol;
  }

  const fraction = level - lowerLevel;
  return lowerVol + (upperVol - lowerVol) * fraction;
}

/**
 * Приведення густини до 15°C: `ρ15 = ρ_t + γ × (t − 15)`.
 *
 * @param densityAtT густина при поточній температурі `t`
 * @param t          температура нафтопродукту, °C
 * @param gamma      коефіцієнт об'ємного розширення (за замовчуванням 0.0012)
 */
export function calculateDensityAt15(
  densityAtT: number,
  t: number,
  gamma = 0.0012,
): number {
  if (!Number.isFinite(densityAtT) || !Number.isFinite(t)) {
    return Number.NaN;
  }
  return densityAtT + gamma * (t - 15);
}

/**
 * Маса = об'єм (м³) × густина (приведена до 15°C, г/см³ → т/м³).
 * Густина в г/см³ і т/м³ числово збігаються, тому формула без множників.
 */
export function calculateMass(volumeM3: number, densityAt15: number): number {
  if (!Number.isFinite(volumeM3) || !Number.isFinite(densityAt15)) {
    return Number.NaN;
  }
  return volumeM3 * densityAt15;
}

/** Похибка обчисленої маси ≈ 0.65 %. */
export function calculateError(mass: number): number {
  if (!Number.isFinite(mass)) return Number.NaN;
  return mass * 0.0065;
}

/** Різниця між обчисленою та фактурною масою. */
export function calculateDifference(
  calculated: number,
  invoice: number,
): { difference: number; deviationPercent: number } {
  const difference = calculated - invoice;
  const deviationPercent =
    invoice !== 0 && Number.isFinite(invoice) ? (difference / invoice) * 100 : Number.NaN;
  return { difference, deviationPercent };
}

/** Повний розрахунок з усіма проміжними результатами. */
export function performCalculation(
  params: CalculationParams,
  map: CalibrationMap,
): CalculationResult {
  const volumeLiters = interpolateVolume(params.level, params.tankType, map);
  const volumeM3 = Number.isFinite(volumeLiters) ? volumeLiters / 1000 : Number.NaN;
  const densityAt15 = calculateDensityAt15(
    params.densityAtT,
    params.temperature,
    params.expansionCoefficient,
  );
  const massT = calculateMass(volumeM3, densityAt15);
  const errorT = calculateError(massT);

  const result: CalculationResult = {
    volumeLiters,
    volumeM3,
    densityAt15,
    massT,
    errorT,
  };

  if (Number.isFinite(params.invoiceMass ?? Number.NaN)) {
    const diff = calculateDifference(massT, params.invoiceMass!);
    result.differenceT = diff.difference;
    result.deviationPercent = diff.deviationPercent;
  }

  return result;
}
