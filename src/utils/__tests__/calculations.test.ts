import { describe, expect, it } from "vitest";
import {
  buildCalibrationMap,
  calculateDensityAt15,
  calculateDifference,
  calculateError,
  calculateMass,
  interpolateVolume,
  performCalculation,
} from "@/utils/calculations";
import { cleanCalibrationCell, parseCalibrationCSV } from "@/utils/csvParser";
import calibrationCsv from "@csv/calibration.csv?raw";

describe("cleanCalibrationCell", () => {
  it("повертає NaN для порожньої клітинки", () => {
    expect(cleanCalibrationCell("")).toBeNaN();
    expect(cleanCalibrationCell("   ")).toBeNaN();
  });

  it("парсить звичайне ціле число", () => {
    expect(cleanCalibrationCell("12345")).toBe(12345);
  });

  it("розбирає артефакт Vol_X=Y", () => {
    expect(cleanCalibrationCell("Vol_20=2002")).toBe(2002);
    expect(cleanCalibrationCell("Vol_125=29014")).toBe(29014);
  });

  it("видаляє пробіли всередині числа", () => {
    expect(cleanCalibrationCell("70 126")).toBe(70126);
    expect(cleanCalibrationCell("13 484")).toBe(13484);
  });

  it("замінює першу кому на крапку", () => {
    expect(cleanCalibrationCell("264,7")).toBeCloseTo(264.7, 5);
    expect(cleanCalibrationCell("13249, 1")).toBeCloseTo(13249.1, 5);
  });

  it("підтримує крапку як десятковий розділювач", () => {
    expect(cleanCalibrationCell("46953.1")).toBeCloseTo(46953.1, 5);
  });
});

describe("parseCalibrationCSV", () => {
  it("парсить заголовок і повертає 114 типів вагонів", () => {
    const { tankTypes, records } = parseCalibrationCSV(calibrationCsv);
    expect(tankTypes.length).toBe(114);
    expect(tankTypes[0]).toBe("8");
    expect(tankTypes.at(-1)).toBe("9503аG");
    expect(records.length).toBe(341);
    expect(records[0].level).toBe(0);
    expect(records.at(-1)?.level).toBe(340);
  });

  it("очищає Vol_X=Y для типу 144 на рівні 20", () => {
    const { records, tankTypes } = parseCalibrationCSV(calibrationCsv);
    expect(tankTypes).toContain("144");
    const row20 = records.find((r) => r.level === 20);
    expect(row20?.volumes["144"]).toBe(2002);
  });
});

describe("interpolateVolume", () => {
  const { records } = parseCalibrationCSV(calibrationCsv);
  const map = buildCalibrationMap(records);

  it("повертає табличне значення для цілого рівня", () => {
    const tankType = "66";
    const row100 = records.find((r) => r.level === 100)?.volumes[tankType];
    expect(row100).toBeDefined();
    expect(interpolateVolume(100, tankType, map)).toBe(row100!);
  });

  it("лінійно інтерполює між двома сусідніми рівнями", () => {
    const tankType = "66";
    const lower = records.find((r) => r.level === 100)!.volumes[tankType];
    const upper = records.find((r) => r.level === 101)!.volumes[tankType];
    const mid = interpolateVolume(100.5, tankType, map);
    expect(mid).toBeCloseTo((lower + upper) / 2, 5);
  });

  it("повертає NaN для невідомого типу", () => {
    expect(interpolateVolume(100, "невідомий", map)).toBeNaN();
  });

  it("повертає NaN для рівня поза межами таблиці", () => {
    expect(interpolateVolume(-1, "66", map)).toBeNaN();
    expect(interpolateVolume(1000, "66", map)).toBeNaN();
  });
});

describe("calculateDensityAt15", () => {
  it("за t = 15 повертає вхідну густину", () => {
    const result = calculateDensityAt15(0.745, 15);
    expect(result).toBeCloseTo(0.745, 6);
  });

  it("за t > 15 додає поправку", () => {
    const result = calculateDensityAt15(0.78, 20);
    expect(result).toBeCloseTo(0.78 + 0.0012 * 5, 6);
  });

  it("за t < 15 віднімає поправку", () => {
    const result = calculateDensityAt15(0.78, 10);
    expect(result).toBeCloseTo(0.78 - 0.0012 * 5, 6);
  });
});

describe("calculateMass / calculateError / calculateDifference", () => {
  it("масa = V × ρ15", () => {
    expect(calculateMass(50, 0.739)).toBeCloseTo(50 * 0.739, 6);
  });

  it("похибка дорівнює 0.65 % від маси", () => {
    expect(calculateError(100)).toBeCloseTo(0.65, 6);
  });

  it("calculateDifference повертає різницю і відсоток", () => {
    const { difference, deviationPercent } = calculateDifference(101.5, 100);
    expect(difference).toBeCloseTo(1.5, 6);
    expect(deviationPercent).toBeCloseTo(1.5, 6);
  });
});

describe("performCalculation (end-to-end)", () => {
  const { records } = parseCalibrationCSV(calibrationCsv);
  const map = buildCalibrationMap(records);

  it("повний прогон для тестового вагона", () => {
    const result = performCalculation(
      {
        tankType: "66",
        level: 100,
        temperature: 15,
        densityAtT: 0.745,
        expansionCoefficient: 0.0012,
      },
      map,
    );

    const expectedVolume = records.find((r) => r.level === 100)!.volumes["66"];
    expect(result.volumeLiters).toBe(expectedVolume);
    expect(result.volumeM3).toBeCloseTo(expectedVolume / 1000, 6);
    expect(result.densityAt15).toBeCloseTo(0.745, 4);
    expect(result.massT).toBeCloseTo((expectedVolume / 1000) * 0.745, 4);
    expect(result.errorT).toBeCloseTo(result.massT * 0.0065, 5);
  });

  it("додає різницю, якщо вказано invoiceMass", () => {
    const result = performCalculation(
      {
        tankType: "66",
        level: 100,
        temperature: 15,
        densityAtT: 0.745,
        expansionCoefficient: 0.0012,
        invoiceMass: 15,
      },
      map,
    );
    expect(result.differenceT).toBeDefined();
    expect(result.deviationPercent).toBeDefined();
  });
});
