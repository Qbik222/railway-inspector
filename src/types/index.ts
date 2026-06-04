/**
 * Глобальні типи додатку для розрахунку об'єму та маси нафтопродуктів.
 * Узгоджено з форматом Excel-файла `ANALIK Розрахунок. v2.2 Бориспіль.xlsx`.
 */

/** Дані пристрою заміру (метроштока / рулетки / автоматичного рівнеміра). */
export interface InstrumentData {
  /** Висота нальоту в сантиметрах (може бути дробовою для інтерполяції). */
  level: number;
  /** Температура нафтопродукту, °C. */
  temperature: number;
  /** Густина при температурі t, кг/м³ або г/см³ — зберігається у тих самих одиницях, що й уведено. */
  densityAtT: number;
}

/** Один запис довідника калібрувань. */
export interface CalibrationRecord {
  /** Рівень у см (0..340). */
  level: number;
  /** Об'єм у літрах за типами вагонів: ключ — назва типу, значення — об'єм. NaN — немає даних. */
  volumes: Record<string, number>;
}

/** Параметри одного розрахунку. */
export interface CalculationParams {
  /** Тип вагона (наприклад, `66`, `73`, `1407G`). */
  tankType: string;
  /** Висота нальоту, см. */
  level: number;
  /** Температура нафтопродукту, °C. */
  temperature: number;
  /** Густина при температурі t. */
  densityAtT: number;
  /** Коефіцієнт об'ємного розширення (зазвичай 0.0012 для бензину, 0.00077 — для ДП). */
  expansionCoefficient: number;
  /** Об'єм фактурний (з накладної), необов'язково. */
  invoiceVolume?: number;
  /** Маса фактурна (з накладної), необов'язково. */
  invoiceMass?: number;
}

/** Результат розрахунку для одного вагона. */
export interface CalculationResult {
  /** Об'єм у літрах. */
  volumeLiters: number;
  /** Об'єм у м³ (м³ = л / 1000). */
  volumeM3: number;
  /** Густина, приведена до 15°C. */
  densityAt15: number;
  /** Маса в тоннах. */
  massT: number;
  /** Похибка визначення маси, т (≈ 0.65 % від маси). */
  errorT: number;
  /** Різниця з накладною (т), якщо вказано invoiceMass. */
  differenceT?: number;
  /** Відхилення у відсотках. */
  deviationPercent?: number;
}

/** Рядок у звіті — об'єднує введені дані, параметри і результат. */
export interface ReportRow {
  id: string;
  /** Номер вагона. */
  wagonNumber: string;
  /** Тип вагона. */
  tankType: string;
  /** Висота нальоту, см. */
  level: number;
  /** Температура, °C. */
  temperature: number;
  /** Густина при температурі t. */
  densityAtT: number;
  /** Коефіцієнт об'ємного розширення. */
  expansionCoefficient: number;
  /** Фактурні значення (з накладної). */
  invoiceVolume?: number;
  invoiceMass?: number;
  /** Результат розрахунку (заповнюється редюсером при додаванні/оновленні). */
  result: CalculationResult;
  /** Час створення/останнього оновлення в ISO-форматі. */
  updatedAt: string;
}

/** Довідник вагона. */
export interface TankData {
  /** Номер вагона. */
  number: string;
  /** Тип вагона. */
  tankType: string;
  /** Повний об'єм, м³. */
  volume: number;
  /** Модель вагона. */
  model: string;
}

/** Розшифровка одного звіту (партія вагонів). */
export interface ReportBatch {
  id: string;
  /** Дата звіту в ISO. */
  date: string;
  /** Назва продукту (А-92, ДП, ...). */
  product: string;
  /** Постачальник. */
  supplier: string;
  /** Отримувач. */
  receiver: string;
  /** Номер ТТН/накладної. */
  invoiceNumber: string;
  /** Рядки звіту. */
  rows: ReportRow[];
}
